import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { BillingModule } from '../billing/billing.module';

/**
 * Webhooks Module
 * Handles incoming notifications from payment gateways (Mercado Pago)
 * Updates service status and manages fund releases
 *
 * Imports: BillingModule (exports WebhookService, PaymentService, etc.)
 */
@Module({
  imports: [BillingModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
