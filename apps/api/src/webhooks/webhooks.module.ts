import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhookService } from '../billing/webhook.service';
import { BillingModule } from '../billing/billing.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '../config/config.module';

/**
 * Webhooks Module
 * Handles incoming notifications from payment gateways (Mercado Pago)
 * Updates service status and manages fund releases
 *
 * Imports: BillingModule (for commission & payment services)
 *          PrismaModule (for database access)
 *          ConfigModule (for environment variables)
 */
@Module({
  imports: [BillingModule, PrismaModule, ConfigModule],
  controllers: [WebhooksController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhooksModule {}
