import {
  Resolver,
  Query,
  Mutation,
  Subscription,
  Args,
  Context,
  ObjectType,
  Field,
  Float,
  ID,
  Int,
} from '@nestjs/graphql';
import { UnauthorizedException, Inject, UseGuards, BadRequestException } from '@nestjs/common';
import { PubSubEngine } from 'graphql-subscriptions';
import GraphQLJSON from 'graphql-type-json';

import { PrismaService } from '../prisma/prisma.service';
import { AiVisionService } from '../ai/ai.service';
import { ContentSecurityService } from '../security/content-security.service';
import { CreateJobInput } from './dto/create-job.input';
import { EstimateJobInput } from './dto/estimate-job.input';
import { AuthGuard } from '../auth/auth.guard';
import { UserInfoResponse } from '../auth/auth.resolver';

// ============================================
// OBJECT TYPES (GraphQL Code First)
// ============================================

@ObjectType()
class JobPrice {
  @Field(() => Float)
  total!: number;

  @Field(() => Float)
  workerNet!: number;

  @Field(() => Float)
  platformFee!: number;

  @Field(() => Float)
  taxes!: number;

  @Field()
  currency!: string;

  @Field({ nullable: true })
  calculationSnapshot?: string;
}

@ObjectType()
class JobEstimateResponse {
  @Field(() => Float)
  difficultyMultiplier!: number;

  @Field(() => JobPrice)
  price!: JobPrice;

  @Field(() => GraphQLJSON, { nullable: true })
  aiAnalysis?: any;
}

@ObjectType()
class AuditResponse {
  @Field()
  approved!: boolean;

  @Field(() => Float)
  confidence!: number;

  @Field(() => [String], { nullable: true })
  observations?: string[];
}

@ObjectType()
export class Job {
  @Field(() => ID)
  id!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  city?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  price?: any;

  @Field({ nullable: true })
  gardenImageBefore?: string;

  @Field({ nullable: true })
  gardenImageAfter?: string;

  @Field(() => [String], { nullable: true })
  evidenceImages?: string[];

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field(() => String, { nullable: true })
  provider?: string | null;
}

@ObjectType()
class Review {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  rating!: number;

  @Field({ nullable: true })
  comment?: string;
}

const mapUserInfo = (user: any): UserInfoResponse | null => {
  if (!user) return null;
  const worker = user.workerProfile;
  const client = user.clientProfile;
  const wallet = user.wallet;

  return {
    id: user.id,
    email: user.email,
    name: client?.name || worker?.name || user.name || '',
    role: user.role,
    activeRole: user.activeRole,
    avatar: client?.avatar || null,
    mustAcceptTerms: false,
    mercadopagoCustomerId: user.mercadopagoCustomerId || null,
    mercadopagoAccessToken: user.mercadopagoAccessToken || null,
    status: user.status,
    loyaltyPoints: client?.loyaltyPoints ?? 0,
    rating: worker?.rating ?? client?.rating ?? null,
    balance: wallet ? Number((wallet as any).balanceAvailable ?? 0) : null,
    totalJobs: worker?.totalJobs ?? 0,
    workerStatus: worker?.status ?? null,
    kycStatus: worker?.kycStatus ?? null,
    bio: worker?.bio ?? client?.bio ?? null,
    currentPlan: worker?.currentPlan ?? client?.currentPlan ?? null,
  } as UserInfoResponse;
};

const mapServiceRequestToJob = (s: any): Job => ({
  id: s.id,
  status: s.status,
  description: s.description,
  title: s.description || 'Servicio',
  address: s.address,
  city: s.city,
  price: s.price,
  gardenImageBefore: s.gardenImageBefore,
  gardenImageAfter: s.gardenImageAfter,
  evidenceImages: s.evidenceImages,
  category: s.category ?? null,
  imageUrl: s.gardenImageBefore || s.gardenImageAfter || (s.evidenceImages?.[0] ?? null),
  provider: s.worker?.user?.name || s.worker?.user?.email || 'Anónimo',
});

// ============================================
// RESOLVER
// ============================================

