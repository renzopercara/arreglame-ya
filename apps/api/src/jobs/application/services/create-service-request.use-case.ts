import { Injectable, Logger, ForbiddenException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { PricingEngine } from '../pricing/pricing-engine';
import { GeoLocation } from '../../domain/value-objects/geo-location.vo';
import { SquareMeters } from '../../domain/value-objects/square-meters.vo';
import { DifficultyLevel } from '../../domain/enums/difficulty-level.enum';
import { ServiceRequestStatus } from '../../domain/enums/service-request-status.enum';
import { PricingResult } from '../pricing/pricing-context';

export interface CreateServiceRequestInput {
  /** Resolved from JWT – NEVER accepted from the client payload */
  clientId: string;
  /** Tenant context for multi-tenant pricing isolation */
  tenantId: string;
  /** Service category that drives pricing strategy selection */
  serviceCategoryId: string;
  /** Area of the service location (validated > 0 by SquareMeters VO) */
  squareMeters: number;
  /** Difficulty selected by the client (cards with icons on mobile) */
  difficultyLevel: DifficultyLevel;
  /** GPS coordinates (validated by GeoLocation VO) */
  latitude: number;
  longitude: number;
  /** Optional human-readable description */
  description?: string;
  /** Optional idempotency key to prevent duplicate requests */
  idempotencyKey?: string;
  /** Image before service (base64 or URL) */
  imageBase64?: string;
}

export interface ServiceRequestCreatedResult {
  id: string;
  status: ServiceRequestStatus;
  tenantId: string;
  clientId: string;
  serviceCategoryId: string;
  latitude: number;
  longitude: number;
  squareMeters: number;
  difficultyLevel: DifficultyLevel;
  estimatedBasePrice: number;
  estimatedVariablePrice: number;
  estimatedFinalPrice: number;
  pricingVersion: string;
  pricingMetadata: Record<string, unknown>;
  createdAt: Date;
}

/**
 * CreateServiceRequestUseCase
 *
 * Orchestrates:
 * 1. Input validation (value objects enforce invariants)
 * 2. Backend price recalculation via PricingEngine (frontend price is IGNORED)
 * 3. Persistence with full pricing snapshot for auditability
 * 4. Domain event emission for downstream consumers (notifications, matching, analytics)
 */
@Injectable()
export class CreateServiceRequestUseCase {
  private readonly logger = new Logger(CreateServiceRequestUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingEngine: PricingEngine,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: CreateServiceRequestInput): Promise<ServiceRequestCreatedResult> {
    this.logger.log(`Creating service request for client ${input.clientId} (tenant: ${input.tenantId})`);

    // 1. Validate value objects – throws descriptive errors on bad data
    const geoLocation = GeoLocation.from(input.latitude, input.longitude);
    const squareMeters = SquareMeters.from(input.squareMeters);

    // 2. Idempotency: return existing record if key already used
    if (input.idempotencyKey) {
      const existing = await (this.prisma.serviceRequest as any).findFirst({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) {
        this.logger.log(`Idempotent request – returning existing ${existing.id}`);
        return this.toResult(existing);
      }
    }

    // 3. Verify client profile exists
    const clientProfile = await (this.prisma as any).clientProfile.findUnique({
      where: { id: input.clientId },
      include: { user: { select: { roles: true } } },
    });

    if (!clientProfile) {
      throw new ForbiddenException('Client profile not found');
    }

    // 4. Recalculate price entirely on the backend – NEVER trust the frontend
    const pricingResult: PricingResult = this.pricingEngine.calculate({
      tenantId: input.tenantId,
      serviceCategoryId: input.serviceCategoryId,
      squareMeters,
      difficultyLevel: input.difficultyLevel,
      geoLocation,
      timestamp: new Date(),
    });

    this.logger.log(
      `Pricing calculated: final=${pricingResult.finalAmount} ${pricingResult.currency} ` +
        `v${pricingResult.pricingVersion}`,
    );

    // 5. Persist with full pricing snapshot
    const record = await (this.prisma.serviceRequest as any).create({
      data: {
        clientId: input.clientId,
        status: ServiceRequestStatus.CREATED,
        latitude: geoLocation.latitude,
        longitude: geoLocation.longitude,
        squareMeters: squareMeters.value,
        difficultyLevel: input.difficultyLevel as any,
        serviceCategoryId: input.serviceCategoryId || null,
        tenantId: input.tenantId,
        description: input.description,
        gardenImageBefore: input.imageBase64 ?? '',
        pin: Math.floor(1000 + Math.random() * 9000).toString(),
        estimatedHours: 0,
        idempotencyKey: input.idempotencyKey,
        // Pricing snapshot – backend calculated, never from frontend
        estimatedBasePrice: pricingResult.baseAmount,
        estimatedVariablePrice: pricingResult.variableAmount,
        estimatedFinalPrice: pricingResult.finalAmount,
        pricingVersion: pricingResult.pricingVersion,
        pricingMetadata: {
          adjustments: pricingResult.adjustments,
          currency: pricingResult.currency,
          calculatedAt: new Date().toISOString(),
          tenantId: input.tenantId,
          serviceCategoryId: input.serviceCategoryId,
        },
        // Legacy price JSON (kept for backward compatibility)
        price: {
          total: pricingResult.finalAmount,
          workerNet: pricingResult.finalAmount * 0.75,
          platformFee: pricingResult.finalAmount * 0.25,
          taxes: 0,
          currency: pricingResult.currency,
        },
      },
    });

    // 6. Emit domain event – minimal payload only
    this.eventEmitter.emit('service-request.created', {
      serviceRequestId: record.id,
      clientId: input.clientId,
      tenantId: input.tenantId,
      serviceCategoryId: input.serviceCategoryId,
      finalAmount: pricingResult.finalAmount,
      currency: pricingResult.currency,
      occurredAt: new Date().toISOString(),
    });

    this.logger.log(`Service request ${record.id} created successfully`);
    return this.toResult(record);
  }

  private toResult(record: any): ServiceRequestCreatedResult {
    return {
      id: record.id,
      status: record.status as ServiceRequestStatus,
      tenantId: record.tenantId ?? '',
      clientId: record.clientId,
      serviceCategoryId: record.serviceCategoryId ?? '',
      latitude: record.latitude,
      longitude: record.longitude,
      squareMeters: record.squareMeters,
      difficultyLevel: record.difficultyLevel as DifficultyLevel,
      estimatedBasePrice: Number(record.estimatedBasePrice ?? 0),
      estimatedVariablePrice: Number(record.estimatedVariablePrice ?? 0),
      estimatedFinalPrice: Number(record.estimatedFinalPrice ?? 0),
      pricingVersion: record.pricingVersion ?? '',
      pricingMetadata: record.pricingMetadata ?? {},
      createdAt: record.createdAt,
    };
  }
}
