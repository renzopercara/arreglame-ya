import { Injectable } from '@nestjs/common';
import { CommissionBreakdownDto } from './billing.dto';

@Injectable()
export class CommissionService {
  // Default percentages; adjust via configuration if needed
  private readonly platformFeePct = 0.15; // 15% commission to platform
  private readonly paymentGatewayFeePct = 0.0; // Gateway fee placeholder (0% by default)
  private readonly taxPct = 0; // Tax calculation placeholder

  calculateCommissionBreakdown(totalAmount: number): CommissionBreakdownDto {
    const safeTotal = Math.max(0, totalAmount);

    const platformFee = this.round(safeTotal * this.platformFeePct);
    const paymentGatewayFee = this.round(safeTotal * this.paymentGatewayFeePct);
    const taxAmount = this.round(safeTotal * this.taxPct);
    const workerNetAmount = this.round(safeTotal - platformFee - paymentGatewayFee - taxAmount);

    return {
      totalAmount: safeTotal,
      platformFee,
      paymentGatewayFee,
      workerNetAmount,
      taxAmount,
      currency: 'ARS',
    };
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
