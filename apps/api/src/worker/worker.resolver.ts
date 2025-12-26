
import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { WorkerService } from './worker.service';
import { PrismaService } from '../prisma/prisma.service';

@Resolver('WorkerProfile')
export class WorkerResolver {
  constructor(
      private workerService: WorkerService,
      private prisma: PrismaService
  ) {}

  @Mutation('updateWorkerLocation')
  @UseGuards(AuthGuard)
  async updateWorkerLocation(
    @Args('lat') lat: number,
    @Args('lng') lng: number,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    this.workerService.updateLocation(userId, lat, lng).catch(console.error);
    return true;
  }

  @Mutation('setWorkerStatus')
  @UseGuards(AuthGuard)
  async setWorkerStatus(
    @Args('status') status: string,
    @Context() context: any
  ) {
    const userId = context.req.user.sub;
    return this.workerService.setStatus(userId, status);
  }

  @Mutation('submitKYC')
  @UseGuards(AuthGuard)
  async submitKYC(@Args('input') input: any, @Context() context: any) {
      const userId = context.req.user.sub;
      const worker = await (this.prisma as any).workerProfile.findUnique({ where: { userId } });
      
      if (!worker) throw new BadRequestException("Perfil no encontrado");
      if (worker.kycStatus === 'APPROVED') throw new BadRequestException("Ya estÃƒ¡s verificado.");

      // En prod, aquÃƒ­ llamarÃƒ­amos a un proveedor de KYC (Onfido/SumSub)
      // Para MVP, guardamos y marcamos para revisiÃƒ³n manual
      return (this.prisma as any).workerProfile.update({
          where: { userId },
          data: {
              kycStatus: 'PENDING_REVIEW',
              dniFront: input.dniFront,
              dniBack: input.dniBack,
              insuranceDoc: input.insuranceDoc,
              selfie: input.selfie
          }
      });
  }

  @Query('getPublicWorkerProfile')
  @UseGuards(AuthGuard)
  async getPublicWorkerProfile(@Args('workerId') workerId: string) {
      const profile = await (this.prisma as any).workerProfile.findUnique({
          where: { id: workerId }
      });
      
      if (!profile) return null;

      // SanitizaciÃƒ³n: Solo devolvemos datos pÃƒºblicos
      return {
          id: profile.id,
          name: profile.name,
          rating: profile.rating,
          totalJobs: profile.totalJobs,
          currentPlan: profile.currentPlan,
          bio: profile.bio || "Cortador verificado de la comunidad.",
          status: profile.status
      };
  }
}
