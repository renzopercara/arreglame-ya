
import { Module } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { ReputationResolver } from './reputation.resolver';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [ReputationService, ReputationResolver, PrismaService],
  exports: [ReputationService],
})
export class ReputationModule {}
