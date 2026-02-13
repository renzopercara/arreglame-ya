import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaServiceRequestRepository } from '../../infrastructure/persistence/prisma-service-request.repository';

/**
 * Accept Request Use Case
 * Handles worker accepting a service request with optimistic locking
 */
@Injectable()
export class AcceptRequestUseCase {
  private readonly logger = new Logger(AcceptRequestUseCase.name);

  constructor(
    private readonly repository: PrismaServiceRequestRepository,
  ) {}

  async execute(
    requestId: string,
    workerId: string,
    expectedVersion: number,
  ): Promise<void> {
    this.logger.log(
      `Worker ${workerId} accepting request ${requestId} (version ${expectedVersion})`,
    );

    // Load entity
    const entity = await this.repository.findById(requestId);
    if (!entity) {
      throw new NotFoundException(`Service request ${requestId} not found`);
    }

    try {
      // Accept with optimistic locking
      entity.accept(workerId, expectedVersion);

      // Save (will throw if version mismatch)
      await this.repository.save(entity);

      this.logger.log(
        `Request ${requestId} accepted by worker ${workerId}`,
      );
    } catch (error) {
      if (error.message.includes('Concurrency conflict')) {
        this.logger.warn(
          `Concurrency conflict while accepting request ${requestId}`,
        );
        throw new ConflictException(
          'Another worker has already accepted this request',
        );
      }
      throw error;
    }
  }
}
