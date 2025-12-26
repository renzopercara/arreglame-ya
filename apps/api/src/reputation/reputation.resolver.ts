import { Resolver, Query, Args } from '@nestjs/graphql';
import { ReputationService } from './reputation.service';

@Resolver('ReputationResponse')
export class ReputationResolver {
  constructor(private readonly reputationService: ReputationService) {}

  @Query('healthCheckReputation')
  async healthCheckReputation(): Promise<string> {
    return 'Reputation system is online';
  }

  @Query('getWorkerReputation')
  async getWorkerReputation(@Args('workerId') workerId: string) {
    return {
      points: 100,
      currentPlan: 'BRONZE',
      nextMilestone: 500,
    };
  }
}
