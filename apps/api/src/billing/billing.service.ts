/**
 * Billing Service - Enterprise Grade
 * 
 * Responsabilidades:
 * - Procesamiento de pagos (escrow management)
 * - Cálculo de comisiones y impuestos
 * - Gestión de carteras (wallets)
 * - Solicitudes de retiro (payouts)
 * - Auditoría y compliance
 * 
 * Características:
 * - Transacciones ACID
 * - Idempotencia
 * - Logging detallado
 * - Error handling profesional
 */

import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { CommissionService } from './commission.service';
import { PaymentAuditLog, throwBillingException } from './billing.exceptions';
import { WalletBalance, TransactionHistory } from './billing.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly MIN_WITHDRAWAL = 5000; // ARS
  private readonly MAX_WITHDRAWAL = 1000000; // ARS

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private commissionService: CommissionService,
  ) {}

  /**
   * Asegura que la billetera exista para un usuario
   * @param userId ID del usuario
   * @returns Billetera creada o existente
   */
  async ensureWalletExists(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      PaymentAuditLog.log('info', 'WALLET_CREATED', { userId });
      return this.prisma.wallet.create({
        data: { userId },
      });
    }

    return wallet;
  }

  /**
   * Obtener saldo de billetera
   * @param userId ID del usuario
   * @returns Balance con detalles
   */
  async getWalletBalance(userId: string): Promise<WalletBalance> {
    const wallet = await this.ensureWalletExists(userId);

    return {
      userId,
      balancePending: Number(wallet.balancePending),
      balanceAvailable: Number(wallet.balanceAvailable),
      totalBalance: Number(wallet.balancePending) + Number(wallet.balanceAvailable),
      currency: 'ARS',
      lastUpdated: wallet.updatedAt,
    };
  }

  /**
   * Procesar pago entrante (cliente → plataforma → trabajador escrow)
   * 
   * Flujo:
   * 1. Validar servicio y trabajador asignado
   * 2. Verificar email y KYC (SEGURIDAD)
   * 3. Asegurar billetera del trabajador
   * 4. Crear transacción de entrada
   * 5. Actualizar saldo pending (escrow)
   * 6. Actualizar estado del servicio
   * 
   * @param jobId ID del servicio
   * @param paymentId ID de pago de Mercado Pago
   * @param totalAmount Monto total del cliente
   * @param idempotencyKey Clave para evitar duplicados
   */
  async processPaymentIn(
    jobId: string,
    paymentId: string,
    totalAmount: number,
    idempotencyKey?: string,
  ) {
    try {
      // 1. Validaciones
      const job = await this.prisma.serviceRequest.findUnique({
        where: { id: jobId },
        include: { 
          worker: { include: { user: true } },
          client: { include: { user: true } }
        },
      });

      if (!job) {
        throwBillingException('SERVICE_NOT_FOUND');
      }

      if (!job.workerId) {
        throwBillingException(
          'SERVICE_INVALID_PRICE',
          'No hay trabajador asignado para este servicio',
        );
      }

      // 2. SEGURIDAD: Verificar email del cliente
      if (!job.client?.user?.isEmailVerified) {
        throw new BadRequestException(
          'Debes verificar tu email antes de realizar pagos. Revisa tu bandeja de entrada.'
        );
      }

      // 3. SEGURIDAD: Verificar KYC del trabajador antes de asignar fondos
      if (!job.worker?.isKycVerified || job.worker?.kycStatus !== 'APPROVED') {
        throw new BadRequestException(
          'El trabajador debe completar su verificación de identidad (KYC) antes de recibir pagos.'
        );
      }

      // Si el servicio ya está marcado como completado, evitamos reprocesar
      if (String(job.status) === 'COMPLETED') {
        throwBillingException('SERVICE_ALREADY_PAID');
      }

      const effectiveIdempotencyKey = idempotencyKey ?? paymentId;

      // 4. Calcular comisión usando el nuevo modelo (5% + 5%)
      const breakdown = this.commissionService.calculateFromTotalAmount(
        totalAmount,
      );

      // 5. Asegurar billetera del trabajador
      const workerWallet = await this.ensureWalletExists(job.workerId);

      // 5. Transacción ACID
      const result = await this.prisma.$transaction(async (tx) => {
        // A. Crear transacción en estado PENDING con idempotencia
        let transaction;
        try {
          transaction = await tx.transaction.create({
            data: {
              walletId: workerWallet.id,
              jobId: jobId,
              type: 'ESCROW_ALLOCATION',
              amount: new Prisma.Decimal(breakdown.workerNetAmount),
              status: 'PENDING',
              description: `Fondos en escrow por trabajo #${jobId.slice(0, 8)}`,
              referenceId: paymentId,
              // Campo único para idempotencia (debe existir en el schema)
              idempotencyKey: effectiveIdempotencyKey,
            },
          });
        } catch (error) {
          // Si es clave duplicada (idempotencia), ignoramos de forma segura
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            PaymentAuditLog.log('info', 'PAYMENT_DUPLICATE', {
              jobId,
              idempotencyKey: effectiveIdempotencyKey,
              paymentId,
            });
            // No arrojamos error, salimos con estado de ya procesado
            return { transaction: null, breakdown, alreadyProcessed: true };
          }
          throw error;
        }

        // B. Actualizar saldo pending del trabajador (Decimal)
        await tx.wallet.update({
          where: { id: workerWallet.id },
          data: { balancePending: { increment: new Prisma.Decimal(breakdown.workerNetAmount) } },
        });

        // C. Actualizar estado del servicio y campos de precio
        await tx.serviceRequest.update({
          where: { id: jobId },
          data: {
            status: 'ACCEPTED',
            // Asignar breakdown a campos específicos
            // Nota: si el schema usa Decimal, Prisma.Decimal; si usa Float, número
            priceWorkerNet: breakdown.workerNetAmount,
            pricePlatformFee: breakdown.platformFee,
            // Mantener JSON de precio para transparencia
            price: {
              total: breakdown.totalAmount,
              workerNet: breakdown.workerNetAmount,
              platformFee: breakdown.platformFee,
              taxAmount: breakdown.taxAmount,
              gatewayFee: breakdown.paymentGatewayFee,
              currency: 'ARS',
            },
          },
        });

        // D. Marcar transacción como COMPLETED y auditar el cambio
        const completed = await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: 'COMPLETED' },
        });

        PaymentAuditLog.log('info', 'TRANSACTION_COMPLETED', {
          transactionId: completed.id,
          type: completed.type,
          amount: completed.amount?.toString?.() ?? breakdown.workerNetAmount,
          status: 'COMPLETED',
        });

        return { transaction: completed, breakdown, alreadyProcessed: false };
      });

      // 6. Logging de auditoría
      PaymentAuditLog.log(
        'info',
        'PAYMENT_IN_PROCESSED',
        {
          jobId,
          paymentId,
          totalAmount,
          workerNetAmount: breakdown.workerNetAmount,
          workerId: job.workerId,
          platformFee: breakdown.platformFee,
        },
        false,
      );

      if (result.alreadyProcessed) {
        return { status: 'already_processed' };
      }

      return {
        status: 'completed',
        transaction: result.transaction,
        breakdown: result.breakdown,
      };
    } catch (error) {
      PaymentAuditLog.log('error', 'PAYMENT_IN_FAILED', {
        jobId,
        paymentId,
        error: error.message,
      });

      // Mapear errores conocidos
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Duplicado
          throwBillingException('PAYMENT_DUPLICATE');
        }
      }
      if ((error as any)?.errorCode) throw error as any;
      throw new InternalServerErrorException('Error procesando pago');
    }
  }

  /**
   * Liberar fondos en escrow tras completar servicio
   * 
   * Movimiento: balancePending → balanceAvailable
   * 
   * @param jobId ID del servicio completado
   */
  async releaseFunds(jobId: string) {
    try {
      const job = await this.prisma.serviceRequest.findUnique({
        where: { id: jobId },
        include: { worker: true },
      });

      if (!job) {
        throwBillingException('SERVICE_NOT_FOUND');
      }

      // SEGURIDAD: Verificar KYC del trabajador antes de liberar fondos
      if (!job.worker?.isKycVerified || job.worker?.kycStatus !== 'APPROVED') {
        throw new BadRequestException(
          'El trabajador debe completar su verificación de identidad (KYC) antes de recibir pagos.'
        );
      }

      // Si el trabajo no está en un estado aceptado/avanzado, evitar liberar
      if (job.status !== 'ACCEPTED' && job.status !== 'IN_PROGRESS') {
        throwBillingException(
          'SERVICE_INVALID_PRICE',
          `No se pueden liberar fondos: estado actual es ${job.status}`,
        );
      }

      // Idempotencia
      if (String(job.status) === 'COMPLETED') {
        return { status: 'already_released' };
      }

      const workerWallet = await this.ensureWalletExists(job.workerId);
      const amountToRelease = job.priceWorkerNet;

      await this.prisma.$transaction(async (tx) => {
        // 1. Mover de escrow a disponible (Decimal)
        await tx.wallet.update({
          where: { id: workerWallet.id },
          data: {
            balancePending: { decrement: new Prisma.Decimal(amountToRelease) },
            balanceAvailable: { increment: new Prisma.Decimal(amountToRelease) },
          },
        });

        // 2. Registrar liberación PENDING → COMPLETED
        const pendingRelease = await tx.transaction.create({
          data: {
            walletId: workerWallet.id,
            jobId: jobId,
            type: 'ESCROW_RELEASE',
            amount: new Prisma.Decimal(amountToRelease),
            status: 'PENDING',
            description: `Fondos liberados tras completar servicio #${jobId.slice(0, 8)}`,
          },
        });

        const completedRelease = await tx.transaction.update({
          where: { id: pendingRelease.id },
          data: { status: 'COMPLETED' },
        });

        PaymentAuditLog.log('info', 'TRANSACTION_COMPLETED', {
          transactionId: completedRelease.id,
          type: completedRelease.type,
          amount: completedRelease.amount?.toString?.() ?? amountToRelease,
          status: 'COMPLETED',
        });

        // 3. Marcar servicio como completado
        await tx.serviceRequest.update({
          where: { id: jobId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      });

      PaymentAuditLog.log('info', 'ESCROW_RELEASED', {
        jobId,
        workerId: job.workerId,
        amount: amountToRelease,
      });

      return { status: 'released', amount: amountToRelease };
    } catch (error) {
      PaymentAuditLog.log('error', 'ESCROW_RELEASE_FAILED', {
        jobId,
        error: error.message,
      });

      if (error.errorCode) throw error;
      throw new InternalServerErrorException('Error liberando fondos');
    }
  }

  /**
   * Obtener historial de transacciones
   * @param userId ID del usuario
   * @param limit Cantidad de transacciones a retornar
   * @returns Array de transacciones
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50,
  ): Promise<TransactionHistory[]> {
    const wallet = await this.ensureWalletExists(userId);

    const transactions = await this.prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const currentBalance = Number(wallet.balanceAvailable) + Number(wallet.balancePending);
    return transactions.map((t) => ({
      id: t.id,
      walletId: t.walletId,
      type: t.type as any,
      amount: Number(t.amount),
      status: t.status as any,
      description: t.description ?? '',
      referenceId: t.referenceId ?? undefined,
      createdAt: t.createdAt,
      completedAt: t.updatedAt,
      balance: currentBalance,
    }));
  }

  /**
   * Solicitar retiro de fondos
   * 
   * Validaciones:
   * - Saldo suficiente
   * - Monto dentro de límites
   * - CBU/alias válido
   * 
   * @param userId ID del trabajador
   * @param amount Monto a retirar
   * @param cbuAlias CBU o alias para transferencia
   */
  async requestPayout(userId: string, amount: number, cbuAlias: string) {
    try {
      // 0. SEGURIDAD: Verificar que el usuario sea un trabajador con KYC aprobado
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { workerProfile: true },
      });

      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      // Solo trabajadores pueden solicitar retiros
      if (user.role !== 'WORKER') {
        throw new BadRequestException('Solo los trabajadores pueden solicitar retiros');
      }

      // Verificar email
      if (!user.isEmailVerified) {
        throw new BadRequestException(
          'Debes verificar tu email antes de solicitar retiros. Revisa tu bandeja de entrada.'
        );
      }

      // Verificar KYC
      if (!user.workerProfile?.isKycVerified || user.workerProfile?.kycStatus !== 'APPROVED') {
        throw new BadRequestException(
          'Debes completar tu verificación de identidad (KYC) antes de poder retirar fondos.'
        );
      }

      // 1. Validaciones de monto
      if (amount < this.MIN_WITHDRAWAL) {
        throwBillingException(
          'WALLET_INSUFFICIENT_BALANCE',
          `El retiro mínimo es de ARS ${this.MIN_WITHDRAWAL}`,
        );
      }

      if (amount > this.MAX_WITHDRAWAL) {
        throwBillingException(
          'SERVICE_INVALID_PRICE',
          `El retiro máximo es de ARS ${this.MAX_WITHDRAWAL}`,
        );
      }

      if (!cbuAlias || cbuAlias.length < 3) {
        throwBillingException(
          'SERVICE_INVALID_PRICE',
          'CBU o alias inválido',
        );
      }

      // 2. Verificar saldo
      const wallet = await this.ensureWalletExists(userId);
      const availableBalance = Number(wallet.balanceAvailable);

      if (availableBalance < amount) {
        throwBillingException(
          'WALLET_INSUFFICIENT_BALANCE',
          `Tu saldo disponible es de ARS ${availableBalance.toFixed(2)}`,
        );
      }

      // 3. Crear solicitud de retiro
      const payoutRequest = await this.prisma.$transaction(
        async (tx) => {
          // A. Descontar saldo (bloquear fondos)
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balanceAvailable: { decrement: new Prisma.Decimal(amount) } },
          });

          // B. Registrar transacción de salida
          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              type: 'WITHDRAWAL',
              amount: new Prisma.Decimal(-amount),
              status: 'PENDING',
              description: `Solicitud de retiro a ${cbuAlias.slice(-4)}`,
            },
          });

          // C. Crear payout request
          return tx.payoutRequest.create({
            data: {
              walletId: wallet.id,
              userId,
              amount,
              cbuAlias,
              status: 'REQUESTED',
            },
          });
        },
      );

      PaymentAuditLog.log('info', 'PAYOUT_REQUESTED', {
        userId,
        amount,
        cbuAlias: cbuAlias.slice(-4),
        payoutId: payoutRequest.id,
      });

      return {
        status: 'requested',
        payoutId: payoutRequest.id,
        amount,
        remainingBalance: availableBalance - amount,
        estimatedCompletion: '2-3 días hábiles',
      };
    } catch (error) {
      PaymentAuditLog.log('error', 'PAYOUT_REQUEST_FAILED', {
        userId,
        amount,
        error: error.message,
      });

      if (error.errorCode) throw error;
      throw new InternalServerErrorException('Error solicitando retiro');
    }
  }

  /**
   * Crear ajuste de precio (materiales, tiempo extra)
   * 
   * @param jobId ID del servicio
   * @param amount Monto del ajuste
   * @param reason Descripción del ajuste
   * @param isCommissionable Si aplican comisiones
   */
  async createAdjustment(
    jobId: string,
    amount: number,
    reason: string,
    isCommissionable: boolean = true,
  ) {
    if (amount <= 0) {
      throwBillingException('SERVICE_INVALID_PRICE', 'El monto debe ser mayor a 0');
    }

    try {
      const job = await this.prisma.serviceRequest.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throwBillingException('SERVICE_NOT_FOUND');
      }

      const breakdown = this.commissionService.calculateCommissionBreakdown(amount);
      const workerNetDelta = isCommissionable
        ? breakdown.workerNetAmount
        : amount;

      const updated = await this.prisma.serviceRequest.update({
        where: { id: jobId },
        data: {
          // Si el schema es Decimal, Prisma.Decimal; en Float aceptará número
          priceWorkerNet: { increment: workerNetDelta },
          pricePlatformFee: { increment: breakdown.platformFee },
        },
      });

      PaymentAuditLog.log('info', 'ADJUSTMENT_CREATED', {
        jobId,
        amount,
        reason,
        workerNetDelta,
      });

      return {
        adjustment: {
          amount,
          workerNetAmount: workerNetDelta,
          platformFee: breakdown.platformFee,
          reason,
        },
        newTotal: updated.priceWorkerNet,
      };
    } catch (error) {
      if (error.errorCode) throw error;
      throw new InternalServerErrorException('Error creando ajuste');
    }
  }
}
