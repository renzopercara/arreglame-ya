import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IServiceRequestRepository } from './service-request.repository.interface';
import {
  ServiceRequestEntity,
  ServiceRequestStatus,
} from '../../domain/entities/service-request.entity';
import { Location } from '../../domain/value-objects/location.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { CommissionBreakdown } from '../../domain/value-objects/commission-breakdown.vo';
import { StartVerificationCode } from '../../domain/value-objects/verification-code.vo';
import { AiEstimation } from '../../domain/value-objects/ai-estimation.vo';

/**
 * Prisma implementation of Service Request Repository
 * Handles optimistic locking, transactions, and persistence
 */
@Injectable()
export class PrismaServiceRequestRepository
  implements IServiceRequestRepository
{
  private readonly logger = new Logger(PrismaServiceRequestRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async save(entity: ServiceRequestEntity): Promise<void> {
    this.logger.log(`Saving service request ${entity.id}`);

    const data = this.toPrismaModel(entity);

    try {
      await this.prisma.serviceRequest.upsert({
        where: { id: entity.id },
        create: data,
        update: {
          ...data,
          version: {
            increment: 1, // Optimistic locking
          },
        },
      });

      // Save domain events to outbox
      const events = entity.getDomainEvents();
      if (events.length > 0) {
        await this.saveEventsToOutbox(events);
        entity.clearDomainEvents();
      }

      this.logger.log(`Service request ${entity.id} saved successfully`);
    } catch (error) {
      if (error.code === 'P2034') {
        // Prisma optimistic locking error
        throw new Error(
          `Concurrency conflict while saving service request ${entity.id}`,
        );
      }
      throw error;
    }
  }

  async findById(id: string): Promise<ServiceRequestEntity | null> {
    const record = await this.prisma.serviceRequest.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    return this.toDomainEntity(record);
  }

  async findByIdempotencyKey(
    key: string,
  ): Promise<ServiceRequestEntity | null> {
    const record = await this.prisma.serviceRequest.findFirst({
      where: { idempotencyKey: key },
    });

    if (!record) {
      return null;
    }

    return this.toDomainEntity(record);
  }

  async findWithExpiredWorkerTimeout(): Promise<ServiceRequestEntity[]> {
    const records = await this.prisma.serviceRequest.findMany({
      where: {
        status: 'OFFERING',
        workerTimeoutAt: {
          lte: new Date(),
        },
      },
    });

    return records.map((record) => this.toDomainEntity(record));
  }

  async findReadyForPayoutRelease(): Promise<ServiceRequestEntity[]> {
    const records = await this.prisma.serviceRequest.findMany({
      where: {
        status: 'COMPLETED',
        disputeDeadlineAt: {
          lte: new Date(),
        },
        payoutReleasedAt: null,
      },
    });

    return records.map((record) => this.toDomainEntity(record));
  }

  async beginTransaction(): Promise<any> {
    // Prisma doesn't expose transaction objects directly
    // We'll use Prisma's $transaction for atomic operations
    return null;
  }

  async commitTransaction(tx: any): Promise<void> {
    // No-op for Prisma - transactions commit automatically
  }

  async rollbackTransaction(tx: any): Promise<void> {
    // No-op for Prisma - transactions rollback on error
  }

  /**
   * Save domain events to outbox table
   */
  private async saveEventsToOutbox(events: any[]): Promise<void> {
    const outboxRecords = events.map((event) => ({
      aggregateId: event.aggregateId,
      type: event.eventType,
      payload: event.toJSON(),
      processed: false,
    }));

    await this.prisma.outboxEvent.createMany({
      data: outboxRecords,
    });

    this.logger.log(`Saved ${events.length} events to outbox`);
  }

  /**
   * Convert domain entity to Prisma model
   */
  private toPrismaModel(entity: ServiceRequestEntity): any {
    return {
      id: entity.id,
      status: entity.status as any,
      clientId: entity.clientId,
      workerId: entity.workerId,
      latitude: entity.location.latitude,
      longitude: entity.location.longitude,
      totalAmount: entity.pricing.total.amount,
      workerPayout: entity.pricing.workerNet.amount,
      platformCommission: entity.pricing.platformCommission.amount,
      verificationCode: entity.verificationCode?.toString() || null,
      version: entity.version,
      assignmentAttempts: entity.assignmentAttempts,
      workerTimeoutAt: entity.workerTimeoutAt,
      scheduledAt: entity.scheduledAt,
      completedAt: entity.completedAt,
      disputeDeadlineAt: entity.disputeDeadlineAt,
      payoutReleasedAt: entity.payoutReleasedAt,
      createdAt: entity.createdAt,
      price: entity.pricing.toJSON(),
      aiReasoning: entity.aiEstimation?.reasoning || null,
      estimatedHours: entity.aiEstimation?.estimatedHours || 0,
      squareMeters: entity.aiEstimation?.estimatedM2 || 0,
      difficulty: entity.aiEstimation?.difficultyScore || 1,
      pin: entity.verificationCode?.toString() || '0000',
      gardenImageBefore: '', // These should come from constructor
      description: '',
    };
  }

  /**
   * Convert Prisma model to domain entity
   */
  private toDomainEntity(record: any): ServiceRequestEntity {
    const location = Location.from(record.latitude, record.longitude);

    const pricing = new CommissionBreakdown(
      Money.from(Number(record.totalAmount || 0), 'ARS'),
      Money.from(Number(record.workerPayout || 0), 'ARS'),
      Money.from(Number(record.platformCommission || 0), 'ARS'),
    );

    const verificationCode = record.verificationCode
      ? StartVerificationCode.from(record.verificationCode)
      : null;

    const aiEstimation = record.aiReasoning
      ? AiEstimation.from({
          difficultyScore: record.difficulty || 1,
          estimatedHours: record.estimatedHours || 0,
          suggestedBasePrice: Number(record.totalAmount || 0),
          estimatedM2: record.squareMeters || 0,
          reasoning: record.aiReasoning,
        })
      : null;

    const entity = new ServiceRequestEntity(
      record.id,
      record.status as ServiceRequestStatus,
      record.clientId,
      record.workerId,
      location,
      pricing,
      verificationCode,
      record.version,
      record.assignmentAttempts,
      record.workerTimeoutAt,
      record.scheduledAt,
      record.completedAt,
      record.disputeDeadlineAt,
      record.payoutReleasedAt,
      record.createdAt,
      aiEstimation,
    );

    return entity;
  }
}