@Resolver(() => Job)
export class JobsResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiVisionService,
    private readonly securityService: ContentSecurityService,
    @Inject('PUB_SUB') private readonly pubSub: any, // any to allow asyncIterator
  ) {}

  // ------------------------------------------
  // QUERIES
  // ------------------------------------------

  @Query(() => JobEstimateResponse)
  @UseGuards(AuthGuard)
  async estimateJob(@Args('input', { type: () => EstimateJobInput }) input: EstimateJobInput): Promise<JobEstimateResponse> {
    const aiResult = await this.aiService.estimateGardenWork(input.image, input.description || '');

    const difficultyAdjusted = input.hasHighWeeds
      ? aiResult.difficultyMultiplier * 1.3
      : aiResult.difficultyMultiplier;

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
        calculationSnapshot: JSON.stringify({ ...aiResult, input }),
      },
    };
  }

  @Query(() => [Job])
  async getServices(
    @Args('category', { nullable: true }) category?: string,
    @Args('query', { nullable: true }) query?: string,
    @Args('location', { nullable: true }) location?: string,
    @Args('latitude', { type: () => Float, nullable: true }) latitude?: number,
    @Args('longitude', { type: () => Float, nullable: true }) longitude?: number,
    @Args('radiusKm', { type: () => Int, nullable: true }) radiusKm?: number,
  ): Promise<Job[]> {
    const whereClause: any = { status: 'CREATED' };
    if (location) {
      whereClause.city = { equals: location, mode: 'insensitive' };
    }
    if (category) {
      whereClause.category = category;
    }
    if (query) {
      whereClause.description = { contains: query, mode: 'insensitive' };
    }

    const services = await (this.prisma.serviceRequest as any).findMany({
      where: whereClause,
      include: {
        worker: {
          include: {
            user: {
              include: {
                wallet: true,
                workerProfile: true,
                clientProfile: true,
              },
            },
          },
        },
        client: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // If coordinates are provided, filter and sort by proximity
    if (latitude && longitude) {
      const radius = radiusKm || 50; // Default 50km radius
      const radiusMeters = radius * 1000;

      const servicesWithDistance = services
        .filter((s: any) => s.latitude != null && s.longitude != null) // Only services with valid coordinates
        .map((s: any) => {
          const distance = this.calculateHaversineDistance(
            latitude,
            longitude,
            s.latitude,
            s.longitude
          );
          return { ...s, distance };
        });

      // Filter by radius and sort by distance
      const nearbyServices = servicesWithDistance
        .filter((s: any) => s.distance <= radiusMeters)
        .sort((a: any, b: any) => a.distance - b.distance);

      return nearbyServices.map((s: any) => mapServiceRequestToJob(s));
    }

    return services.map((s: any) => mapServiceRequestToJob(s));
  }

  @Query(() => [Job])
  async nearbyJobs(
    @Args('lat', { type: () => Float }) lat: number,
    @Args('lng', { type: () => Float }) lng: number,
    @Args('radius', { type: () => Float, nullable: true }) radius?: number,
  ): Promise<Job[]> {
    const radiusKm = radius || 50; // Default 50km radius
    const radiusMeters = radiusKm * 1000;

    // Get all service requests with coordinates
    const services = await (this.prisma.serviceRequest as any).findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        worker: {
          include: {
            user: {
              include: {
                wallet: true,
                workerProfile: true,
                clientProfile: true,
              },
            },
          },
        },
        client: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Calculate distances and filter by radius
    const servicesWithDistance = services
      .map((s: any) => {
        const distance = this.calculateHaversineDistance(
          lat,
          lng,
          s.latitude,
          s.longitude
        );
        return { ...s, distance };
      })
      .filter((s: any) => s.distance <= radiusMeters)
      .sort((a: any, b: any) => a.distance - b.distance);

    return servicesWithDistance.map((s: any) => mapServiceRequestToJob(s));
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in meters
   */
  private calculateHaversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // ------------------------------------------
  // MUTATIONS
  // ------------------------------------------

  @Mutation(() => Job)
  @UseGuards(AuthGuard)
  async createJob(@Args('input', { type: () => CreateJobInput }) input: CreateJobInput): Promise<Job> {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();

    const price = {
      total: input.squareMeters * 200 * input.difficulty,
      workerNet: input.squareMeters * 150 * input.difficulty,
      platformFee: 50 * input.squareMeters,
      taxes: 0,
      currency: 'ARS',
    };

    let city: string | null = null;
    if (input.address) {
      const parts = input.address.split(',').map((p) => p.trim());
      if (parts.length >= 2) city = parts[parts.length - 2];
    }

    const created = await (this.prisma.serviceRequest as any).create({
      data: {
        clientId: input.clientId,
        status: 'CREATED',
        latitude: input.lat,
        longitude: input.lng,
        address: input.address,
        city,
        gardenImageBefore: input.image,
        description: input.description,
        difficulty: input.difficulty,
        squareMeters: input.squareMeters,
        pin,
        price,
      },
    });

    const full = await (this.prisma.serviceRequest as any).findUnique({
      where: { id: created.id },
      include: {
        worker: {
          include: {
            user: {
              include: {
                wallet: true,
                workerProfile: true,
                clientProfile: true,
              },
            },
          },
        },
      },
    });

    return mapServiceRequestToJob(full ?? created);
  }

  @Mutation(() => Job)
  @UseGuards(AuthGuard)
  async startJob(
    @Args('jobId') jobId: string,
    @Args('pin') pin: string,
  ): Promise<Job> {
    const job = await (this.prisma.serviceRequest as any).findUnique({ where: { id: jobId } });

    if (!job || job.pin !== pin) {
      throw new UnauthorizedException('PIN Incorrecto o trabajo no encontrado.');
    }

    const updatedJob = await (this.prisma.serviceRequest as any).update({
      where: { id: jobId },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });

    this.pubSub.publish(`JOB_UPDATE_${jobId}`, { jobUpdated: updatedJob });
    return mapServiceRequestToJob(updatedJob);
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async arriveAtJob(
    @Args('workerId') workerId: string,
    @Args('jobId') jobId: string,
    @Args('lat', { type: () => Float }) lat: number,
    @Args('lng', { type: () => Float }) lng: number,
  ): Promise<boolean> {
    this.pubSub.publish(`WORKER_LOCATION_${jobId}`, { workerLocationMoved: { lat, lng } });
    return true;
  }

  @Mutation(() => AuditResponse)
  @UseGuards(AuthGuard)
  async completeJob(
    @Args('jobId') jobId: string,
    @Args('imageAfter') imageAfter: string,
    @Args('evidenceImages', { type: () => [String], nullable: true }) evidenceImages?: string[],
  ): Promise<AuditResponse> {
    const job = await (this.prisma.serviceRequest as any).findUnique({ where: { id: jobId } });
    const audit = await this.aiService.auditJobCompletion(job.gardenImageBefore, imageAfter, evidenceImages || []);

    if (audit.approved) {
      const warrantyExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
      await (this.prisma.serviceRequest as any).update({
        where: { id: jobId },
        data: {
          status: 'PENDING_CLIENT_APPROVAL',
          gardenImageAfter: imageAfter,
          evidenceImages: evidenceImages || [],
          completedAt: new Date(),
          warrantyExpiresAt,
        },
      });
      const updated = await (this.prisma.serviceRequest as any).findUnique({ where: { id: jobId } });
      this.pubSub.publish(`JOB_UPDATE_${jobId}`, { jobUpdated: updated });
    }

    return audit;
  }

  @Mutation(() => Review)
  @UseGuards(AuthGuard)
  async submitReview(
    @Args('input', { type: () => GraphQLJSON }) input: any,
    @Context() ctx: any,
  ): Promise<Review> {
    const userId = ctx.req.user.sub;
    const job = await (this.prisma.serviceRequest as any).findUnique({ where: { id: input.jobId } });
    if (!job) throw new BadRequestException('Job not found');

    const authorProfile = await (this.prisma as any).clientProfile.findUnique({ where: { userId } });

    return (this.prisma.review as any).create({
      data: {
        jobId: input.jobId,
        rating: input.rating,
        comment: input.comment,
        authorId: authorProfile.id,
        targetId: job.workerId,
      },
    });
  }

  // ------------------------------------------
  // SUBSCRIPTIONS
  // ------------------------------------------

  @Subscription(() => Job, {
    name: 'jobUpdated',
    resolve: (payload) => payload.jobUpdated,
  })
  jobUpdated(@Args('jobId') jobId: string) {
    return this.pubSub.asyncIterator(`JOB_UPDATE_${jobId}`);
  }
}