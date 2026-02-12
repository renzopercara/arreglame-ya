/**
 * Auth Service - Auto-provisioning Tests
 * 
 * Tests the auto-provisioning of roles during login:
 * - Case A: WORKER logging in as CLIENT (auto-provision)
 * - Case B: User with both roles logging in (normal flow)
 * - Case C: Wrong password (should fail, no role creation)
 * - Case D: Attempt to login as ADMIN (should fail)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

describe('AuthService - Auto-provisioning', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: '', // Will be set in beforeEach
    roles: [UserRole.WORKER],
    currentRole: UserRole.WORKER,
    activeRole: 'WORKER' as const,
    status: 'LOGGED_IN' as const,
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerifiedAt: new Date(),
    mercadopagoCustomerId: null,
    mercadopagoAccessToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    workerProfile: {
      id: 'worker-123',
      userId: 'user-123',
      name: 'Test Worker',
      bio: null,
      trade: null,
      hourlyRate: null,
      availability: null,
      rating: 5.0,
      totalJobs: 0,
      status: 'OFFLINE' as const,
      latitude: null,
      longitude: null,
      lastLocationUpdate: null,
      reputationPoints: 0,
      currentPlan: 'STARTER',
      acceptanceRate: 1.0,
      cancellationRate: 0.0,
      penaltyUntil: null,
      kycStatus: 'PENDING_SUBMISSION' as const,
      isKycVerified: false,
      legalName: null,
      taxId: null,
      dateOfBirth: null,
      dniFront: null,
      dniBack: null,
      insuranceDoc: null,
      selfie: null,
      kycSubmittedAt: null,
      kycApprovedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    clientProfile: null,
    customerProfile: {
      id: 'customer-123',
      userId: 'user-123',
      name: 'Test Worker',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(async () => {
    // Hash a test password
    const passwordHash = await bcrypt.hash('Test1234', 10);
    mockUser.passwordHash = passwordHash;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            clientProfile: {
              create: jest.fn(),
            },
            workerProfile: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Case A: WORKER logging in as CLIENT (auto-provision)', () => {
    it('should auto-provision CLIENT role and create client profile', async () => {
      const userWithNewRole = {
        ...mockUser,
        roles: [UserRole.WORKER, UserRole.CLIENT],
        currentRole: UserRole.CLIENT,
        activeRole: 'CLIENT' as const,
        clientProfile: {
          id: 'client-123',
          userId: 'user-123',
          name: 'Test Worker',
        },
      };

      // Mock findUnique to return user with only WORKER role
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      // Mock transaction to return updated user
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          user: {
            update: jest.fn().mockResolvedValue(userWithNewRole),
          },
          clientProfile: {
            create: jest.fn().mockResolvedValue(userWithNewRole.clientProfile),
          },
        };
        return callback(mockTx);
      });

      const result = await authService.login('test@example.com', 'Test1234', UserRole.CLIENT);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.roles).toContain(UserRole.CLIENT);
      expect(result.user.roles).toContain(UserRole.WORKER);

      // Verify JWT was signed with correct payload
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-123',
          email: 'test@example.com',
          roles: [UserRole.WORKER, UserRole.CLIENT],
          currentRole: UserRole.CLIENT,
          activeRole: 'CLIENT',
        })
      );
    });

    it('should create client profile during auto-provisioning', async () => {
      const userWithNewRole = {
        ...mockUser,
        roles: [UserRole.WORKER, UserRole.CLIENT],
        currentRole: UserRole.CLIENT,
        activeRole: 'CLIENT' as const,
        clientProfile: {
          id: 'client-123',
          userId: 'user-123',
          name: 'Test Worker',
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      const mockClientCreate = jest.fn().mockResolvedValue(userWithNewRole.clientProfile);
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          user: {
            update: jest.fn().mockResolvedValue(userWithNewRole),
          },
          clientProfile: {
            create: mockClientCreate,
          },
        };
        return callback(mockTx);
      });

      await authService.login('test@example.com', 'Test1234', UserRole.CLIENT);

      expect(mockClientCreate).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          name: 'Test Worker',
        },
      });
    });
  });

  describe('Case B: User with both roles logging in (normal flow)', () => {
    it('should login successfully without creating new roles', async () => {
      const userWithBothRoles = {
        ...mockUser,
        roles: [UserRole.WORKER, UserRole.CLIENT],
        clientProfile: {
          id: 'client-123',
          userId: 'user-123',
          name: 'Test User',
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithBothRoles as any);

      const result = await authService.login('test@example.com', 'Test1234', UserRole.CLIENT);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.roles).toEqual([UserRole.WORKER, UserRole.CLIENT]);

      // Should NOT call $transaction since role already exists
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('Case C: Wrong password (should fail, no role creation)', () => {
    it('should throw UnauthorizedException with generic error', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(
        authService.login('test@example.com', 'WrongPassword123', UserRole.CLIENT)
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        authService.login('test@example.com', 'WrongPassword123', UserRole.CLIENT)
      ).rejects.toThrow('Credenciales incorrectas');

      // Should NOT call $transaction for role provisioning
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should not reveal whether user exists', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        authService.login('nonexistent@example.com', 'Test1234', UserRole.CLIENT)
      ).rejects.toThrow('Credenciales incorrectas');

      // Same error message for wrong password
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(
        authService.login('test@example.com', 'WrongPassword', UserRole.CLIENT)
      ).rejects.toThrow('Credenciales incorrectas');
    });
  });

  describe('Case D: Attempt to login as ADMIN (should fail)', () => {
    it('should reject auto-provisioning of ADMIN role', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(
        authService.login('admin-test@example.com', 'Test1234', UserRole.ADMIN)
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        authService.login('admin-test@example.com', 'Test1234', UserRole.ADMIN)
      ).rejects.toThrow('No tienes permisos para acceder a este rol');

      // Should NOT call $transaction for admin role
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should allow ADMIN login if user already has ADMIN role', async () => {
      const adminUser = {
        ...mockUser,
        email: 'admin-user@example.com',
        roles: [UserRole.ADMIN],
        currentRole: UserRole.ADMIN,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(adminUser as any);

      const result = await authService.login('admin-user@example.com', 'Test1234', UserRole.ADMIN);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');

      // Should NOT call $transaction since user already has ADMIN
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('Idempotency', () => {
    it('should not create duplicate client profile if it already exists', async () => {
      const userWithClientProfile = {
        ...mockUser,
        email: 'idempotent-test@example.com',
        roles: [UserRole.WORKER],
        clientProfile: {
          id: 'existing-client-123',
          userId: 'user-123',
          name: 'Existing Client',
        },
      };

      const userWithNewRole = {
        ...userWithClientProfile,
        roles: [UserRole.WORKER, UserRole.CLIENT],
        currentRole: UserRole.CLIENT,
        activeRole: 'CLIENT' as const,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithClientProfile as any);

      const mockClientCreate = jest.fn();
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          user: {
            update: jest.fn().mockResolvedValue(userWithNewRole),
          },
          clientProfile: {
            create: mockClientCreate,
          },
        };
        return callback(mockTx);
      });

      await authService.login('idempotent-test@example.com', 'Test1234', UserRole.CLIENT);

      // Should NOT create client profile since it already exists
      expect(mockClientCreate).not.toHaveBeenCalled();
    });
  });

  describe('Transaction Atomicity', () => {
    it('should rollback on profile creation failure', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        ...mockUser,
        email: 'transaction-test@example.com',
      } as any);

      // Mock transaction to throw error during profile creation
      jest.spyOn(prismaService, '$transaction').mockRejectedValue(
        new Error('Profile creation failed')
      );

      await expect(
        authService.login('transaction-test@example.com', 'Test1234', UserRole.CLIENT)
      ).rejects.toThrow('Profile creation failed');

      // User roles should not be updated if transaction fails
    });
  });

  describe('CLIENT to WORKER auto-provisioning', () => {
    it('should auto-provision WORKER role for CLIENT user', async () => {
      const clientUser = {
        ...mockUser,
        email: 'client-to-worker@example.com',
        roles: [UserRole.CLIENT],
        currentRole: UserRole.CLIENT,
        activeRole: 'CLIENT' as const,
        workerProfile: null,
        clientProfile: {
          id: 'client-123',
          userId: 'user-123',
          name: 'Test Client',
        },
      };

      const userWithNewRole = {
        ...clientUser,
        roles: [UserRole.CLIENT, UserRole.WORKER],
        currentRole: UserRole.WORKER,
        activeRole: 'WORKER' as const,
        workerProfile: {
          id: 'worker-123',
          userId: 'user-123',
          name: 'Test Client',
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(clientUser as any);

      const mockWorkerCreate = jest.fn().mockResolvedValue(userWithNewRole.workerProfile);
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          user: {
            update: jest.fn().mockResolvedValue(userWithNewRole),
          },
          workerProfile: {
            create: mockWorkerCreate,
          },
        };
        return callback(mockTx);
      });

      const result = await authService.login('client-to-worker@example.com', 'Test1234', UserRole.WORKER);

      expect(result).toBeDefined();
      expect(result.user.roles).toContain(UserRole.WORKER);
      expect(result.user.roles).toContain(UserRole.CLIENT);

      // Verify worker profile was created with KYC fields
      expect(mockWorkerCreate).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          name: 'Test Client',
          kycStatus: 'PENDING_SUBMISSION',
          isKycVerified: false,
        },
      });
    });
  });
});
