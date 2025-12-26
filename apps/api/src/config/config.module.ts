
import { Module, Global } from '@nestjs/common';
import { ConfigService } from './config.service';
import { PrismaService } from '../prisma/prisma.service';

@Global()
@Module({
  providers: [ConfigService, PrismaService],
  exports: [ConfigService],
})
export class ConfigModule {}
