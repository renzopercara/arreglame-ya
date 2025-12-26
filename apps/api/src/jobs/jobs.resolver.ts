
import { Resolver, Query, Mutation, Args, Subscription, Context } from '@nestjs/graphql';
import { UnauthorizedException, Inject, UseGuards, BadRequestException } from '@nestjs/common';
import { PubSubEngine } from 'graphql-subscriptions';
import { PrismaService } from '../prisma/prisma.service';
import { AiVisionService } from '../ai/ai.service';
import { BillingService } from '../billing/billing.service';
import { ContentSecurityService } from '../security/content-security.service';
import { CreateJobInput } from './dto/create-job.input';
import { EstimateJobInput } from './dto/estimate-job.input';
import { AuthGuard } from '../auth/auth.guard';

@Resolver('ServiceRequest')
export class JobsResolver {
  constructor(
    private prisma: PrismaService,
    private aiService: AiVisionService,
    private billingService: BillingService,
    private securityService: ContentSecurityService,
    @Inject('PUB_SUB') private pubSub: PubSubEngine,
  ) {}

  @Query('estimateJob')
  @UseGuards(AuthGuard)
  async estimateJob(@Args('input') input: EstimateJobInput) {
    const aiResult = await this.aiService.estimateGardenWork(input.image, input.description || '');
    
    const difficultyAdjusted = input.hasHighWeeds ? aiResult.difficultyMultiplier * 1.3 : aiResult.difficultyMultiplier;
    const workerNet = input.squareMeters * 150 * difficultyAdjusted;
    const total = workerNet / 0.75; 

    return {
      ...aiResult,
      difficultyMultiplier: difficultyAdjusted,
      price: {
        total,
        workerNet,
        platformFee: total * 0.25,
        taxes: 0,
        currency: 'ARS',
        calculationSnapshot: JSON.stringify({ ...aiResult, input })
      }
    };
  }

  @Mutation('createJob')
  @UseGuards(AuthGuard)
  async createJob(@Args('input') input: CreateJobInput) {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    
    const price = {
        total: input.squareMeters * 200 * input.difficulty,
        workerNet: input.squareMeters * 150 * input.difficulty,
        platformFee: 50 * input.squareMeters,
        taxes: 0,
        currency: 'ARS'
    };

    const newJob = await (this.prisma as any).serviceRequest.create({
      data: {
        clientId: input.clientId,
        status: 'CREATED',
        latitude: input.lat,
        longitude: input.lng,
        gardenImageBefore: input.image,
        description: input.description,
        difficulty: input.difficulty,
        estimatedHours: input.estimatedHours,
        squareMeters: input.squareMeters,
        pin,
        price: price as any
      }
    });

    return newJob;
  }

  @Mutation('startJob')
  @UseGuards(AuthGuard)
  async startJob(@Args('jobId') jobId: string, @Args('pin') pin: string) {
    const job = await (this.prisma as any).serviceRequest.findUnique({ 
        where: { id: jobId }
    });
    
    if (!job || job.pin !== pin) {
      throw new UnauthorizedException("PIN Incorrecto o trabajo no encontrado.");
    }

    const updatedJob = await (this.prisma as any).serviceRequest.update({
      where: { id: jobId },
      data: { status: 'IN_PROGRESS', startedAt: new Date() }
    });

    (this.pubSub as any).publish(`JOB_UPDATE_${jobId}`, { jobUpdated: updatedJob });
    return updatedJob;
  }

  @Mutation('arriveAtJob')
  @UseGuards(AuthGuard)
  async arriveAtJob(
    @Args('workerId') workerId: string, 
    @Args('jobId') jobId: string,
    @Args('lat') lat: number,
    @Args('lng') lng: number
  ) {
     (this.pubSub as any).publish(`WORKER_LOCATION_${jobId}`, { workerLocationMoved: { lat, lng } });
     return true;
  }

  @Mutation('completeJob')
  @UseGuards(AuthGuard)
  async completeJob(
      @Args('jobId') jobId: string, 
      @Args('imageAfter') imageAfter: string,
      @Args('evidenceImages') evidenceImages?: string[]
  ) {
      const job = await (this.prisma as any).serviceRequest.findUnique({ where: { id: jobId } });
      
      const audit = await this.aiService.auditJobCompletion(job.gardenImageBefore, imageAfter, evidenceImages || []);

      if (audit.approved) {
          const warrantyExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // +72 Hours
          
          await (this.prisma as any).serviceRequest.update({
              where: { id: jobId },
              data: { 
                  status: 'PENDING_CLIENT_APPROVAL',
                  gardenImageAfter: imageAfter,
                  evidenceImages: evidenceImages || [],
                  completedAt: new Date(),
                  warrantyExpiresAt
              }
          });
          const updated = await (this.prisma as any).serviceRequest.findUnique({ where: { id: jobId } });
          (this.pubSub as any).publish(`JOB_UPDATE_${jobId}`, { jobUpdated: updated });
      }

      return audit;
  }

  // --- POST SALES LOGIC ---

  @Query('getJobHistory')
  @UseGuards(AuthGuard)
  async getJobHistory(@Args('jobId') jobId: string, @Context() ctx: any) {
    const userId = ctx.req.user.sub;
    const job = await (this.prisma as any).serviceRequest.findUnique({
        where: { id: jobId },
        include: { 
            client: true, 
            worker: true,
            tickets: { where: { status: { not: 'CLOSED' } } },
            reviews: { where: { authorId: { in: [userId] } } } // SimplificaciÃƒ³n: busca por user ID, en prod serÃƒ­a profile ID
        }
    });

    if (!job) throw new BadRequestException("Trabajo no encontrado");

    // Buscamos si el usuario actual ya dejÃƒ³ review
    const myReview = await (this.prisma as any).review.findFirst({
        where: { jobId, author: { userId: userId } }
    });

    return {
        ...job,
        myReview,
        activeTicket: job.tickets[0] || null
    };
  }

