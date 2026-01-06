import { Module } from '@nestjs/common';
import { ServiceCategoriesService } from './service-categories.service';
import { ServiceCategoriesResolver } from './service-categories.resolver';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ServiceCategoriesModule
 * Module for service categories management
 */
@Module({
  providers: [
    ServiceCategoriesService,
    ServiceCategoriesResolver,
    PrismaService,
  ],
  exports: [ServiceCategoriesService],
})
export class ServiceCategoriesModule {}
