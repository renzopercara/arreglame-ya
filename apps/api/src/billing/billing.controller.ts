import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { MercadoPagoWebhookDto } from './billing.dto';
import { MercadoPagoService } from './mercadopago.service';

@Controller('billing')
export class BillingController {
  constructor(private mercadoPagoService: MercadoPagoService) {}

  @Post('webhook')
  @HttpCode(200) // Siempre responder 200 a Mercado Pago
  async handleWebhook(@Body() webhookData: MercadoPagoWebhookDto) {
    try {
      await this.mercadoPagoService.handleWebhookNotification(webhookData);
      return { received: true };
    } catch (error) {
      // No propagamos errores a Mercado Pago para evitar reintentos innecesarios
      return { received: true, error: 'logged' };
    }
  }
}