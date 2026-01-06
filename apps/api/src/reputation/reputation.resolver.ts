import { Resolver, Query, Args, ObjectType, Field, Int } from '@nestjs/graphql';
import { ReputationService } from './reputation.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

// ============================================
// OBJECT TYPES (GraphQL Code First)
// ============================================

@ObjectType()
class ReputationInfo {
  @Field(() => Int)
  points!: number;

  @Field()
  currentPlan!: string;

  @Field(() => Int)
  nextMilestone!: number;
}

// ============================================
// RESOLVER
// ============================================

@Resolver()
export class ReputationResolver {
  constructor(
    private readonly reputationService: ReputationService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Health check para el sistema de reputación
   * Retorna: String indicando el estado del sistema
   */
  @Query(() => String)
  async healthCheckReputation(): Promise<string> {
    return 'Reputation system is online';
  }

  /**
   * Obtiene información de reputación de un trabajador
   * @param workerId - ID del trabajador
   * @returns ReputationInfo con puntos, plan actual y próximo milestone
   */
  @Query(() => ReputationInfo)
  async getWorkerReputation(@Args('workerId') workerId: string): Promise<ReputationInfo> {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { id: workerId },
      select: {
        reputationPoints: true,
        currentPlan: true,
      },
    });

    if (!worker) {
      throw new NotFoundException(`Worker with ID ${workerId} not found`);
    }

    // Get next milestone from PlanConfig
    const plans = await this.prisma.planConfig.findMany({
      where: {
        targetAudience: 'WORKER',
        isActive: true,
        minPoints: { gt: worker.reputationPoints },
      },
      orderBy: { minPoints: 'asc' },
      take: 1,
    });

    const nextMilestone = plans.length > 0 ? plans[0].minPoints : worker.reputationPoints;

    return {
      points: worker.reputationPoints,
      currentPlan: worker.currentPlan,
      nextMilestone,
    };
  }
}
