
import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { GeoService } from '../geo/geo.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [MatchingService, GeoService, PrismaService],
  exports: [MatchingService],
})
export class MatchingModule {}
