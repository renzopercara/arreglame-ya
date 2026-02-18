import { Resolver, Mutation, Args, Context, Query, ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LegalService } from '../legal/legal.service';
import { LoginInput, RegisterInput, BecomeWorkerInput } from './dto/auth.input';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, ActiveRole } from '@prisma/client';

/**
 * Maps UserRole to LegalService target audience
 * WORKER -> 'WORKER'
 * CLIENT -> 'CLIENT'
 */
function mapUserRoleToAudience(role: UserRole): 'CLIENT' | 'WORKER' {
  return role === UserRole.WORKER ? 'WORKER' : 'CLIENT';
}

@ObjectType('UserInfo')
export class UserInfoResponse {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field()
  role: string; // Kept for backward compatibility

  @Field(() => [String])
  roles: string[]; // New: Array of all roles user has

  @Field()
  currentRole: string; // New: Current primary role

  @Field()
  activeRole: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field()
  mustAcceptTerms: boolean;

  @Field({ nullable: true })
  mercadopagoCustomerId?: string;

  @Field({ nullable: true })
  mercadopagoAccessToken?: string;

  @Field({ nullable: true })
  status?: string;

  @Field(() => Int, { nullable: true })
  loyaltyPoints?: number;

  @Field(() => Float, { nullable: true })
  rating?: number;

  @Field(() => Float, { nullable: true })
  balance?: number;

  @Field(() => Int, { nullable: true })
  totalJobs?: number;

  @Field({ nullable: true })
  workerStatus?: string;

  @Field({ nullable: true })
  kycStatus?: string;

  @Field({ nullable: true })
  isKycVerified?: boolean;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  currentPlan?: string;

  @Field({ nullable: true })
  isEmailVerified?: boolean;
}

@ObjectType('AuthResponse')
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field(() => UserInfoResponse)
  user: UserInfoResponse;
}

@ObjectType('GenericResponse')
export class GenericResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;
}