  @Mutation('submitReview')
  @UseGuards(AuthGuard)
  async submitReview(@Args('input') input: any, @Context() ctx: any) {
     const userId = ctx.req.user.sub;
     const job = await (this.prisma as any).serviceRequest.findUnique({ where: { id: input.jobId }, include: { worker: true, client: true } });
     if (!job) throw new BadRequestException("Job not found");

     // Determinar perfil autor (Simplificado, asume cliente califica a worker)
     const authorProfile = await (this.prisma as any).clientProfile.findUnique({ where: { userId } });
     if (!authorProfile) throw new BadRequestException("Perfil no encontrado");

     const review = await (this.prisma as any).review.create({
         data: {
             jobId: input.jobId,
             rating: input.rating,
             comment: input.comment,
             authorId: authorProfile.id,
             targetId: job.workerId
         }
     });

     // LÃƒ³gica de Riesgo: Si califica <= 2, abrir ticket automÃƒ¡tico
     if (input.rating <= 2) {
         await (this.prisma as any).supportTicket.create({
             data: {
                 jobId: input.jobId,
                 reporterId: userId,
                 category: 'AUTOMATED_LOW_RATING',
                 priority: 'HIGH',
                 status: 'OPEN',
                 subject: `Alerta Calidad: Baja calificaciÃƒ³n (${input.rating}Ã¢Ëœâ€¦)`,
                 description: `El cliente calificÃƒ³ con ${input.rating} estrellas. Comentario: "${input.comment || 'Sin comentario'}". Requiere revisiÃƒ³n de QA.`
             }
         });
     }

     return review;
  }

  @Mutation('createSupportTicket')
  @UseGuards(AuthGuard)
  async createSupportTicket(@Args('input') input: any, @Context() ctx: any) {
      const userId = ctx.req.user.sub;
      return (this.prisma as any).supportTicket.create({
          data: {
              jobId: input.jobId,
              reporterId: userId,
              category: input.category,
              priority: 'MEDIUM',
              status: 'OPEN',
              subject: input.subject,
              description: input.description
          }
      });
  }

  // --- COMMUNICATION ---

  @Mutation('sendMessage')
  @UseGuards(AuthGuard)
  async sendMessage(
    @Args('jobId') jobId: string,
    @Args('senderId') senderId: string,
    @Args('role') role: string,
    @Args('content') content: string
  ) {
    await this.securityService.validateMessageContent(senderId, jobId, content);

    const msg = await (this.prisma as any).chatMessage.create({
      data: {
        jobId,
        senderId,
        senderRole: role,
        content
      }
    });

    (this.pubSub as any).publish(`CHAT_MESSAGE_${jobId}`, { chatMessageAdded: { ...msg, timestamp: msg.timestamp.getTime() } });

    return { ...msg, timestamp: msg.timestamp.getTime() };
  }

  @Query('nearbyJobs')
  @UseGuards(AuthGuard)
  async nearbyJobs(@Args('lat') lat: number, @Args('lng') lng: number) {
      return (this.prisma as any).serviceRequest.findMany({
          where: { status: 'CREATED' },
          take: 10
      });
  }

  @Query('chatMessages')
  @UseGuards(AuthGuard)
  async chatMessages(@Args('jobId') jobId: string) {
      const msgs = await (this.prisma as any).chatMessage.findMany({
          where: { jobId },
          orderBy: { timestamp: 'asc' }
      });
      return msgs.map((m: any) => ({...m, timestamp: m.timestamp.getTime() }));
  }

  @Mutation('requestExtraTime')
  @UseGuards(AuthGuard)
  async requestExtraTime(@Args('jobId') jobId: string, @Args('minutes') minutes: number, @Args('reason') reason: string) {
      const updated = await (this.prisma as any).serviceRequest.update({
          where: { id: jobId },
          data: {
              extraTimeMinutes: minutes,
              extraTimeReason: reason,
              extraTimeStatus: 'PENDING'
          }
      });
      (this.pubSub as any).publish(`JOB_UPDATE_${jobId}`, { jobUpdated: updated });
      return updated;
  }

  @Mutation('respondToExtraTime')
  @UseGuards(AuthGuard)
  async respondToExtraTime(@Args('jobId') jobId: string, @Args('approved') approved: boolean) {
      const status = approved ? 'APPROVED' : 'REJECTED';
      const updated = await (this.prisma as any).serviceRequest.update({
          where: { id: jobId },
          data: { extraTimeStatus: status }
      });
      (this.pubSub as any).publish(`JOB_UPDATE_${jobId}`, { jobUpdated: updated });
      return { id: jobId, extraTimeStatus: status, totalPrice: updated.price.total };
  }

  @Subscription('jobUpdated')
  jobUpdated(@Args('jobId') jobId: string) {
    return (this.pubSub as any).asyncIterator(`JOB_UPDATE_${jobId}`);
  }

  @Subscription('workerLocationMoved')
  workerLocationMoved(@Args('jobId') jobId: string) {
    return (this.pubSub as any).asyncIterator(`WORKER_LOCATION_${jobId}`);
  }

  @Subscription('chatMessageAdded')
  chatMessageAdded(@Args('jobId') jobId: string) {
    return (this.pubSub as any).asyncIterator(`CHAT_MESSAGE_${jobId}`);
  }
}
