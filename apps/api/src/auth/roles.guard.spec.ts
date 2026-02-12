/**
 * Roles Guard - Role Switching Tests
 * 
 * Tests that the RolesGuard correctly validates activeRole by fetching
 * the latest value from the database, ensuring role switches are immediately effective.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ACTIVE_ROLE_KEY } from './roles.decorator';

describe('RolesGuard - Active Role Validation', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let prismaService: PrismaService;

  const mockUser = {
    sub: 'user-123',
    email: 'test@example.com',
    roles: ['WORKER', 'CLIENT'],
    currentRole: 'CLIENT',
    activeRole: 'CLIENT', // JWT has stale CLIENT role
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (user: any): ExecutionContext => {
    const mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(() => 'graphql'),
    } as unknown as ExecutionContext;

    // Mock GqlExecutionContext.create to return a context with our user
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: jest.fn().mockReturnValue({
        req: { user },
      }),
      getInfo: jest.fn(),
      getArgs: jest.fn(),
      getRoot: jest.fn(),
      getType: jest.fn(),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getArgByIndex: jest.fn(),
    } as any);

    return mockExecutionContext;
  };

  describe('Active Role Database Lookup', () => {
    it('should fetch activeRole from database when JWT has stale data', async () => {
      const context = createMockContext(mockUser);

      // Reflector returns WORKER as required role (but JWT has CLIENT)
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined) // No required roles
        .mockReturnValueOnce('WORKER'); // Required active role

      // Database has updated activeRole = WORKER (user switched roles)
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: 'user-123',
        activeRole: 'WORKER',
      } as any);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { activeRole: true },
      });
    });

    it('should reject when database activeRole does not match required role', async () => {
      const context = createMockContext(mockUser);

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce('WORKER');

      // Database still has activeRole = CLIENT (role switch not completed)
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: 'user-123',
        activeRole: 'CLIENT',
      } as any);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should allow access when database activeRole matches required role', async () => {
      const context = createMockContext(mockUser);

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce('CLIENT');

      // Database has activeRole = CLIENT
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: 'user-123',
        activeRole: 'CLIENT',
      } as any);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should reject if user not found in database', async () => {
      const context = createMockContext(mockUser);

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce('CLIENT');

      // Database lookup returns null (user deleted or token invalid)
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('No Active Role Required', () => {
    it('should allow access without database lookup when no activeRole is required', async () => {
      const context = createMockContext(mockUser);

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined) // No required roles
        .mockReturnValueOnce(undefined); // No required active role

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prismaService.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('Role Array Validation', () => {
    it('should validate user roles array when required roles specified', async () => {
      const context = createMockContext(mockUser);

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['WORKER', 'CLIENT']) // Required roles
        .mockReturnValueOnce(undefined); // No active role requirement

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should reject when user does not have required role', async () => {
      const userWithoutWorkerRole = {
        ...mockUser,
        roles: ['CLIENT'],
      };

      const context = createMockContext(userWithoutWorkerRole);

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['WORKER']) // Required roles
        .mockReturnValueOnce(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });
});