@Resolver()
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private legalService: LegalService,
    private prisma: PrismaService,
  ) {}

  private async loadUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        workerProfile: true,
        clientProfile: true,
      },
    });
  }

  private toUserInfo(user: any, mustAcceptTerms: boolean): UserInfoResponse {
    const walletBalance = user.wallet ? Number((user.wallet as any).balanceAvailable ?? 0) : null;
    const worker = user.workerProfile;
    const client = user.clientProfile;

    return {
      id: user.id,
      email: user.email,
      name: client?.name || worker?.name || user.name || '',
      role: user.currentRole || user.role, // Backward compatibility
      roles: user.roles || [user.role || user.currentRole], // New multi-role support
      currentRole: user.currentRole || user.role, // New current role field
      activeRole: user.activeRole,
      avatar: client?.avatar || null,
      mustAcceptTerms,
      mercadopagoCustomerId: user.mercadopagoCustomerId || null,
      mercadopagoAccessToken: user.mercadopagoAccessToken || null,
      status: user.status,
      loyaltyPoints: client?.loyaltyPoints ?? 0,
      rating: worker?.rating ?? client?.rating ?? null,
      balance: walletBalance,
      totalJobs: worker?.totalJobs ?? 0,
      workerStatus: worker?.status ?? null,
      kycStatus: worker?.kycStatus ?? null,
      isKycVerified: worker?.isKycVerified ?? false,
      bio: worker?.bio ?? client?.bio ?? null,
      currentPlan: worker?.currentPlan ?? client?.currentPlan ?? null,
      isEmailVerified: user.isEmailVerified ?? false,
    } as UserInfoResponse;
  }

  @Mutation(() => AuthResponse)
  async login(@Args('input', { type: () => LoginInput }) input: LoginInput): Promise<AuthResponse> {
    const { accessToken, user } = await this.authService.login(input.email, input.password, input.role);
    const fullUser = await this.loadUser(user.id);
    
    // Map UserRole to target audience for legal service
    const targetAudience = mapUserRoleToAudience(fullUser.currentRole);
    const hasAccepted = await this.legalService.hasAcceptedLatest(user.id, targetAudience);

    return {
      accessToken,
      user: this.toUserInfo(fullUser, !hasAccepted),
    };
  }

  @Mutation(() => AuthResponse)
  async register(
    @Args('input', { type: () => RegisterInput }) input: RegisterInput,
    @Context() context: any
  ): Promise<AuthResponse> {
    const { accessToken, user } = await this.authService.register(input.email, input.password, input.name, input.role);

    if (input.termsAccepted) {
       // Map UserRole to target audience for legal service
       const targetAudience = mapUserRoleToAudience(input.role);
       const activeDoc = await this.legalService.getActiveDocument(targetAudience);
       if (activeDoc) {
           const ip = context?.req?.ip || '0.0.0.0';
           await this.legalService.acceptTerms(user.id, activeDoc.id, { 
               ip, 
               ua: input.userAgent || 'Registration-Flow' 
           });
       }
    }

    const fullUser = await this.loadUser(user.id);
    const targetAudience = mapUserRoleToAudience(input.role);
    const hasAccepted = await this.legalService.hasAcceptedLatest(user.id, targetAudience);

    return {
      accessToken,
      user: this.toUserInfo(fullUser, !hasAccepted),
    };
  }

  @Mutation(() => GenericResponse)
  async verifyEmail(@Args('token') token: string): Promise<GenericResponse> {
    return this.authService.verifyEmail(token);
  }

  @Mutation(() => GenericResponse)
  async resendVerificationEmail(@Args('email') email: string): Promise<GenericResponse> {
    return this.authService.resendVerificationEmail(email);
  }

  @Query(() => UserInfoResponse, { nullable: true })
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: any): Promise<UserInfoResponse | null> {
    if (!user?.sub) return null;
    const fullUser = await this.loadUser(user.sub);
    if (!fullUser) return null;

    const targetAudience = mapUserRoleToAudience(fullUser.currentRole);
    const hasAccepted = await this.legalService.hasAcceptedLatest(fullUser.id, targetAudience);
    return this.toUserInfo(fullUser, !hasAccepted);
  }

  @Mutation(() => UserInfoResponse)
  @UseGuards(AuthGuard)
  async switchActiveRole(
    @CurrentUser() user: any,
    @Args('activeRole', { type: () => ActiveRole }) activeRole: ActiveRole,
  ): Promise<UserInfoResponse> {
    if (!user?.sub) throw new UnauthorizedException('Usuario no autenticado');

    const updatedUser = await this.authService.switchActiveRole(user.sub, activeRole);
    const fullUser = await this.loadUser(updatedUser.id);
    const targetAudience = mapUserRoleToAudience(updatedUser.currentRole);
    const hasAccepted = await this.legalService.hasAcceptedLatest(updatedUser.id, targetAudience);

    return this.toUserInfo(fullUser, !hasAccepted);
  }

  @Mutation(() => AuthResponse)
  @UseGuards(AuthGuard)
  async becomeWorker(
    @CurrentUser() user: any,
    @Context() context: any,
    @Args('input', { type: () => BecomeWorkerInput }) input: BecomeWorkerInput,
  ): Promise<AuthResponse> {
    if (!user?.sub) throw new UnauthorizedException('Usuario no autenticado');

    if (!input.termsAccepted) {
      throw new UnauthorizedException('Debes aceptar los términos y condiciones');
    }

    // Accept terms if provided
    if (input.termsVersion) {
      const workerDoc = await this.legalService.getActiveDocument('WORKER');
      if (workerDoc && workerDoc.version === input.termsVersion) {
        const ip = context?.req?.ip || '0.0.0.0';
        const ua = context?.req?.headers?.['user-agent'] || 'BecomeWorker-Flow';
        await this.legalService.acceptTerms(user.sub, workerDoc.id, { ip, ua });
      }
    }

    // Create or update worker profile and get new JWT token
    const { accessToken, user: updatedUser } = await this.authService.becomeWorker(user.sub, {
      name: input.name,
      bio: input.bio,
      trade: input.trade,
      category: input.category,
      selfieImage: input.selfieImage,
    });

    // Load full user data
    const fullUser = await this.loadUser(updatedUser.id);
    const hasAccepted = await this.legalService.hasAcceptedLatest(updatedUser.id, 'WORKER');

    return {
      accessToken,
      user: this.toUserInfo(fullUser, !hasAccepted),
    };
  }

  @Mutation(() => UserInfoResponse)
  @UseGuards(AuthGuard)
  async updateWorkerStatus(
    @CurrentUser() user: any,
    @Args('status') status: string,
  ): Promise<UserInfoResponse> {
    // Validate status against WorkerStatus enum
    const validStatuses: Record<string, string> = {
      'ONLINE': 'ONLINE',
      'OFFLINE': 'OFFLINE',
      'PAUSED': 'PAUSED',
      'ON_JOB': 'ON_JOB',
    };
    
    if (!validStatuses[status]) {
      throw new Error(`Invalid status. Must be one of: ${Object.keys(validStatuses).join(', ')}`);
    }

    // Update worker profile status
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId: user.sub },
    });

    if (!worker) {
      throw new Error('Worker profile not found');
    }

    await this.prisma.workerProfile.update({
      where: { userId: user.sub },
      data: { status: validStatuses[status] as 'ONLINE' | 'OFFLINE' | 'PAUSED' | 'ON_JOB' },
    });

    // Return updated user info
    const fullUser = await this.loadUser(user.sub);
    return this.toUserInfo(fullUser, false);
  }
}
