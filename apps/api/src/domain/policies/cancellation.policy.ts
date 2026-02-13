import { Injectable, Logger } from '@nestjs/common';
import { CommissionBreakdown } from '../value-objects/commission-breakdown.vo';
import { Money } from '../value-objects/money.vo';

/**
 * CancellationPolicy
 * Implements business rules for cancellation fees
 */
@Injectable()
export class CancellationPolicy {
  private readonly logger = new Logger(CancellationPolicy.name);

  constructor(
    private readonly cancellationWindowHours: number = 24,
    private readonly penaltyFeePercentage: number = 0.3, // 30%
    private readonly inProgressPenaltyPercentage: number = 0.5, // 50%
  ) {}

  /**
   * Calculate cancellation fee based on timing and state
   */
  calculateCancellationFee(
    totalAmount: Money,
    scheduledAt: Date | null,
    currentStatus: string,
  ): CommissionBreakdown {
    const now = new Date();

    // Case 1: Service is already in progress
    if (currentStatus === 'IN_PROGRESS') {
      this.logger.log(
        `Cancellation during IN_PROGRESS: ${this.inProgressPenaltyPercentage * 100}% penalty`,
      );
      return this.applyPenalty(
        totalAmount,
        this.inProgressPenaltyPercentage,
        'In-progress cancellation penalty',
      );
    }

    // Case 2: Service has a scheduled time
    if (scheduledAt) {
      const hoursUntilScheduled =
        (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Free cancellation if enough notice given
      if (hoursUntilScheduled > this.cancellationWindowHours) {
        this.logger.log(
          `Free cancellation: ${hoursUntilScheduled.toFixed(1)}h notice (> ${this.cancellationWindowHours}h required)`,
        );
        return new CommissionBreakdown(
          Money.zero(totalAmount.currency),
          Money.zero(totalAmount.currency),
          Money.zero(totalAmount.currency),
        );
      }

      // Within cancellation window - apply penalty
      this.logger.log(
        `Late cancellation: ${hoursUntilScheduled.toFixed(1)}h notice (< ${this.cancellationWindowHours}h required)`,
      );
      return this.applyPenalty(
        totalAmount,
        this.penaltyFeePercentage,
        'Late cancellation penalty',
      );
    }

    // Case 3: No scheduled time but service is active - apply standard penalty
    if (['ASSIGNED', 'OFFERING', 'ACCEPTED'].includes(currentStatus)) {
      this.logger.log(
        `Cancellation in ${currentStatus} state: ${this.penaltyFeePercentage * 100}% penalty`,
      );
      return this.applyPenalty(
        totalAmount,
        this.penaltyFeePercentage,
        'Active service cancellation penalty',
      );
    }

    // Case 4: Early stage (PENDING, ANALYZING, CREATED) - free cancellation
    this.logger.log(`Free cancellation in early stage: ${currentStatus}`);
    return new CommissionBreakdown(
      Money.zero(totalAmount.currency),
      Money.zero(totalAmount.currency),
      Money.zero(totalAmount.currency),
    );
  }

  private applyPenalty(
    totalAmount: Money,
    penaltyRate: number,
    reason: string,
  ): CommissionBreakdown {
    const penaltyAmount = totalAmount.multiply(penaltyRate);
    const refundAmount = totalAmount.subtract(penaltyAmount);

    // Platform keeps the penalty, client gets refund
    return new CommissionBreakdown(
      penaltyAmount,
      Money.zero(totalAmount.currency), // Worker gets nothing on cancellation
      penaltyAmount, // Platform commission = penalty
    );
  }

  /**
   * Check if free cancellation is allowed
   */
  canCancelFree(scheduledAt: Date | null, currentStatus: string): boolean {
    const now = new Date();

    // In progress - always has penalty
    if (currentStatus === 'IN_PROGRESS') {
      return false;
    }

    // Check scheduling window
    if (scheduledAt) {
      const hoursUntilScheduled =
        (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilScheduled > this.cancellationWindowHours;
    }

    // Early stages - free cancellation
    return ['PENDING', 'ANALYZING', 'CREATED'].includes(currentStatus);
  }
}
