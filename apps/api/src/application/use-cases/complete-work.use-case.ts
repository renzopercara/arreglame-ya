import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaServiceRequestRepository } from '../../infrastructure/persistence/prisma-service-request.repository';

/**
 * Complete Work Use Case
 * Handles work completion
 */
@Injectable()
export class CompleteWorkUseCase {
  private readonly logger = new Logger(CompleteWorkUseCase.name);

  constructor(
    private readonly repository: PrismaServiceRequestRepository,
  ) {}

  async execute(requestId: string, autoReleaseHours: number = 72): Promise<void> {
    this.logger.log(`Completing work on request ${requestId}`);

    // Load entity
    const entity = await this.repository.findById(requestId);
    if (!entity) {
      throw new NotFoundException(`Service request ${requestId} not found`);
    }

    // Complete work
    entity.completeWork(autoReleaseHours);

    // Save
    await this.repository.save(entity);

    this.logger.log(
      `Work completed on request ${requestId}. Payout will be released after ${autoReleaseHours}h`,
    );
  }
}
