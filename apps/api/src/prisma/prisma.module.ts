import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global Prisma Module
 * Makes PrismaService available to all modules without explicit imports
 * Essential for monorepo architecture with multiple dependent modules
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
