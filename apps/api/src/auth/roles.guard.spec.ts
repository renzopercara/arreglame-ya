/**
 * Roles Guard Tests
 *
 * The RolesGuard reads roles and activeRole directly from request.user,
 * which is hydrated with fresh DB data by AuthGuard on every request.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockUser = {
    sub: 'user-123',
    email: 'test@example.com',
    roles: ['WORKER', 'CLIENT'],
    currentRole: 'CLIENT',
    activeRole: 'CLIENT',
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
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
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

  describe('No roles required', () => {
    it('should allow access when no roles are required', async () => {
      const context = createMockContext(mockUser);

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Active Role Validation (from request.user hydrated by AuthGuard)', () => {
    it('should allow access when user.activeRole matches required active role', async () => {
      const userWithWorkerActive = { ...mockUser, activeRole: 'WORKER' };
      const context = createMockContext(userWithWorkerActive);

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce('WORKER');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should reject when user.activeRole does not match required active role', async () => {
      const context = createMockContext(mockUser); // activeRole: 'CLIENT'

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce('WORKER');

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should allow access when user.activeRole matches CLIENT requirement', async () => {
      const context = createMockContext(mockUser); // activeRole: 'CLIENT'

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce('CLIENT');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Role Array Validation', () => {
    it('should allow access when user has one of the required roles', async () => {
      const context = createMockContext(mockUser);

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['WORKER', 'CLIENT'])
        .mockReturnValueOnce(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access for WORKER role when user has both CLIENT and WORKER', async () => {
      const context = createMockContext(mockUser);

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['WORKER'])
        .mockReturnValueOnce(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should reject when user does not have the required role', async () => {
      const userWithoutWorkerRole = { ...mockUser, roles: ['CLIENT'] };
      const context = createMockContext(userWithoutWorkerRole);

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['WORKER'])
        .mockReturnValueOnce(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should deny access when user.roles is not an array (legacy data)', async () => {
      const userWithStringRoles = { ...mockUser, roles: 'CLIENT' as any };
      const context = createMockContext(userWithStringRoles);

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['CLIENT'])
        .mockReturnValueOnce(undefined);

      // Non-array roles are treated as empty - access denied
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should deny access when user.roles is undefined', async () => {
      const userWithNoRoles = { ...mockUser, roles: undefined };
      const context = createMockContext(userWithNoRoles);

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['CLIENT'])
        .mockReturnValueOnce(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should deny access when user.roles is null', async () => {
      const userWithNullRoles = { ...mockUser, roles: null as any };
      const context = createMockContext(userWithNullRoles);

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['CLIENT'])
        .mockReturnValueOnce(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should allow access with duplicate roles in array', async () => {
      const userWithDuplicateRoles = { ...mockUser, roles: ['WORKER', 'WORKER', 'CLIENT'] };
      const context = createMockContext(userWithDuplicateRoles);

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['WORKER'])
        .mockReturnValueOnce(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});

