import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
  ObjectType,
  Field,
  Float,
  InputType,
  ID,
} from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import GraphQLJSON from 'graphql-type-json';

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireActiveRole } from '../auth/roles.decorator';
import { PricingEngine } from './application/pricing/pricing-engine';
import { GeoLocation } from './domain/value-objects/geo-location.vo';
import { SquareMeters } from './domain/value-objects/square-meters.vo';
import { DifficultyLevel } from './domain/enums/difficulty-level.enum';
import {
  CreateServiceRequestUseCase,
  CreateServiceRequestInput,
} from './application/services/create-service-request.use-case';

// ============================================
// GraphQL INPUT TYPES
// ============================================

@InputType()
export class PreviewServicePriceInput {
  @Field()
  tenantId: string;

  @Field()
  serviceCategoryId: string;

  @Field(() => Float)
  squareMeters: number;

  @Field()
  difficultyLevel: string;

  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;
}

@InputType()
export class CreateServiceRequestGqlInput {
  @Field()
  tenantId: string;

  @Field()
  serviceCategoryId: string;

  @Field(() => Float)
  squareMeters: number;

  @Field()
  difficultyLevel: string;

  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  imageBase64?: string;

  @Field({ nullable: true })
  idempotencyKey?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

@ObjectType()
class PriceAdjustmentType {
  @Field()
  label: string;

  @Field(() => Float)
  amount: number;
}

@ObjectType()
export class PricingPreviewResponse {
  @Field(() => Float)
  baseAmount: number;

  @Field(() => Float)
  variableAmount: number;

  @Field(() => [PriceAdjustmentType])
  adjustments: PriceAdjustmentType[];

  @Field(() => Float)
  finalAmount: number;

  @Field()
  pricingVersion: string;

  @Field()
  currency: string;
}

@ObjectType()
export class ServiceRequestResponse {
  @Field(() => ID)
  id: string;

  @Field()
  status: string;

  @Field()
  tenantId: string;

  @Field()
  clientId: string;

  @Field()
  serviceCategoryId: string;

  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;

  @Field(() => Float)
  squareMeters: number;

  @Field()
  difficultyLevel: string;

  @Field(() => Float)
  estimatedBasePrice: number;

  @Field(() => Float)
  estimatedVariablePrice: number;

  @Field(() => Float)
  estimatedFinalPrice: number;

  @Field()
  pricingVersion: string;

  @Field(() => GraphQLJSON)
  pricingMetadata: Record<string, unknown>;

  @Field(() => Date)
  createdAt: Date;
}

// ============================================
// RESOLVER
// ============================================

@Resolver()
export class ServiceRequestResolver {
  constructor(
    private readonly pricingEngine: PricingEngine,
    private readonly createServiceRequestUseCase: CreateServiceRequestUseCase,
  ) {}

  /**
   * previewServicePrice
   *
   * Live pricing preview for the mobile UX smart quote builder.
   * Debounce on the client (400–600 ms). Pure read – no side effects.
   * Cancels stale requests naturally via HTTP/GraphQL query lifecycle.
   */
  @Query(() => PricingPreviewResponse)
  @UseGuards(AuthGuard)
  async previewServicePrice(
    @Args('input', { type: () => PreviewServicePriceInput })
    input: PreviewServicePriceInput,
  ): Promise<PricingPreviewResponse> {
    const difficultyLevel = this.parseDifficultyLevel(input.difficultyLevel);
    const geoLocation = GeoLocation.from(input.latitude, input.longitude);
    const squareMeters = SquareMeters.from(input.squareMeters);

    const result = this.pricingEngine.calculate({
      tenantId: input.tenantId,
      serviceCategoryId: input.serviceCategoryId,
      squareMeters,
      difficultyLevel,
      geoLocation,
      timestamp: new Date(),
    });

    return {
      baseAmount: result.baseAmount,
      variableAmount: result.variableAmount,
      adjustments: result.adjustments,
      finalAmount: result.finalAmount,
      pricingVersion: result.pricingVersion,
      currency: result.currency,
    };
  }

  /**
   * createServiceRequest
   *
   * Marketplace-grade service request creation.
   * - clientId is extracted from JWT (NEVER from input)
   * - Price is ALWAYS recalculated on the backend
   * - Full pricing snapshot is persisted
   * - Domain event is emitted after successful creation
   */
  @Mutation(() => ServiceRequestResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @RequireActiveRole('CLIENT')
  async createServiceRequest(
    @Args('input', { type: () => CreateServiceRequestGqlInput })
    input: CreateServiceRequestGqlInput,
    @Context() ctx: any,
  ): Promise<ServiceRequestResponse> {
    // clientId comes from the verified JWT token, never from the input payload
    const userId: string = ctx.req.user.sub;

    const useCaseInput: CreateServiceRequestInput = {
      clientId: userId,
      tenantId: input.tenantId,
      serviceCategoryId: input.serviceCategoryId,
      squareMeters: input.squareMeters,
      difficultyLevel: this.parseDifficultyLevel(input.difficultyLevel),
      latitude: input.latitude,
      longitude: input.longitude,
      description: input.description,
      imageBase64: input.imageBase64,
      idempotencyKey: input.idempotencyKey,
    };

    const result = await this.createServiceRequestUseCase.execute(useCaseInput);

    return {
      id: result.id,
      status: result.status,
      tenantId: result.tenantId,
      clientId: result.clientId,
      serviceCategoryId: result.serviceCategoryId,
      latitude: result.latitude,
      longitude: result.longitude,
      squareMeters: result.squareMeters,
      difficultyLevel: result.difficultyLevel,
      estimatedBasePrice: result.estimatedBasePrice,
      estimatedVariablePrice: result.estimatedVariablePrice,
      estimatedFinalPrice: result.estimatedFinalPrice,
      pricingVersion: result.pricingVersion,
      pricingMetadata: result.pricingMetadata,
      createdAt: result.createdAt,
    };
  }

  private parseDifficultyLevel(value: string): DifficultyLevel {
    const level = Object.values(DifficultyLevel).find((v) => v === value.toUpperCase());
    if (!level) {
      throw new BadRequestException(
        `Invalid difficulty level: ${value}. Must be one of: ${Object.values(DifficultyLevel).join(', ')}`,
      );
    }
    return level;
  }
}
