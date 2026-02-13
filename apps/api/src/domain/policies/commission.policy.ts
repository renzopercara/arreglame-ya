import { Injectable } from '@nestjs/common';
import { CommissionBreakdown } from '../value-objects/commission-breakdown.vo';
import { Money } from '../value-objects/money.vo';

/**
 * CommissionPolicy
 * Calculates platform commission based on configurable rates
 */
@Injectable()
export class CommissionPolicy {
  constructor(
    private readonly commissionRate: number = 0.25, // 25% default
    private readonly taxRate: number = 0.0, // 0% default (can be configured per region)
  ) {}

  /**
   * Calculate commission breakdown from total amount
   */
  calculateFrom(total: Money): CommissionBreakdown {
    return CommissionBreakdown.calculate(
      total,
      this.commissionRate,
      this.taxRate,
    );
  }

  /**
   * Calculate total from worker net amount
   */
  calculateTotalFromWorkerNet(workerNet: Money): Money {
    // workerNet = total * (1 - commissionRate - taxRate)
    // total = workerNet / (1 - commissionRate - taxRate)
    const netRate = 1 - this.commissionRate - this.taxRate;
    return workerNet.divide(netRate);
  }

  getCommissionRate(): number {
    return this.commissionRate;
  }

  getTaxRate(): number {
    return this.taxRate;
  }
}
