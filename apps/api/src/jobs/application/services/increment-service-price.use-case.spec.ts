import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { IncrementServicePriceUseCase } from './increment-service-price.use-case';
import { PrismaService } from '../../../prisma/prisma.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OWNER_USER_ID = 'user-owner';
const OTHER_USER_ID = 'user-other';
const REQUEST_ID = 'request-1';
const CLIENT_PROFILE_ID = 'client-1';

function buildServiceRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: REQUEST_ID,
    clientId: CLIENT_PROFILE_ID,
    basePrice: '10000',        // 10.000 ARS in cents representation
    extraIncrement: '0',
    incrementCount: 0,
    estimatedFinalPrice: '10000',
    latitude: -32.0,
    longitude: -60.0,
    coverageRadius: 15,
    client: { userId: OWNER_USER_ID },
    ...overrides,
  };
}

function buildPrismaMock(serviceRequest: Record<string, unknown> | null = buildServiceRequest()) {
  return {
    systemConfig: {
      findUnique: jest.fn(({ where }: { where: { key: string } }) => {
        if (where.key === 'PRICE_INCREMENT_PERCENTAGE') return Promise.resolve({ value: '10' });
        if (where.key === 'MAX_INCREMENT_COUNT') return Promise.resolve({ value: '3' });
        return Promise.resolve(null);
      }),
    },
    serviceRequest: {
      findUnique: jest.fn(() => Promise.resolve(serviceRequest)),
      update: jest.fn((args: any) =>
        Promise.resolve({ ...serviceRequest, ...args.data }),
      ),
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('IncrementServicePriceUseCase', () => {
  let useCase: IncrementServicePriceUseCase;
  let prismaMock: ReturnType<typeof buildPrismaMock>;
  let eventEmitterMock: { emit: jest.Mock };

  beforeEach(async () => {
    prismaMock = buildPrismaMock();
    eventEmitterMock = { emit: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        IncrementServicePriceUseCase,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EventEmitter2, useValue: eventEmitterMock },
      ],
    }).compile();

    useCase = module.get(IncrementServicePriceUseCase);
  });

  describe('Increment calculation', () => {
    it('calculates increment correctly using PRICE_INCREMENT_PERCENTAGE from system_config', async () => {
      const result = await useCase.execute({
        requestingUserId: OWNER_USER_ID,
        serviceRequestId: REQUEST_ID,
      });

      // 10% of 10000 = 1000
      expect(result.extraIncrement).toBe(1000);
      expect(result.estimatedFinalPrice).toBe(11000);
      expect(result.incrementCount).toBe(1);
    });

    it('accumulates extra increment on second call', async () => {
      // Simulate a request that already has one increment
      prismaMock = buildPrismaMock(buildServiceRequest({ extraIncrement: '1000', incrementCount: 1 }));
      const module = await Test.createTestingModule({
        providers: [
          IncrementServicePriceUseCase,
          { provide: PrismaService, useValue: prismaMock },
          { provide: EventEmitter2, useValue: eventEmitterMock },
        ],
      }).compile();
      useCase = module.get(IncrementServicePriceUseCase);

      const result = await useCase.execute({
        requestingUserId: OWNER_USER_ID,
        serviceRequestId: REQUEST_ID,
      });

      // existing extra 1000 + new 10% of base 10000 = 2000
      expect(result.extraIncrement).toBe(2000);
      expect(result.estimatedFinalPrice).toBe(12000);
      expect(result.incrementCount).toBe(2);
    });

    it('uses default percentage (10) when system_config key is missing', async () => {
      prismaMock.systemConfig.findUnique.mockResolvedValue(null);

      const result = await useCase.execute({
        requestingUserId: OWNER_USER_ID,
        serviceRequestId: REQUEST_ID,
      });

      expect(result.extraIncrement).toBe(1000); // 10% of 10000
    });

    it('respects a custom PRICE_INCREMENT_PERCENTAGE from system_config', async () => {
      prismaMock.systemConfig.findUnique.mockImplementation(({ where }: { where: { key: string } }) => {
        if (where.key === 'PRICE_INCREMENT_PERCENTAGE') return Promise.resolve({ value: '20' });
        if (where.key === 'MAX_INCREMENT_COUNT') return Promise.resolve({ value: '3' });
        return Promise.resolve(null);
      });

      const result = await useCase.execute({
        requestingUserId: OWNER_USER_ID,
        serviceRequestId: REQUEST_ID,
      });

      // 20% of 10000 = 2000
      expect(result.extraIncrement).toBe(2000);
    });
  });

  describe('Ownership validation', () => {
    it('throws ForbiddenException when a different user tries to increment', async () => {
      await expect(
        useCase.execute({
          requestingUserId: OTHER_USER_ID,
          serviceRequestId: REQUEST_ID,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Increment limit', () => {
    it('throws BadRequestException when MAX_INCREMENT_COUNT is reached', async () => {
      prismaMock = buildPrismaMock(buildServiceRequest({ incrementCount: 3 }));
      const module = await Test.createTestingModule({
        providers: [
          IncrementServicePriceUseCase,
          { provide: PrismaService, useValue: prismaMock },
          { provide: EventEmitter2, useValue: eventEmitterMock },
        ],
      }).compile();
      useCase = module.get(IncrementServicePriceUseCase);

      await expect(
        useCase.execute({
          requestingUserId: OWNER_USER_ID,
          serviceRequestId: REQUEST_ID,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns canIncrementAgain=false when one increment away from limit', async () => {
      prismaMock = buildPrismaMock(buildServiceRequest({ incrementCount: 2 }));
      const module = await Test.createTestingModule({
        providers: [
          IncrementServicePriceUseCase,
          { provide: PrismaService, useValue: prismaMock },
          { provide: EventEmitter2, useValue: eventEmitterMock },
        ],
      }).compile();
      useCase = module.get(IncrementServicePriceUseCase);

      const result = await useCase.execute({
        requestingUserId: OWNER_USER_ID,
        serviceRequestId: REQUEST_ID,
      });

      expect(result.canIncrementAgain).toBe(false);
      expect(result.incrementCount).toBe(3);
    });

    it('returns canIncrementAgain=true when below limit', async () => {
      const result = await useCase.execute({
        requestingUserId: OWNER_USER_ID,
        serviceRequestId: REQUEST_ID,
      });

      expect(result.canIncrementAgain).toBe(true);
      expect(result.maxIncrementCount).toBe(3);
    });
  });

  describe('Not found', () => {
    it('throws NotFoundException when the service request does not exist', async () => {
      prismaMock = buildPrismaMock(null);
      const module = await Test.createTestingModule({
        providers: [
          IncrementServicePriceUseCase,
          { provide: PrismaService, useValue: prismaMock },
          { provide: EventEmitter2, useValue: eventEmitterMock },
        ],
      }).compile();
      useCase = module.get(IncrementServicePriceUseCase);

      await expect(
        useCase.execute({
          requestingUserId: OWNER_USER_ID,
          serviceRequestId: REQUEST_ID,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Event emission', () => {
    it('emits service-request.price-incremented event after successful increment', async () => {
      await useCase.execute({
        requestingUserId: OWNER_USER_ID,
        serviceRequestId: REQUEST_ID,
      });

      expect(eventEmitterMock.emit).toHaveBeenCalledWith(
        'service-request.price-incremented',
        expect.objectContaining({
          serviceRequestId: REQUEST_ID,
          incrementCount: 1,
          incrementAmount: 1000,
        }),
      );
    });
  });
});
