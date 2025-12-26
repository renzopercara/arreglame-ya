
import { Module } from '@nestjs/common';
import { LegalService } from './legal.service';
import { LegalResolver } from './legal.resolver';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [LegalService, LegalResolver, PrismaService],
  exports: [LegalService]
})
export class LegalModule {}
