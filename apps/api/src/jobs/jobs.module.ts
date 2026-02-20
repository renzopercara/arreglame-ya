import { Module } from '@nestjs/common';
import { JobsResolver } from './jobs.resolver';
import { ServiceRequestResolver } from './service-request.resolver';
import { AiVisionService } from '../ai/ai.service';
import { BillingModule } from '../billing/billing.module';
import { GeoService } from '../geo/geo.service';
import { MatchingService } from '../matching/matching.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigModule } from '../config/config.module';
import { ReputationModule } from '../reputation/reputation.module';
import { ContentSecurityService } from '../security/content-security.service';
import { PubSubModule } from '../common/pubsub.module';
import { PricingEngine } from './application/pricing/pricing-engine';
import { LawnMowingPricingStrategy } from './application/pricing/strategies/lawn-mowing.strategy';
import { CreateServiceRequestUseCase } from './application/services/create-service-request.use-case';
import { IncrementServicePriceUseCase } from './application/services/increment-service-price.use-case';

@Module({
  imports: [ConfigModule, ReputationModule, PubSubModule, BillingModule],
  providers: [
    JobsResolver,
    ServiceRequestResolver,
    AiVisionService,
    GeoService,
    MatchingService,
    PrismaService,
    ContentSecurityService,
    LawnMowingPricingStrategy,
    PricingEngine,
    CreateServiceRequestUseCase,
    IncrementServicePriceUseCase,
  ],
})
export class JobsModule {}
