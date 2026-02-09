
import { Resolver, Mutation, Args, Query, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRoles, RequireActiveRole } from '../auth/roles.decorator';
import { WorkerService } from './worker.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitKYCInput } from './dto/submit-kyc.input';
import { CreateWorkerSpecialtyInput, UpdateWorkerSpecialtyInput, AddMultipleSpecialtiesInput } from './dto/worker-specialty.input';
import { WorkerSpecialtyType } from './dto/worker-specialty.type';
import { Service } from './dto/service.type';

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

  @Field(() => [WorkerSpecialtyType], { nullable: true })
  specialties?: WorkerSpecialtyType[];
}

@ObjectType('UpdateLocationResponse')
export class UpdateLocationResponse {
  @Field()
  success: boolean;
}

@ObjectType('GenericSuccessResponse')
export class GenericSuccessResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;
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
      if (worker.kycStatus === 'APPROVED') throw new BadRequestException("Ya estás verificado.");

      // En prod, aquí llamaríamos a un proveedor de KYC (Onfido/SumSub)
      // Para MVP, guardamos y marcamos para revisión manual
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
          where: { id: workerId },
          include: {
              workerSpecialties: {
                  where: { status: 'ACTIVE' },
                  include: { category: true }
              }
          }
      });
      
      if (!profile) return null;

      // Sanitización: Solo devolvemos datos públicos
      return {
          id: profile.id,
          userId: profile.userId,
          name: profile.name,
          rating: profile.rating,
          totalJobs: profile.totalJobs,
          currentPlan: profile.currentPlan,
          bio: profile.bio || "Cortador verificado de la comunidad.",
          status: profile.status,
          specialties: profile.workerSpecialties
      };
  }

  // ============================================
  // WORKER SPECIALTY MUTATIONS & QUERIES
  // ============================================

  @Mutation(() => WorkerSpecialtyType)
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRoles('WORKER')
  async addWorkerSpecialty(
    @Args('input', { type: () => CreateWorkerSpecialtyInput }) input: CreateWorkerSpecialtyInput,
    @CurrentUser() user: any
  ): Promise<WorkerSpecialtyType> {
    // Get worker profile
    const worker = await (this.prisma as any).workerProfile.findUnique({
      where: { userId: user.sub }
    });

    if (!worker) {
      throw new BadRequestException('Worker profile not found');
    }

    return this.workerService.addSpecialty(worker.id, input);
  }

  @Mutation(() => [WorkerSpecialtyType])
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRoles('WORKER')
  async addMultipleWorkerSpecialties(
    @Args('input', { type: () => AddMultipleSpecialtiesInput }) input: AddMultipleSpecialtiesInput,
    @CurrentUser() user: any
  ): Promise<any> {
    // Get worker profile
    const worker = await (this.prisma as any).workerProfile.findUnique({
      where: { userId: user.sub }
    });

    if (!worker) {
      throw new BadRequestException('Worker profile not found');
    }

    return this.workerService.addMultipleSpecialties(worker.id, input.specialties);
  }

  @Mutation(() => WorkerSpecialtyType)
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRoles('WORKER')
  async updateWorkerSpecialty(
    @Args('input', { type: () => UpdateWorkerSpecialtyInput }) input: UpdateWorkerSpecialtyInput,
    @CurrentUser() user: any
  ): Promise<WorkerSpecialtyType> {
    // Get worker profile
    const worker = await (this.prisma as any).workerProfile.findUnique({
      where: { userId: user.sub }
    });

    if (!worker) {
      throw new BadRequestException('Worker profile not found');
    }

    return this.workerService.updateSpecialty(worker.id, input);
  }

  @Mutation(() => GenericSuccessResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRoles('WORKER')
  async removeWorkerSpecialty(
    @Args('specialtyId') specialtyId: string,
    @CurrentUser() user: any
  ): Promise<GenericSuccessResponse> {
    // Get worker profile
    const worker = await (this.prisma as any).workerProfile.findUnique({
      where: { userId: user.sub }
    });

    if (!worker) {
      throw new BadRequestException('Worker profile not found');
    }

    return this.workerService.removeSpecialty(worker.id, specialtyId);
  }

  @Query(() => [WorkerSpecialtyType])
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRoles('WORKER')
  async getMyWorkerSpecialties(
    @Args('includeInactive', { defaultValue: false }) includeInactive: boolean,
    @CurrentUser() user: any
  ): Promise<WorkerSpecialtyType[]> {
    // Get worker profile
    const worker = await (this.prisma as any).workerProfile.findUnique({
      where: { userId: user.sub }
    });

    if (!worker) {
      throw new BadRequestException('Worker profile not found');
    }

    return this.workerService.getWorkerSpecialties(worker.id, includeInactive);
  }

  @Query(() => WorkerSpecialtyType, { nullable: true })
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRoles('WORKER')
  async getWorkerSpecialtyById(
    @Args('specialtyId') specialtyId: string,
    @CurrentUser() user: any
  ): Promise<WorkerSpecialtyType | null> {
    // Get worker profile
    const worker = await (this.prisma as any).workerProfile.findUnique({
      where: { userId: user.sub }
    });

    if (!worker) {
      throw new BadRequestException('Worker profile not found');
    }

    return this.workerService.getWorkerSpecialtyById(worker.id, specialtyId);
  }

  @Query(() => [Service])
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRoles('WORKER')
  async getMyServices(
    @CurrentUser() user: any
  ): Promise<Service[]> {
    // Get worker profile
    const worker = await (this.prisma as any).workerProfile.findUnique({
      where: { userId: user.sub }
    });

    if (!worker) {
      throw new BadRequestException('Worker profile not found');
    }

    return this.workerService.getMyServices(worker.id);
  }
}

