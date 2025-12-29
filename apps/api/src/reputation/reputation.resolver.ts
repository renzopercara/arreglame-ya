import { Resolver, Query, Args, ObjectType, Field, Int } from '@nestjs/graphql';
import { ReputationService } from './reputation.service';

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
  constructor(private readonly reputationService: ReputationService) {}

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
    // TODO: Integrar con ReputationService para obtener datos reales
    return {
      points: 100,
      currentPlan: 'BRONZE',
      nextMilestone: 500,
    };
  }
}
