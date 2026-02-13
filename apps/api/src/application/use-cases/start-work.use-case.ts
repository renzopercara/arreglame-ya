import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaServiceRequestRepository } from '../../infrastructure/persistence/prisma-service-request.repository';

/**
 * Start Work Use Case
 * Handles starting work with verification code validation
 */
@Injectable()
export class StartWorkUseCase {
  private readonly logger = new Logger(StartWorkUseCase.name);

  constructor(
    private readonly repository: PrismaServiceRequestRepository,
  ) {}

  async execute(
    requestId: string,
    workerId: string,
    verificationCode: string,
  ): Promise<void> {
    this.logger.log(
      `Worker ${workerId} starting work on request ${requestId}`,
    );

    // Load entity
    const entity = await this.repository.findById(requestId);
    if (!entity) {
      throw new NotFoundException(`Service request ${requestId} not found`);
    }

    // Verify worker is assigned
    if (entity.workerId !== workerId) {
      throw new UnauthorizedException(
        'You are not assigned to this request',
      );
    }

    try {
      // Start work (validates verification code)
      entity.startWork(verificationCode);

      // Save
      await this.repository.save(entity);

      this.logger.log(
        `Work started on request ${requestId} by worker ${workerId}`,
      );
    } catch (error) {
      if (error.message.includes('Invalid verification code')) {
        this.logger.warn(
          `Invalid verification code for request ${requestId}`,
        );
        throw new UnauthorizedException('Invalid verification code');
      }
      throw error;
    }
  }
}
