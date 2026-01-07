
import { Module, Global } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Custom Config Module - Loads application-specific config from DB
 * Separate from @nestjs/config which handles environment variables
 * Exports AppConfigService for all modules that need plan/reputation/system settings
 */
@Global()
@Module({
  providers: [AppConfigService, PrismaService],
  exports: [AppConfigService],
})
export class ConfigModule {}
