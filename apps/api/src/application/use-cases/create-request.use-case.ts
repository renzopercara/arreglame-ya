import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaServiceRequestRepository } from '../../infrastructure/persistence/prisma-service-request.repository';
import { ServiceRequestEntity } from '../../domain/entities/service-request.entity';
import { Location } from '../../domain/value-objects/location.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { CommissionBreakdown } from '../../domain/value-objects/commission-breakdown.vo';
import { CommissionPolicy } from '../../domain/policies/commission.policy';
import { EstimationPolicy } from '../../domain/policies/estimation.policy';
import { PricingService } from '../../infrastructure/pricing/pricing.service';
import { AiEstimation } from '../../domain/value-objects/ai-estimation.vo';

export interface CreateRequestInput {
  clientId: string;
  latitude: number;
  longitude: number;
  imageBase64: string;
  description: string;
  squareMeters: number;
  scheduledAt?: Date;
  idempotencyKey?: string;
}

/**
 * Create Request Use Case
 * Handles service request creation with AI estimation and pricing
 */
@Injectable()
export class CreateRequestUseCase {
  private readonly logger = new Logger(CreateRequestUseCase.name);

  constructor(
    private readonly repository: PrismaServiceRequestRepository,
    private readonly pricingService: PricingService,
    private readonly commissionPolicy: CommissionPolicy,
    private readonly estimationPolicy: EstimationPolicy,
  ) {}

  async execute(input: CreateRequestInput): Promise<ServiceRequestEntity> {
    this.logger.log(
      `Creating service request for client ${input.clientId}`,
    );

    // Check idempotency
    if (input.idempotencyKey) {
      const existing =
        await this.repository.findByIdempotencyKey(input.idempotencyKey);
      if (existing) {
        this.logger.log(
          `Request with idempotency key ${input.idempotencyKey} already exists`,
        );
        return existing;
      }
    }

    // Get AI estimation
    const estimation = await this.pricingService.estimatePrice(
      input.imageBase64,
      input.description,
      input.squareMeters,
    );

    this.logger.log(
      `AI estimation: ${estimation.estimatedHours}h, difficulty ${estimation.difficultyScore}`,
    );

    // Validate estimation
    this.estimationPolicy.validateEstimation(estimation);

    // Calculate pricing
    const basePrice = this.estimationPolicy.calculateBasePrice(
      estimation,
      input.squareMeters,
    );

    const pricing = this.commissionPolicy.calculateFrom(basePrice);

    this.logger.log(
      `Pricing calculated: Total ${pricing.total.amount}, Worker ${pricing.workerNet.amount}, Commission ${pricing.platformCommission.amount}`,
    );

    // Create location value object
    const location = Location.from(input.latitude, input.longitude);

    // Create entity
    const entity = ServiceRequestEntity.create(
      this.generateId(),
      input.clientId,
      location,
      pricing,
      input.scheduledAt || null,
    );

    // Add AI estimation to entity
    entity.analyze(estimation);

    // Save to repository
    await this.repository.save(entity);

    this.logger.log(`Service request ${entity.id} created successfully`);

    return entity;
  }

  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
