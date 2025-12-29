
import { Module } from '@nestjs/common';
import { JobsResolver } from './jobs.resolver';
import { AiVisionService } from '../ai/ai.service';
import { BillingModule } from '../billing/billing.module';
import { GeoService } from '../geo/geo.service';
import { MatchingService } from '../matching/matching.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigModule } from '../config/config.module';
import { ReputationModule } from '../reputation/reputation.module';
import { ContentSecurityService } from '../security/content-security.service';
import { PubSubModule } from '../common/pubsub.module';

@Module({
  imports: [ConfigModule, ReputationModule, PubSubModule, BillingModule],
  providers: [
    JobsResolver,
    AiVisionService,
    GeoService,
    MatchingService,
    PrismaService,
    ContentSecurityService
  ],
})
export class JobsModule {}
