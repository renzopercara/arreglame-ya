import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';

export interface IncrementServicePriceInput {
  /** Resolved from JWT – NEVER accepted from the client payload */
  requestingUserId: string;
  /** The service request to incentivize */
  serviceRequestId: string;
}

export interface IncrementServicePriceResult {
  id: string;
  estimatedFinalPrice: number;
  extraIncrement: number;
  incrementCount: number;
  maxIncrementCount: number;
  canIncrementAgain: boolean;
}

const DEFAULT_INCREMENT_PERCENTAGE = 10;
const DEFAULT_MAX_INCREMENT_COUNT = 3;

/**
 * IncrementServicePriceUseCase
 *
 * Allows a client to boost the offer price for their pending service request.
 * - Reads percentage and max increments from system_config (DB-driven)
 * - Validates ownership: only the request owner can increment
 * - Validates the increment limit
 * - Emits an event so the notification service can alert nearby workers
 */
@Injectable()
export class IncrementServicePriceUseCase {
  private readonly logger = new Logger(IncrementServicePriceUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: IncrementServicePriceInput): Promise<IncrementServicePriceResult> {
    this.logger.log(
      `Price increment requested by user ${input.requestingUserId} for request ${input.serviceRequestId}`,
    );

    // 1. Load config values from system_config
    const [incrementPercentageConfig, maxIncrementConfig] = await Promise.all([
      this.prisma.systemConfig.findUnique({ where: { key: 'PRICE_INCREMENT_PERCENTAGE' } }),
      this.prisma.systemConfig.findUnique({ where: { key: 'MAX_INCREMENT_COUNT' } }),
    ]);

    const incrementPercentage = incrementPercentageConfig
      ? parseInt(incrementPercentageConfig.value, 10)
      : DEFAULT_INCREMENT_PERCENTAGE;

    const maxIncrementCount = maxIncrementConfig
      ? parseInt(maxIncrementConfig.value, 10)
      : DEFAULT_MAX_INCREMENT_COUNT;

    // 2. Load the service request
    const serviceRequest = await (this.prisma.serviceRequest as any).findUnique({
      where: { id: input.serviceRequestId },
      include: { client: { select: { userId: true } } },
    });

    if (!serviceRequest) {
      throw new NotFoundException(`Service request ${input.serviceRequestId} not found`);
    }

    // 3. Validate ownership – only the client who created the request can incentivize it
    if (serviceRequest.client.userId !== input.requestingUserId) {
      throw new ForbiddenException('Only the request owner can increment the price');
    }

    // 4. Validate increment limit
    if (serviceRequest.incrementCount >= maxIncrementCount) {
      throw new BadRequestException(
        `Maximum increment limit (${maxIncrementCount}) reached for this request`,
      );
    }

    // 5. Calculate new incentive amount
    // basePrice holds the original calculated price (set at creation time)
    const currentBasePrice = Number(serviceRequest.basePrice || serviceRequest.estimatedFinalPrice || 0);
    const incrementAmount = Math.round((currentBasePrice * incrementPercentage) / 100);
    const newExtraIncrement = Number(serviceRequest.extraIncrement || 0) + incrementAmount;
    const newIncrementCount = serviceRequest.incrementCount + 1;

    // 6. Persist the increment atomically
    const updated = await (this.prisma.serviceRequest as any).update({
      where: { id: input.serviceRequestId },
      data: {
        extraIncrement: newExtraIncrement,
        incrementCount: newIncrementCount,
      },
    });

    const newFinalPrice = currentBasePrice + newExtraIncrement;

    this.logger.log(
      `Price incremented for request ${input.serviceRequestId}: +${incrementAmount} (total: ${newFinalPrice})`,
    );

    // 7. Emit event so notification service can alert nearby workers
    this.eventEmitter.emit('service-request.price-incremented', {
      serviceRequestId: input.serviceRequestId,
      clientId: serviceRequest.clientId,
      latitude: serviceRequest.latitude,
      longitude: serviceRequest.longitude,
      coverageRadius: serviceRequest.coverageRadius,
      newFinalPrice,
      incrementAmount,
      incrementCount: newIncrementCount,
      occurredAt: new Date().toISOString(),
    });

    return {
      id: updated.id,
      estimatedFinalPrice: newFinalPrice,
      extraIncrement: newExtraIncrement,
      incrementCount: newIncrementCount,
      maxIncrementCount,
      canIncrementAgain: newIncrementCount < maxIncrementCount,
    };
  }
}
