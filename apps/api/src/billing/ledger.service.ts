/**
 * Ledger Service - Double-Entry Bookkeeping
 * 
 * Responsibilities:
 * - Maintain double-entry ledger entries
 * - Calculate balances from ledger (never mutate directly)
 * - Ensure ledger integrity (debits = credits)
 * - Provide audit trail
 * 
 * Principles:
 * - Balance is DERIVED from ledger, never stored directly
 * - Every transaction creates at least 2 entries (debit + credit)
 * - Immutable entries (never update, only create)
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface LedgerEntryInput {
  accountId: string;
  transactionId?: string;
  walletId?: string;
  debit: number;
  credit: number;
  description?: string;
}

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);
  private readonly PLATFORM_ACCOUNT_ID = 'PLATFORM';

  constructor(private prisma: PrismaService) {}

  /**
   * Create a double-entry ledger transaction
   * Every financial movement must have equal debits and credits
   * 
   * @param entries Array of ledger entries (must balance)
   * @param tx Optional Prisma transaction client
   */
  async createEntries(
    entries: LedgerEntryInput[],
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;

    // Validate double-entry: sum of debits must equal sum of credits
    const totalDebits = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredits = entries.reduce((sum, e) => sum + e.credit, 0);

    if (totalDebits !== totalCredits) {
      throw new Error(
        `Ledger entries don't balance: debits=${totalDebits}, credits=${totalCredits}`,
      );
    }

    // Calculate balance after each entry for the same account
    const accountBalances = new Map<string, number>();

    const createdEntries = [];
    for (const entry of entries) {
      // Get current balance for this account
      let currentBalance = accountBalances.get(entry.accountId);
      if (currentBalance === undefined) {
        currentBalance = await this.getAccountBalance(entry.accountId, client);
      }

      // Calculate new balance: credits increase balance, debits decrease
      const balanceChange = entry.credit - entry.debit;
      const newBalance = currentBalance + balanceChange;

      // Store new balance for next entry
      accountBalances.set(entry.accountId, newBalance);

      // Create ledger entry
      const created = await client.ledgerEntry.create({
        data: {
          accountId: entry.accountId,
          transactionId: entry.transactionId,
          walletId: entry.walletId,
          debit: entry.debit,
          credit: entry.credit,
          balanceAfter: newBalance,
          description: entry.description,
        },
      });

      createdEntries.push(created);

      this.logger.log(
        `Ledger entry created: ${entry.accountId} | Debit: ${entry.debit} | Credit: ${entry.credit} | Balance: ${newBalance}`,
      );
    }

    return createdEntries;
  }

  /**
   * Get account balance by summing all ledger entries
   * Balance = Sum(credits) - Sum(debits)
   * 
   * @param accountId User ID or PLATFORM
   * @param tx Optional Prisma transaction client
   */
  async getAccountBalance(
    accountId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;

    const result = await client.ledgerEntry.aggregate({
      where: { accountId },
      _sum: {
        credit: true,
        debit: true,
      },
    });

    const credits = result._sum.credit || 0;
    const debits = result._sum.debit || 0;

    return credits - debits;
  }

  /**
   * Get the latest balance after for an account (optimization)
   * Instead of summing all entries, get the last balanceAfter
   */
  async getLatestBalance(accountId: string): Promise<number> {
    const latestEntry = await this.prisma.ledgerEntry.findFirst({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      select: { balanceAfter: true },
    });

    return latestEntry?.balanceAfter || 0;
  }

  /**
   * Get ledger entries for an account
   * @param accountId User ID or PLATFORM
   * @param limit Number of entries to return
   */
  async getAccountHistory(accountId: string, limit: number = 50) {
    return this.prisma.ledgerEntry.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        transaction: {
          select: {
            id: true,
            status: true,
            paymentMethod: true,
            amountTotal: true,
          },
        },
      },
    });
  }

  /**
   * Record a payment from client to professional with platform fee
   * Creates 3 ledger entries:
   * 1. Debit from client
   * 2. Credit to professional (net amount)
   * 3. Credit to platform (commission)
   * 
   * @param clientId User ID of payer
   * @param professionalId User ID of receiver
   * @param totalAmount Total amount in centavos
   * @param platformFee Platform commission in centavos
   * @param transactionId Payment transaction ID
   * @param tx Prisma transaction client
   */
  async recordPayment(
    clientId: string,
    professionalId: string,
    totalAmount: number,
    platformFee: number,
    transactionId: string,
    tx: Prisma.TransactionClient,
  ) {
    const professionalNet = totalAmount - platformFee;

    const entries: LedgerEntryInput[] = [
      // 1. Debit from client (money leaves client account)
      {
        accountId: clientId,
        transactionId,
        debit: totalAmount,
        credit: 0,
        description: `Payment for service - Transaction ${transactionId.slice(0, 8)}`,
      },
      // 2. Credit to professional (net amount after commission)
      {
        accountId: professionalId,
        transactionId,
        debit: 0,
        credit: professionalNet,
        description: `Payment received (net) - Transaction ${transactionId.slice(0, 8)}`,
      },
      // 3. Credit to platform (commission)
      {
        accountId: this.PLATFORM_ACCOUNT_ID,
        transactionId,
        debit: 0,
        credit: platformFee,
        description: `Platform commission - Transaction ${transactionId.slice(0, 8)}`,
      },
    ];

    return this.createEntries(entries, tx);
  }

  /**
   * Record a cash payment where professional owes platform commission
   * Creates 2 ledger entries:
   * 1. Credit to professional (full amount)
   * 2. Debit from professional (commission owed to platform)
   * 
   * This can result in negative balance for professional (debt)
   */
  async recordCashPayment(
    professionalId: string,
    totalAmount: number,
    platformFee: number,
    transactionId: string,
    tx: Prisma.TransactionClient,
  ) {
    const entries: LedgerEntryInput[] = [
      // 1. Credit full amount to professional (they received cash)
      {
        accountId: professionalId,
        transactionId,
        debit: 0,
        credit: totalAmount,
        description: `Cash payment received - Transaction ${transactionId.slice(0, 8)}`,
      },
      // 2. Debit commission from professional (they owe platform)
      {
        accountId: professionalId,
        transactionId,
        debit: platformFee,
        credit: 0,
        description: `Platform commission (cash payment) - Transaction ${transactionId.slice(0, 8)}`,
      },
      // 3. Credit to platform
      {
        accountId: this.PLATFORM_ACCOUNT_ID,
        transactionId,
        debit: 0,
        credit: platformFee,
        description: `Platform commission (cash payment) - Transaction ${transactionId.slice(0, 8)}`,
      },
    ];

    return this.createEntries(entries, tx);
  }

  /**
   * Record a refund
   * Reverses the original payment entries
   */
  async recordRefund(
    clientId: string,
    professionalId: string,
    totalAmount: number,
    platformFee: number,
    transactionId: string,
    tx: Prisma.TransactionClient,
  ) {
    const professionalNet = totalAmount - platformFee;

    const entries: LedgerEntryInput[] = [
      // 1. Credit to client (money returns to client)
      {
        accountId: clientId,
        transactionId,
        debit: 0,
        credit: totalAmount,
        description: `Refund - Transaction ${transactionId.slice(0, 8)}`,
      },
      // 2. Debit from professional
      {
        accountId: professionalId,
        transactionId,
        debit: professionalNet,
        credit: 0,
        description: `Refund (net deducted) - Transaction ${transactionId.slice(0, 8)}`,
      },
      // 3. Debit from platform (commission returned)
      {
        accountId: this.PLATFORM_ACCOUNT_ID,
        transactionId,
        debit: platformFee,
        credit: 0,
        description: `Platform commission refunded - Transaction ${transactionId.slice(0, 8)}`,
      },
    ];

    return this.createEntries(entries, tx);
  }

  /**
   * Record debt payment from professional to platform
   * When professional pays their outstanding debt
   */
  async recordDebtPayment(
    professionalId: string,
    amount: number,
    transactionId: string,
    tx: Prisma.TransactionClient,
  ) {
    const entries: LedgerEntryInput[] = [
      // Professional pays (increases balance)
      {
        accountId: professionalId,
        transactionId,
        debit: 0,
        credit: amount,
        description: `Debt payment - Transaction ${transactionId.slice(0, 8)}`,
      },
      // Platform receives
      {
        accountId: this.PLATFORM_ACCOUNT_ID,
        transactionId,
        debit: 0,
        credit: amount,
        description: `Debt payment received - Transaction ${transactionId.slice(0, 8)}`,
      },
    ];

    return this.createEntries(entries, tx);
  }

  /**
   * Validate ledger integrity
   * Sum of all debits should equal sum of all credits across all accounts
   */
  async validateLedgerIntegrity(): Promise<{
    isBalanced: boolean;
    totalDebits: number;
    totalCredits: number;
  }> {
    const result = await this.prisma.ledgerEntry.aggregate({
      _sum: {
        debit: true,
        credit: true,
      },
    });

    const totalDebits = result._sum.debit || 0;
    const totalCredits = result._sum.credit || 0;

    return {
      isBalanced: totalDebits === totalCredits,
      totalDebits,
      totalCredits,
    };
  }
}
