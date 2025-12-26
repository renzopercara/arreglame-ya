
import { Module } from '@nestjs/common';
import { WorkerResolver } from './worker.resolver';
import { WorkerService } from './worker.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [WorkerResolver, WorkerService, PrismaService],
  exports: [WorkerService],
})
export class WorkerModule {}
