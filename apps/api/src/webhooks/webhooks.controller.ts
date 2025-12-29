import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { WebhookService } from '../billing/webhook.service';

/**
 * Webhooks Controller
 * Entry point for incoming payment gateway notifications
 * Handles: Mercado Pago payment status updates, webhook verification
 */
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private webhookService: WebhookService) {}

  /**
   * Handle Mercado Pago webhook notifications
   * Endpoint: POST /webhooks/mercadopago
   *
   * Returns 200 OK regardless of processing result to prevent Mercado Pago retries
   * Processing errors are logged for manual review
   */
  @Post('mercadopago')
  @HttpCode(HttpStatus.OK)
  async handleMercadoPagoWebhook(@Body() body: any) {
    this.logger.log(`📩 Mercado Pago webhook received: ${body.type}`);

    try {
      await this.webhookService.processMercadoPagoWebhook(body);
      return { status: 'ok', message: 'Webhook processed successfully' };
    } catch (error) {
      // Log the error but return 200 to prevent MP retries
      this.logger.error('❌ Webhook processing failed:', error);
      // We still return 200 because the webhook will be retried and logged
      return { status: 'processed', message: 'Webhook queued for processing' };
    }
  }

  /**
   * Health check endpoint for webhook system
   * Endpoint: GET /webhooks/health
   */
  @Post('health')
  @HttpCode(HttpStatus.OK)
  async health() {
    return { status: 'ok', service: 'webhooks' };
  }
}
