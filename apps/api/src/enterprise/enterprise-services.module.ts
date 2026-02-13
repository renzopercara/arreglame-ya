import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

// Domain Policies
import { CancellationPolicy } from '../domain/policies/cancellation.policy';
import { CommissionPolicy } from '../domain/policies/commission.policy';
import { EstimationPolicy } from '../domain/policies/estimation.policy';

// Infrastructure - Pricing
import { GeminiPricingEngine } from '../infrastructure/pricing/gemini-pricing.service';
import { RuleBasedPricingEngine } from '../infrastructure/pricing/rule-based-pricing.service';
import { PricingService } from '../infrastructure/pricing/pricing.service';

// Infrastructure - Assignment
import { WorkerFinderService } from '../infrastructure/assignment/worker-finder.service';

// Infrastructure - Persistence
import { PrismaServiceRequestRepository } from '../infrastructure/persistence/prisma-service-request.repository';

// Application - Use Cases
import { CreateRequestUseCase } from '../application/use-cases/create-request.use-case';
import { AcceptRequestUseCase } from '../application/use-cases/accept-request.use-case';
import { StartWorkUseCase } from '../application/use-cases/start-work.use-case';
import { CompleteWorkUseCase } from '../application/use-cases/complete-work.use-case';
import { CancelRequestUseCase } from '../application/use-cases/cancel-request.use-case';

// Cron Jobs
import { WorkerAssignmentCron } from '../cron/worker-assignment.cron';
import { PayoutReleaseCron } from '../cron/payout-release.cron';

@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  providers: [
    PrismaService,
    {
      provide: CancellationPolicy,
      useFactory: () => new CancellationPolicy(24, 0.3, 0.5),
    },
    {
      provide: CommissionPolicy,
      useFactory: () => new CommissionPolicy(0.25, 0.0),
    },
    {
      provide: EstimationPolicy,
      useFactory: () => new EstimationPolicy(150, 2000, 'ARS'),
    },
    GeminiPricingEngine,
    RuleBasedPricingEngine,
    PricingService,
    WorkerFinderService,
    PrismaServiceRequestRepository,
    CreateRequestUseCase,
    AcceptRequestUseCase,
    StartWorkUseCase,
    CompleteWorkUseCase,
    CancelRequestUseCase,
    WorkerAssignmentCron,
    PayoutReleaseCron,
  ],
  exports: [
    CreateRequestUseCase,
    AcceptRequestUseCase,
    StartWorkUseCase,
    CompleteWorkUseCase,
    CancelRequestUseCase,
    PricingService,
    WorkerFinderService,
    PrismaServiceRequestRepository,
    CancellationPolicy,
    CommissionPolicy,
    EstimationPolicy,
  ],
})
export class EnterpriseServicesModule {}
