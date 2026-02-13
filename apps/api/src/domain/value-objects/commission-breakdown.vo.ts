import { Money } from './money.vo';

/**
 * CommissionBreakdown Value Object
 * Immutable breakdown of service pricing
 */
export class CommissionBreakdown {
  constructor(
    public readonly total: Money,
    public readonly workerNet: Money,
    public readonly platformCommission: Money,
    public readonly taxes: Money = Money.zero(total.currency),
  ) {
    // Validate that breakdown adds up correctly
    const sum = workerNet.add(platformCommission).add(taxes);
    if (!sum.equals(total)) {
      throw new Error(
        `Commission breakdown does not add up: ${sum.amount} !== ${total.amount}`,
      );
    }
  }

  static calculate(
    total: Money,
    commissionRate: number,
    taxRate: number = 0,
  ): CommissionBreakdown {
    const platformCommission = total.multiply(commissionRate);
    const taxes = total.multiply(taxRate);
    const workerNet = total.subtract(platformCommission).subtract(taxes);

    return new CommissionBreakdown(total, workerNet, platformCommission, taxes);
  }

  toJSON() {
    return {
      total: this.total.toJSON(),
      workerNet: this.workerNet.toJSON(),
      platformCommission: this.platformCommission.toJSON(),
      taxes: this.taxes.toJSON(),
    };
  }
}
