/**
 * Payment Service - Strategy Pattern for Payment Methods
 * 
 * Responsibilities:
 * - Handle different payment methods (Mercado Pago, Cash)
 * - Create payment transactions with snapshots
 * - Orchestrate ledger entries
 * - Manage transaction state
 * 
 * Principles:
 * - Snapshotting: Commission rules frozen at T0
 * - Idempotency: Safe to retry
 * - State Machine: Valid transitions only
 * - ACID: All-or-nothing transactions
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionService } from './commission.service';
import { LedgerService } from './ledger.service';
import { MercadoPagoService } from './mercadopago.service';
import { Prisma, TransactionStatus, PaymentMethod } from '@prisma/client';

interface CreatePaymentInput {
  userId: string;
  professionalId?: string;
  serviceRequestId?: string;
  paymentMethod: PaymentMethod;
  totalAmount: number; // In centavos
  externalReference?: string;
}

interface PaymentResult {
  transaction: any;
  snapshot: any;
  paymentData?: any; // For MP: { preferenceId, initPoint }
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService,
    private ledgerService: LedgerService,
    private mercadoPagoService: MercadoPagoService,
  ) {}

  /**
   * Create a payment transaction with snapshot
   * Uses strategy pattern based on payment method
   */
  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    // Generate unique external reference if not provided
    const externalReference = input.externalReference || this.generateReference();

    // Check for duplicate (idempotency)
    const existing = await this.prisma.paymentTransaction.findUnique({
      where: { externalReference },
      include: { snapshot: true },
    });

    if (existing) {
      this.logger.log(`Duplicate payment detected: ${externalReference}`);
      return {
        transaction: existing,
        snapshot: existing.snapshot,
      };
    }

    // Calculate commission breakdown (snapshot at T0)
    const breakdown = this.commissionService.calculateFromTotalAmount(
      input.totalAmount,
    );

    // Execute payment strategy based on method
    if (input.paymentMethod === 'MP') {
      return this.processMercadoPagoPayment(input, externalReference, breakdown);
    } else if (input.paymentMethod === 'CASH') {
      return this.processCashPayment(input, externalReference, breakdown);
    }

    throw new BadRequestException('Invalid payment method');
  }

  /**
   * Process Mercado Pago payment
   * Creates transaction in PENDING state, awaits webhook confirmation
   */
  private async processMercadoPagoPayment(
    input: CreatePaymentInput,
    externalReference: string,
    breakdown: any,
  ): Promise<PaymentResult> {
    if (!input.professionalId) {
      throw new BadRequestException('Professional ID required for MP payment');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create payment transaction in PENDING state
      const transaction = await tx.paymentTransaction.create({
        data: {
          userId: input.userId,
          professionalId: input.professionalId,
          status: 'PENDING' as TransactionStatus,
          paymentMethod: 'MP' as PaymentMethod,
          amountTotal: input.totalAmount,
          externalReference,
        },
      });

      // 2. Create immutable snapshot
      const snapshot = await tx.transactionSnapshot.create({
        data: {
          transactionId: transaction.id,
          platformFeePercent: Math.round(
            this.commissionService['PLATFORM_FEE_PERCENTAGE'] * 10000,
          ), // Store as basis points
          serviceTaxPercent: 0,
          platformAmount: breakdown.platformFee,
          professionalAmount: breakdown.workerNetAmount,
          metadata: {
            breakdown,
            paymentMethod: 'MP',
            createdAt: new Date().toISOString(),
          },
        },
      });

      this.logger.log(
        `MP Payment created: ${transaction.id} | Amount: ${input.totalAmount} | Status: PENDING`,
      );

      // 3. Create MP preference (don't wait for payment yet)
      let paymentData;
      try {
        // Convert centavos to pesos for MP
        const amountInPesos = input.totalAmount / 100;
        
        const preference = await this.mercadoPagoService.createPreference(
          externalReference,
          amountInPesos,
          input.userId,
        );
        paymentData = preference;
      } catch (error) {
        this.logger.error('Failed to create MP preference:', error);
        throw new BadRequestException(
          'Failed to create payment preference',
        );
      }

      return {
        transaction,
        snapshot,
        paymentData,
      };
    });
  }

  /**
   * Process cash payment
   * Marks as PAID immediately and generates debt for professional
   */
  private async processCashPayment(
    input: CreatePaymentInput,
    externalReference: string,
    breakdown: any,
  ): Promise<PaymentResult> {
    if (!input.professionalId) {
      throw new BadRequestException('Professional ID required for cash payment');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create payment transaction in PAID state (immediate)
      const transaction = await tx.paymentTransaction.create({
        data: {
          userId: input.userId,
          professionalId: input.professionalId,
          status: 'PAID' as TransactionStatus,
          paymentMethod: 'CASH' as PaymentMethod,
          amountTotal: input.totalAmount,
          externalReference,
        },
      });

      // 2. Create immutable snapshot
      const snapshot = await tx.transactionSnapshot.create({
        data: {
          transactionId: transaction.id,
          platformFeePercent: Math.round(
            this.commissionService['PLATFORM_FEE_PERCENTAGE'] * 10000,
          ),
          serviceTaxPercent: 0,
          platformAmount: breakdown.platformFee,
          professionalAmount: breakdown.workerNetAmount,
          metadata: {
            breakdown,
            paymentMethod: 'CASH',
            createdAt: new Date().toISOString(),
          },
        },
      });

      // 3. Create ledger entries (cash payment with debt)
      await this.ledgerService.recordCashPayment(
        input.professionalId,
        input.totalAmount,
        breakdown.platformFee,
        transaction.id,
        tx,
      );

      // 4. Update wallet balance from ledger
      await this.updateWalletFromLedger(input.professionalId, tx);

      // 5. Check if professional exceeded debt limit
      await this.checkDebtLimit(input.professionalId, tx);

      this.logger.log(
        `Cash Payment created: ${transaction.id} | Amount: ${input.totalAmount} | Status: PAID`,
      );

      return {
        transaction,
        snapshot,
      };
    });
  }

  /**
   * Handle webhook notification (for MP payments)
   * Updates transaction status and creates ledger entries
   */
  async handlePaymentApproved(
    externalReference: string,
    eventId: string,
    payload: any,
  ): Promise<void> {
    // Check idempotency
    const existingLog = await this.prisma.paymentProviderLog.findUnique({
      where: { eventId },
    });

    if (existingLog) {
      this.logger.log(`Duplicate webhook event: ${eventId}`);
      return;
    }

    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { externalReference },
      include: { snapshot: true },
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.status !== 'PENDING') {
      this.logger.log(
        `Transaction ${transaction.id} already processed: ${transaction.status}`,
      );
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Log webhook event
      await tx.paymentProviderLog.create({
        data: {
          transactionId: transaction.id,
          provider: 'MERCADOPAGO',
          eventId,
          eventType: 'payment.approved',
          payload,
        },
      });

      // 2. Update transaction status
      await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: 'PAID' as TransactionStatus },
      });

      // 3. Create ledger entries
      await this.ledgerService.recordPayment(
        transaction.userId,
        transaction.professionalId!,
        transaction.amountTotal,
        transaction.snapshot!.platformAmount,
        transaction.id,
        tx,
      );

      // 4. Update wallet balance from ledger
      await this.updateWalletFromLedger(transaction.professionalId!, tx);
      await this.updateWalletFromLedger(transaction.userId, tx);

      this.logger.log(`Payment approved: ${transaction.id}`);
    });
  }

  /**
   * Handle payment failure/cancellation
   */
  async handlePaymentFailed(
    externalReference: string,
    eventId: string,
    payload: any,
    reason: string,
  ): Promise<void> {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { externalReference },
    });

    if (!transaction) return;

    await this.prisma.$transaction(async (tx) => {
      // Log event
      await tx.paymentProviderLog.create({
        data: {
          transactionId: transaction.id,
          provider: 'MERCADOPAGO',
          eventId,
          eventType: 'payment.failed',
          payload: { ...payload, reason },
        },
      });

      // Update status
      await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' as TransactionStatus },
      });

      this.logger.log(`Payment failed: ${transaction.id} - ${reason}`);
    });
  }

  /**
   * Process refund
   */
  async refundPayment(transactionId: string, reason: string): Promise<void> {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: { snapshot: true },
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.status !== 'PAID') {
      throw new BadRequestException('Can only refund paid transactions');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Update status
      await tx.paymentTransaction.update({
        where: { id: transactionId },
        data: { status: 'REFUNDED' as TransactionStatus },
      });

      // 2. Create reverse ledger entries
      await this.ledgerService.recordRefund(
        transaction.userId,
        transaction.professionalId!,
        transaction.amountTotal,
        transaction.snapshot!.platformAmount,
        transaction.id,
        tx,
      );

      // 3. Update wallet balances
      await this.updateWalletFromLedger(transaction.professionalId!, tx);
      await this.updateWalletFromLedger(transaction.userId, tx);

      this.logger.log(`Payment refunded: ${transactionId} - ${reason}`);
    });
  }

  /**
   * Update wallet balance from ledger (derived, not stored directly)
   */
  private async updateWalletFromLedger(
    userId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const balance = await this.ledgerService.getLatestBalance(userId);

    // Ensure wallet exists
    let wallet = await tx.wallet.findUnique({ where: { userId } });

    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          userId,
          currentBalance: balance,
          debtLimit: -50000, // Default debt limit
          status: 'ACTIVE',
        },
      });
    } else {
      await tx.wallet.update({
        where: { userId },
        data: { currentBalance: balance },
      });
    }
  }

  /**
   * Check if professional exceeded debt limit
   * If yes, mark wallet as INACTIVE_DEBT
   */
  private async checkDebtLimit(
    userId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const wallet = await tx.wallet.findUnique({ where: { userId } });

    if (!wallet) return;

    if (wallet.currentBalance < wallet.debtLimit) {
      await tx.wallet.update({
        where: { userId },
        data: { status: 'INACTIVE_DEBT' },
      });

      this.logger.warn(
        `Wallet ${userId} marked as INACTIVE_DEBT: balance ${wallet.currentBalance} < limit ${wallet.debtLimit}`,
      );
    }
  }

  /**
   * Generate unique external reference
   */
  private generateReference(): string {
    return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get transaction by external reference
   */
  async getTransactionByReference(externalReference: string) {
    return this.prisma.paymentTransaction.findUnique({
      where: { externalReference },
      include: {
        snapshot: true,
        ledgerEntries: true,
      },
    });
  }

  /**
   * Get transaction history for user
   */
  async getUserTransactions(userId: string, limit: number = 50) {
    return this.prisma.paymentTransaction.findMany({
      where: {
        OR: [{ userId }, { professionalId: userId }],
      },
      include: {
        snapshot: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
