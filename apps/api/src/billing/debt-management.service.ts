/**
 * Debt Management Service
 * 
 * Responsibilities:
 * - Monitor wallet balances and debt limits
 * - Generate payment links for debt settlement
 * - Restore wallet status after payment
 * - Notify users about debt status
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoService } from './mercadopago.service';
import { LedgerService } from './ledger.service';
import { Prisma } from '@prisma/client';

interface DebtStatus {
  userId: string;
  currentBalance: number;
  debtLimit: number;
  debtAmount: number;
  status: string;
  canReceiveJobs: boolean;
}

@Injectable()
export class DebtManagementService {
  private readonly logger = new Logger(DebtManagementService.name);

  constructor(
    private prisma: PrismaService,
    private mercadoPagoService: MercadoPagoService,
    private ledgerService: LedgerService,
  ) {}

  /**
   * Get debt status for a user
   */
  async getDebtStatus(userId: string): Promise<DebtStatus> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      // No wallet = no debt
      return {
        userId,
        currentBalance: 0,
        debtLimit: -50000,
        debtAmount: 0,
        status: 'ACTIVE',
        canReceiveJobs: true,
      };
    }

    const debtAmount = wallet.currentBalance < 0 ? Math.abs(wallet.currentBalance) : 0;
    const canReceiveJobs = wallet.status === 'ACTIVE';

    return {
      userId,
      currentBalance: wallet.currentBalance,
      debtLimit: wallet.debtLimit,
      debtAmount,
      status: wallet.status,
      canReceiveJobs,
    };
  }

  /**
   * Generate payment link for debt settlement
   * Returns Mercado Pago preference for user to pay their debt
   */
  async generateDebtPaymentLink(userId: string): Promise<{
    preferenceId: string;
    initPoint: string;
    amount: number;
  }> {
    const debtStatus = await this.getDebtStatus(userId);

    if (debtStatus.debtAmount <= 0) {
      throw new BadRequestException('No debt to pay');
    }

    // Create MP preference for debt payment
    const externalReference = `DEBT-${userId}-${Date.now()}`;
    
    try {
      const preference = await this.mercadoPagoService.createPreference(
        externalReference,
        userId,
        {
          title: 'Pago de Deuda - Arreglame Ya',
          description: 'Liquidación de deuda de comisiones pendientes',
          quantity: 1,
          unit_price: debtStatus.debtAmount / 100, // Convert centavos to pesos
        },
      );

      this.logger.log(
        `Debt payment link generated for ${userId}: ${debtStatus.debtAmount} centavos`,
      );

      return {
        preferenceId: preference.preferenceId,
        initPoint: preference.initPoint,
        amount: debtStatus.debtAmount,
      };
    } catch (error) {
      this.logger.error('Failed to generate debt payment link:', error);
      throw new BadRequestException('Failed to generate payment link');
    }
  }

  /**
   * Process debt payment (called from webhook)
   * Records payment in ledger and updates wallet status
   */
  async processDebtPayment(
    userId: string,
    amount: number,
    externalReference: string,
    eventId: string,
  ): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create payment transaction
      const transaction = await tx.paymentTransaction.create({
        data: {
          userId,
          status: 'PAID',
          paymentMethod: 'MP',
          amountTotal: amount,
          externalReference,
        },
      });

      // 2. Log webhook event
      await tx.paymentProviderLog.create({
        data: {
          transactionId: transaction.id,
          provider: 'MERCADOPAGO',
          eventId,
          eventType: 'debt.payment.approved',
          payload: {
            userId,
            amount,
            externalReference,
            type: 'DEBT_PAYMENT',
          },
        },
      });

      // 3. Create ledger entry (credit to professional account)
      await this.ledgerService.recordDebtPayment(
        userId,
        amount,
        transaction.id,
        tx,
      );

      // 4. Update wallet balance from ledger
      const newBalance = await this.ledgerService.getLatestBalance(userId);
      await tx.wallet.update({
        where: { userId },
        data: {
          currentBalance: newBalance,
        },
      });

      // 5. Check if debt is cleared and restore status
      if (newBalance >= 0) {
        await tx.wallet.update({
          where: { userId },
          data: { status: 'ACTIVE' },
        });

        this.logger.log(`Wallet ${userId} restored to ACTIVE status`);
      }

      this.logger.log(
        `Debt payment processed: ${userId} | Amount: ${amount} | New balance: ${newBalance}`,
      );
    });
  }

  /**
   * Check all wallets for debt limit violations
   * Used for batch processing / cron jobs
   */
  async checkAllWalletsForDebt(): Promise<{
    checked: number;
    violating: number;
    wallets: string[];
  }> {
    const wallets = await this.prisma.wallet.findMany({
      where: {
        status: 'ACTIVE',
      },
    });

    const violating: string[] = [];

    for (const wallet of wallets) {
      if (wallet.currentBalance < wallet.debtLimit) {
        violating.push(wallet.userId);

        await this.prisma.wallet.update({
          where: { userId: wallet.userId },
          data: { status: 'INACTIVE_DEBT' },
        });

        this.logger.warn(
          `Wallet ${wallet.userId} marked as INACTIVE_DEBT: ${wallet.currentBalance} < ${wallet.debtLimit}`,
        );
      }
    }

    return {
      checked: wallets.length,
      violating: violating.length,
      wallets: violating,
    };
  }

  /**
   * Get list of users with debt
   */
  async getUsersWithDebt(limit: number = 50): Promise<DebtStatus[]> {
    const wallets = await this.prisma.wallet.findMany({
      where: {
        currentBalance: {
          lt: 0,
        },
      },
      orderBy: {
        currentBalance: 'asc', // Most debt first
      },
      take: limit,
    });

    return wallets.map((wallet) => ({
      userId: wallet.userId,
      currentBalance: wallet.currentBalance,
      debtLimit: wallet.debtLimit,
      debtAmount: Math.abs(wallet.currentBalance),
      status: wallet.status,
      canReceiveJobs: wallet.status === 'ACTIVE',
    }));
  }

  /**
   * Set custom debt limit for a user
   */
  async setDebtLimit(userId: string, newLimit: number): Promise<void> {
    if (newLimit > 0) {
      throw new BadRequestException('Debt limit must be negative or zero');
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      // Create wallet with custom debt limit
      await this.prisma.wallet.create({
        data: {
          userId,
          debtLimit: newLimit,
          status: 'ACTIVE',
        },
      });
    } else {
      await this.prisma.wallet.update({
        where: { userId },
        data: { debtLimit: newLimit },
      });

      // Check if current balance violates new limit
      if (wallet.currentBalance < newLimit) {
        await this.prisma.wallet.update({
          where: { userId },
          data: { status: 'INACTIVE_DEBT' },
        });
      }
    }

    this.logger.log(`Debt limit updated for ${userId}: ${newLimit}`);
  }

  /**
   * Get debt statistics (for admin dashboard)
   */
  async getDebtStatistics(): Promise<{
    totalUsersWithDebt: number;
    totalDebtAmount: number;
    averageDebt: number;
    usersOverLimit: number;
  }> {
    const walletsWithDebt = await this.prisma.wallet.findMany({
      where: {
        currentBalance: {
          lt: 0,
        },
      },
    });

    const totalDebtAmount = walletsWithDebt.reduce(
      (sum, w) => sum + Math.abs(w.currentBalance),
      0,
    );

    const usersOverLimit = walletsWithDebt.filter(
      (w) => w.currentBalance < w.debtLimit,
    ).length;

    return {
      totalUsersWithDebt: walletsWithDebt.length,
      totalDebtAmount,
      averageDebt:
        walletsWithDebt.length > 0
          ? totalDebtAmount / walletsWithDebt.length
          : 0,
      usersOverLimit,
    };
  }
}
