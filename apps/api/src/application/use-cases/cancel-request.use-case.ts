import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaServiceRequestRepository } from '../../infrastructure/persistence/prisma-service-request.repository';
import { CancellationPolicy } from '../../domain/policies/cancellation.policy';
import { Money } from '../../domain/value-objects/money.vo';

/**
 * Cancel Request Use Case
 * Handles request cancellation with policy-based fees
 */
@Injectable()
export class CancelRequestUseCase {
  private readonly logger = new Logger(CancelRequestUseCase.name);

  constructor(
    private readonly repository: PrismaServiceRequestRepository,
    private readonly cancellationPolicy: CancellationPolicy,
  ) {}

  async execute(
    requestId: string,
    reason: string,
  ): Promise<{ penaltyAmount: number; refundAmount: number }> {
    this.logger.log(`Cancelling request ${requestId}: ${reason}`);

    // Load entity
    const entity = await this.repository.findById(requestId);
    if (!entity) {
      throw new NotFoundException(`Service request ${requestId} not found`);
    }

    // Calculate cancellation fee
    const penalty = this.cancellationPolicy.calculateCancellationFee(
      entity.pricing.total,
      entity.scheduledAt,
      entity.status,
    );

    this.logger.log(
      `Cancellation fee: ${penalty.platformCommission.amount} (${(penalty.platformCommission.amount / entity.pricing.total.amount * 100).toFixed(0)}%)`,
    );

    // Cancel request
    entity.cancel(reason, penalty);

    // Save
    await this.repository.save(entity);

    this.logger.log(`Request ${requestId} cancelled`);

    return {
      penaltyAmount: penalty.platformCommission.amount,
      refundAmount: entity.pricing.total.amount - penalty.platformCommission.amount,
    };
  }
}
