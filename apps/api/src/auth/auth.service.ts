
import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { UserRegisteredEvent } from './events/user-events.listener';
import { Prisma, UserRole, ActiveRole } from '@prisma/client';

// Rate limiting store (in production, use Redis)
// TODO: Replace with Redis for production deployment
// This in-memory implementation is for development only
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Maps UserRole to ActiveRole
 * WORKER -> PROVIDER (for UI context)
 * CLIENT -> CLIENT
 */
function mapUserRoleToActiveRole(role: UserRole): ActiveRole {
  return role === UserRole.WORKER ? ActiveRole.PROVIDER : ActiveRole.CLIENT;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private eventEmitter: EventEmitter2,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private generateEmailVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  private checkRateLimit(email: string): void {
    const attempts = loginAttempts.get(email);
    const now = new Date();

    if (attempts) {
      const timeSinceLastAttempt = now.getTime() - attempts.lastAttempt.getTime();

      if (attempts.count >= MAX_LOGIN_ATTEMPTS && timeSinceLastAttempt < LOCKOUT_DURATION_MS) {
        const remainingTime = Math.ceil((LOCKOUT_DURATION_MS - timeSinceLastAttempt) / 60000);
        throw new UnauthorizedException(
          `Demasiados intentos fallidos. Intenta nuevamente en ${remainingTime} minutos.`
        );
      }

      // Reset counter if lockout period has passed
      if (timeSinceLastAttempt >= LOCKOUT_DURATION_MS) {
        loginAttempts.delete(email);
      }
    }
  }

  private recordFailedAttempt(email: string): void {
    const attempts = loginAttempts.get(email);
    const now = new Date();

    if (attempts) {
      loginAttempts.set(email, {
        count: attempts.count + 1,
        lastAttempt: now,
      });
    } else {
      loginAttempts.set(email, {
        count: 1,
        lastAttempt: now,
      });
    }
  }

  private clearFailedAttempts(email: string): void {
    loginAttempts.delete(email);
  }

  async login(email: string, password: string, role: UserRole) {
    // Check rate limiting
    this.checkRateLimit(email);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Generic error message for security (don't reveal if user exists)
    const genericError = 'Credenciales incorrectas';

    if (!user) {
      this.recordFailedAttempt(email);
      // Log internally for security monitoring
      console.warn(`Login attempt for non-existent user: ${email}`);
      throw new UnauthorizedException(genericError);
    }

    const passwordMatch = await this.comparePasswords(password, user.passwordHash);

    if (!passwordMatch) {
      this.recordFailedAttempt(email);
      // Log internally for security monitoring
      console.warn(`Failed login attempt for user: ${email}`);
      throw new UnauthorizedException(genericError);
    }

    // Check if user has the requested role in their roles array
    if (!user.roles || !user.roles.includes(role)) {
      this.recordFailedAttempt(email);
      throw new UnauthorizedException(`Este usuario no tiene el rol de ${role}`);
    }

    // Check if email is verified (for financial operations later)
    // Note: We allow login even without verification, but block financial operations
    if (!user.isEmailVerified) {
      console.log(`User ${email} logged in without email verification`);
    }

    // Clear failed attempts on successful login
    this.clearFailedAttempts(email);

    // JWT Payload seguro - includes roles array and currentRole
    const payload = { 
      sub: user.id, 
      email: user.email, 
      roles: user.roles,
      currentRole: user.currentRole,
      activeRole: user.activeRole,
      isEmailVerified: user.isEmailVerified 
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken, user };
  }

  async register(email: string, password: string, name: string, role: UserRole) {
    // Validate password strength
    if (password.length < 8) {
      throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
    }
    
    // Check for at least one uppercase, one lowercase, and one number
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      throw new BadRequestException(
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
      );
    }

    const passwordHash = await this.hashPassword(password);
    const emailVerificationToken = this.generateEmailVerificationToken();

    try {
      const user = await this.prisma.$transaction(async (tx) => {
          // Map the UserRole to ActiveRole using helper function
          const activeRole = mapUserRoleToActiveRole(role);
          
          const newUser = await tx.user.create({
              data: {
                  email,
                  passwordHash,
                  roles: [role], // Use typed enum value
                  currentRole: role, // Use typed enum value
                  activeRole: activeRole, // Use mapped ActiveRole enum value
                  status: 'LOGGED_IN',
                  isEmailVerified: false,
                  emailVerificationToken,
              }
          });

          // Crear perfiles duales para flexibilidad
          await tx.customerProfile.create({
              data: { userId: newUser.id, name }
          });

          if (role === UserRole.CLIENT) {
              await tx.clientProfile.create({
                  data: { userId: newUser.id, name }
              });
          } else if (role === UserRole.WORKER) {
              await tx.workerProfile.create({
                  data: { 
                    userId: newUser.id, 
                    name,
                    kycStatus: 'PENDING_SUBMISSION',
                    isKycVerified: false
                  }
              });
          }

          return newUser;
      });

      const payload = { 
        sub: user.id, 
        email: user.email, 
        roles: user.roles,
        currentRole: user.currentRole,
        activeRole: user.activeRole,
        isEmailVerified: user.isEmailVerified 
      };
      const accessToken = await this.jwtService.signAsync(payload);

      // Emitir evento para enviar email de verificación
      this.eventEmitter.emit('user.registered', { 
        email: user.email, 
        name,
        verificationToken: emailVerificationToken 
      } as UserRegisteredEvent);

      return { accessToken, user };
    } catch (error) {
      // Handle Prisma duplicate key error (P2002)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // The .meta property contains constraint information
          throw new ConflictException('Este correo electrónico ya está registrado');
        }
      }
      // Re-throw other errors
      throw error;
    }
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Token de verificación inválido o expirado');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null, // Clear token after use
      },
    });

    return { success: true, message: 'Email verificado correctamente' };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('El email ya está verificado');
    }

    const emailVerificationToken = this.generateEmailVerificationToken();

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken },
    });

    // Emit event to send verification email
    const profile = await this.getProfileName(user.id, user.currentRole);
    this.eventEmitter.emit('user.registered', {
      email: user.email,
      name: profile?.name || 'Usuario',
      verificationToken: emailVerificationToken,
    } as UserRegisteredEvent);

    return { success: true, message: 'Email de verificación enviado' };
  }

  private async getProfileName(userId: string, role: UserRole): Promise<{ name: string } | null> {
    if (role === UserRole.CLIENT) {
      return await this.prisma.clientProfile.findUnique({
        where: { userId },
        select: { name: true },
      });
    } else if (role === UserRole.WORKER) {
      return await this.prisma.workerProfile.findUnique({
        where: { userId },
        select: { name: true },
      });
    }
    return null;
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async switchActiveRole(userId: string, activeRole: ActiveRole) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { activeRole },
    });
  }

  async becomeWorker(
    userId: string,
    input: {
      name: string;
      bio?: string;
      trade?: string;
      category?: string;
      selfieImage?: string;
    }
  ) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { workerProfile: true, clientProfile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // If worker profile already exists, update it
    if (user.workerProfile) {
      const updatedProfile = await this.prisma.workerProfile.update({
        where: { userId },
        data: {
          name: input.name,
          bio: input.bio,
          trade: input.trade,
          selfie: input.selfieImage,
          kycStatus: 'PENDING_SUBMISSION',
        },
      });

      // Update user to add WORKER role if not present, and set currentRole to WORKER
      const currentRoles = user.roles || [user.currentRole];
      const updatedRoles = currentRoles.includes(UserRole.WORKER) 
        ? currentRoles 
        : [...currentRoles, UserRole.WORKER];

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          roles: updatedRoles,
          currentRole: UserRole.WORKER,
          activeRole: ActiveRole.PROVIDER,
        },
      });

      return updatedProfile;
    }

    // Create new worker profile
    const workerProfile = await this.prisma.workerProfile.create({
      data: {
        userId,
        name: input.name,
        bio: input.bio,
        trade: input.trade,
        selfie: input.selfieImage,
        kycStatus: 'PENDING_SUBMISSION',
        isKycVerified: false,
        status: 'OFFLINE',
      },
    });

    // Update user to add WORKER role and set currentRole to WORKER
    const currentRoles = user.roles || [user.currentRole];
    const updatedRoles = currentRoles.includes(UserRole.WORKER) 
      ? currentRoles 
      : [...currentRoles, UserRole.WORKER];

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: updatedRoles,
        currentRole: UserRole.WORKER,
        activeRole: ActiveRole.PROVIDER,
      },
    });

    return workerProfile;
  }
}
