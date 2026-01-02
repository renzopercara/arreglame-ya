
import { Resolver, Mutation, Args, Context, Query, ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LegalService } from '../legal/legal.service';
import { LoginInput, RegisterInput, BecomeWorkerInput } from './dto/auth.input';
import { AuthGuard } from './auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ObjectType('UserInfo')
export class UserInfoResponse {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field()
  role: string;

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
      role: user.role,
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
    const hasAccepted = await this.legalService.hasAcceptedLatest(user.id, user.role as 'CLIENT' | 'WORKER');

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
       const activeDoc = await this.legalService.getActiveDocument(input.role as 'CLIENT' | 'WORKER');
       if (activeDoc) {
           const ip = context?.req?.ip || '0.0.0.0';
           await this.legalService.acceptTerms(user.id, activeDoc.id, { 
               ip, 
               ua: input.userAgent || 'Registration-Flow' 
           });
       }
    }

    const fullUser = await this.loadUser(user.id);
    const hasAccepted = await this.legalService.hasAcceptedLatest(user.id, input.role as 'CLIENT' | 'WORKER');

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
  async me(@Context() context: any): Promise<UserInfoResponse | null> {
    const userId = context.req?.user?.id;
    if (!userId) return null;
    const user = await this.loadUser(userId);
    if (!user) return null;

    const hasAccepted = await this.legalService.hasAcceptedLatest(user.id, user.role as 'CLIENT' | 'WORKER');
    return this.toUserInfo(user, !hasAccepted);
  }

  @Mutation(() => UserInfoResponse)
  @UseGuards(AuthGuard)
  async switchActiveRole(
    @Context() context: any,
    @Args('activeRole') activeRole: 'CLIENT' | 'PROVIDER',
  ): Promise<UserInfoResponse> {
    const userId = context.req?.user?.sub;
    if (!userId) throw new UnauthorizedException('Usuario no autenticado');

    const updatedUser = await this.authService.switchActiveRole(userId, activeRole);
    const fullUser = await this.loadUser(updatedUser.id);
    const hasAccepted = await this.legalService.hasAcceptedLatest(updatedUser.id, updatedUser.role as 'CLIENT' | 'WORKER');

    return this.toUserInfo(fullUser, !hasAccepted);
  }

  @Mutation(() => UserInfoResponse)
  @UseGuards(AuthGuard)
  async becomeWorker(
    @Context() context: any,
    @Args('input', { type: () => BecomeWorkerInput }) input: BecomeWorkerInput,
  ): Promise<UserInfoResponse> {
    const userId = context.req?.user?.sub;
    if (!userId) throw new UnauthorizedException('Usuario no autenticado');

    if (!input.termsAccepted) {
      throw new UnauthorizedException('Debes aceptar los términos y condiciones');
    }

    // Accept terms if provided
    if (input.termsVersion) {
      const workerDoc = await this.legalService.getActiveDocument('WORKER');
      if (workerDoc && workerDoc.version === input.termsVersion) {
        const ip = context?.req?.ip || '0.0.0.0';
        const ua = context?.req?.headers?.['user-agent'] || 'BecomeWorker-Flow';
        await this.legalService.acceptTerms(userId, workerDoc.id, { ip, ua });
      }
    }

    // Create or update worker profile
    await this.authService.becomeWorker(userId, {
      name: input.name,
      bio: input.bio,
      trade: input.trade,
      category: input.category,
      selfieImage: input.selfieImage,
    });

    // Load updated user
    const fullUser = await this.loadUser(userId);
    const hasAccepted = await this.legalService.hasAcceptedLatest(userId, 'WORKER');

    return this.toUserInfo(fullUser, !hasAccepted);
  }
}
