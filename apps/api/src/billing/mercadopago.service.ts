import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { MercadoPagoConfig as MPConfig, Preference, Payment } from 'mercadopago';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from './billing.service';
import { MercadoPagoWebhookDto } from './billing.dto';

@Injectable()
export class MercadoPagoService implements OnModuleInit {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client: MPConfig | null = null;
  private preferenceClient: Preference | null = null;
  private paymentClient: Payment | null = null;

  constructor(
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
  ) {}

  async onModuleInit() {
    const accessToken =
      (await this.config.get<string>('MP_ACCESS_TOKEN')) ||
      (await this.config.get<string>('MERCADOPAGO_ACCESS_TOKEN'));

    if (!accessToken) {
      this.logger.warn('⚠️ MP_ACCESS_TOKEN no configurado; Mercado Pago deshabilitado');
      return;
    }

    this.client = new MPConfig({ accessToken });
    this.preferenceClient = new Preference(this.client);
    this.paymentClient = new Payment(this.client);
    this.logger.log('✅ Mercado Pago SDK v2 inicializado');
  }

  async createPreference(
    serviceRequestId: string,
    amount: number,
    userId?: string,
  ): Promise<{ preferenceId: string; initPoint: string }> {
    this.ensureSdkReady();

    const serviceRequest = await this.prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      include: { client: { include: { user: true } }, worker: true },
    });

    if (!serviceRequest) {
      throw new BadRequestException('Service request not found');
    }

    if (userId && serviceRequest.client.userId !== userId) {
      throw new BadRequestException('Unauthorized to create payment for this service');
    }

    const amountToCharge = Number.isFinite(amount) ? amount : Number((serviceRequest as any)?.price?.total ?? 0);
    const safeAmount = Math.max(0, amountToCharge);
    const notificationUrl = `${await this.config.get<string>('API_URL')}/billing/webhook`;
    const frontUrl =
      (await this.config.get<string>('FRONT_URL')) ||
      (await this.config.get<string>('FRONTEND_URL'));

    const preferencePayload = {
      items: [
        {
          id: serviceRequestId,
          title: serviceRequest.description || 'Servicio',
          quantity: 1,
          unit_price: safeAmount,
          currency_id: 'ARS',
          description: serviceRequest.description || 'Servicio',
        },
      ],
      payer: {
        name: serviceRequest.client.user.email?.split('@')[0],
        email: serviceRequest.client.user.email,
      },
      back_urls: frontUrl
        ? {
            success: `${frontUrl}/services/${serviceRequestId}?status=success`,
            failure: `${frontUrl}/services/${serviceRequestId}?status=failure`,
            pending: `${frontUrl}/services/${serviceRequestId}?status=pending`,
          }
        : undefined,
      auto_return: 'approved' as const,
      external_reference: serviceRequestId,
      metadata: {
        service_request_id: serviceRequestId,
        client_id: serviceRequest.clientId,
        worker_id: serviceRequest.workerId || null,
      },
      notification_url: notificationUrl,
    };

    try {
      const preference = await this.preferenceClient!.create({ body: preferencePayload });
      const preferenceId = (preference as any)?.id ?? (preference as any)?.body?.id;
      const initPoint = (preference as any)?.init_point ?? (preference as any)?.body?.init_point;

      if (!preferenceId || !initPoint) {
        throw new Error('Invalid preference response from Mercado Pago');
      }

      this.logger.log(`✅ Preference creada: ${preferenceId} para servicio ${serviceRequestId}`);

      return {
        preferenceId,
        initPoint,
      };
    } catch (error) {
      this.logger.error('❌ Error creando preferencia en Mercado Pago', error);
      throw new BadRequestException('Failed to create payment preference');
    }
  }

  async handleWebhookNotification(webhook: MercadoPagoWebhookDto) {
    if (webhook.type !== 'payment') {
      this.logger.debug(`Webhook ignorado por tipo ${webhook.type}`);
      return;
    }

    this.ensureSdkReady();
    const paymentId = webhook.data?.id;

    if (!paymentId) {
      this.logger.warn('Webhook de MP sin payment id');
      return;
    }

    try {
      const payment = await this.paymentClient!.get({ id: paymentId });
      const paymentData: any = (payment as any)?.body ?? payment;
      const status = paymentData?.status;

      if (status !== 'approved') {
        this.logger.log(`Payment ${paymentId} con estado ${status}, sin procesar fondos`);
        return;
      }

      const serviceRequestId =
        paymentData?.external_reference ||
        paymentData?.metadata?.service_request_id ||
        webhook.data?.external_reference;

      if (!serviceRequestId) {
        this.logger.error('Webhook aprobado sin external_reference');
        return;
      }

      const amount = Number(
        paymentData?.transaction_amount ?? webhook.data?.transaction_amount ?? 0,
      );

      await this.billingService.processPaymentIn(
        serviceRequestId,
        String(paymentData?.id ?? paymentId),
        amount,
        String(paymentData?.id ?? paymentId),
      );

      this.logger.log(
        `✅ Pago ${paymentId} aprobado y procesado para servicio ${serviceRequestId}`,
      );
    } catch (error) {
      this.logger.error('❌ Error procesando webhook de Mercado Pago', error);
    }
  }

  async hasPaymentMethod(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mercadopagoCustomerId: true },
    });

    return !!user?.mercadopagoCustomerId;
  }

  async isMercadoPagoConnected(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mercadopagoAccessToken: true },
    });

    return !!user?.mercadopagoAccessToken;
  }

  async saveCustomerId(userId: string, customerId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { mercadopagoCustomerId: customerId },
    });

    this.logger.log(`✅ Saved MP customer ID for user ${userId}`);
  }

  async saveAccessToken(userId: string, accessToken: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { mercadopagoAccessToken: accessToken },
    });

    this.logger.log(`✅ Saved MP access token for user ${userId}`);
  }

  private ensureSdkReady() {
    if (!this.client || !this.preferenceClient || !this.paymentClient) {
      throw new BadRequestException('Mercado Pago SDK not configured');
    }
  }
}
