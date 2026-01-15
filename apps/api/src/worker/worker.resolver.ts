
import { Resolver, Mutation, Args, Query, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRoles, RequireActiveRole } from '../auth/roles.decorator';
import { WorkerService } from './worker.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitKYCInput } from './dto/submit-kyc.input';

@ObjectType('WorkerProfile')
export class WorkerProfileResponse {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  rating?: number;

  @Field({ nullable: true })
  totalJobs?: number;

  @Field({ nullable: true })
  currentPlan?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  kycStatus?: string;

  @Field({ nullable: true })
  dniFront?: string;

  @Field({ nullable: true })
  dniBack?: string;

  @Field({ nullable: true })
  insuranceDoc?: string;

  @Field({ nullable: true })
  selfie?: string;
}

@ObjectType('UpdateLocationResponse')
export class UpdateLocationResponse {
  @Field()
  success: boolean;
}

@Resolver()
export class WorkerResolver {
  constructor(
      private workerService: WorkerService,
      private prisma: PrismaService
  ) {}

  @Mutation(() => UpdateLocationResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRoles('WORKER')
  @RequireActiveRole('PROVIDER')
  async updateWorkerLocation(
    @Args('lat') lat: number,
    @Args('lng') lng: number,
    @CurrentUser() user: any
  ): Promise<UpdateLocationResponse> {
    this.workerService.updateLocation(user.sub, lat, lng).catch(console.error);
    return { success: true };
  }

  @Mutation(() => WorkerProfileResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRoles('WORKER')
  @RequireActiveRole('PROVIDER')
  async setWorkerStatus(
    @Args('status') status: string,
    @CurrentUser() user: any
  ): Promise<WorkerProfileResponse> {
    return this.workerService.setStatus(user.sub, status);
  }

  @Mutation(() => WorkerProfileResponse)
  @UseGuards(AuthGuard)
  async submitKYC(
    @Args('input', { type: () => SubmitKYCInput }) input: SubmitKYCInput, 
    @CurrentUser() user: any
  ): Promise<WorkerProfileResponse> {
      const worker = await (this.prisma as any).workerProfile.findUnique({ where: { userId: user.sub } });
      
      if (!worker) throw new BadRequestException("Perfil no encontrado");
      if (worker.kycStatus === 'APPROVED') throw new BadRequestException("Ya estÃƒ¡s verificado.");

      // En prod, aquÃƒ­ llamarÃƒ­amos a un proveedor de KYC (Onfido/SumSub)
      // Para MVP, guardamos y marcamos para revisiÃƒ³n manual
      return (this.prisma as any).workerProfile.update({
          where: { userId: user.sub },
          data: {
              kycStatus: 'PENDING_REVIEW',
              dniFront: input.dniFront,
              dniBack: input.dniBack,
              insuranceDoc: input.insuranceDoc,
              selfie: input.selfie
          }
      });
  }

  @Query(() => WorkerProfileResponse, { nullable: true })
  @UseGuards(AuthGuard)
  async getPublicWorkerProfile(@Args('workerId') workerId: string): Promise<WorkerProfileResponse | null> {
      const profile = await (this.prisma as any).workerProfile.findUnique({
          where: { id: workerId }
      });
      
      if (!profile) return null;

      // SanitizaciÃƒ³n: Solo devolvemos datos pÃƒºblicos
      return {
          id: profile.id,
          userId: profile.userId,
          name: profile.name,
          rating: profile.rating,
          totalJobs: profile.totalJobs,
          currentPlan: profile.currentPlan,
          bio: profile.bio || "Cortador verificado de la comunidad.",
          status: profile.status
      };
  }
}
