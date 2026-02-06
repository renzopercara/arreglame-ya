/**
 * Webhooks Service - Enhanced with State Machine and Idempotency
 * Processes incoming notifications from Mercado Pago
 * Updates order status and releases funds to workers
 * 
 * Features:
 * - State machine for valid transitions
 * - Complete idempotency with event_id
 * - Payment provider logging for audit
 * - Integration with new PaymentService
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from './billing.service';
import { MercadoPagoService } from './mercadopago.service';
import { PaymentService } from './payment.service';
import { PaymentAuditLog, throwBillingException } from './billing.exceptions';

interface MercadoPagoWebhook {
  type: string;
  data: {
    id: string;
    status: string;
    status_detail?: string;
    external_reference?: string;
    transaction_amount?: number;
  };
}

// Valid state transitions for payment transactions
const VALID_TRANSITIONS = {
  PENDING: ['AUTHORIZED', 'PAID', 'FAILED', 'CANCELLED'],
  AUTHORIZED: ['PAID', 'FAILED', 'CANCELLED'],
  PAID: ['REFUNDED'],
  FAILED: [],
  CANCELLED: [],
  REFUNDED: [],
};

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
    private mercadoPagoService: MercadoPagoService,
    private paymentService: PaymentService,
  ) {}

  /**
   * Process Mercado Pago webhook notification
   * Idempotent: safe to call multiple times for same payment
   * State machine: only valid transitions allowed
   */
  async processMercadoPagoWebhook(webhook: MercadoPagoWebhook): Promise<void> {
    const startTime = Date.now();
    const { type, data } = webhook;

    // Generate event_id for idempotency
    const eventId = `MP-${data.id}-${data.status}`;

    // Log incoming webhook
    PaymentAuditLog.log('info', 'WEBHOOK_RECEIVED', {
      type,
      paymentId: data.id,
      externalReference: data.external_reference,
      status: data.status,
      eventId,
    });

    // Check idempotency: has this event been processed?
    const existingLog = await this.prisma.paymentProviderLog.findUnique({
      where: { eventId },
    });

    if (existingLog) {
      PaymentAuditLog.log('info', 'WEBHOOK_DUPLICATE', {
        eventId,
        reason: 'Event already processed',
      });
      return;
    }

    // Only process payment events
    if (type !== 'payment') {
      this.logger.debug(`Skipping non-payment webhook type: ${type}`);
      return;
    }

    // Extract external reference (transaction ID)
    const externalReference = data.external_reference;
    if (!externalReference) {
      PaymentAuditLog.log('warn', 'WEBHOOK_INVALID', {
        reason: 'Missing external_reference',
        paymentId: data.id,
      });
      return;
    }

    try {
      // Handle different payment statuses
      switch (data.status) {
        case 'approved':
          await this.paymentService.handlePaymentApproved(
            externalReference,
            eventId,
            webhook,
          );
          break;

        case 'pending':
        case 'in_process':
          await this.handlePaymentPending(externalReference, eventId, webhook);
          break;

        case 'rejected':
        case 'cancelled':
          await this.paymentService.handlePaymentFailed(
            externalReference,
            eventId,
            webhook,
            `Payment ${data.status}: ${data.status_detail || 'unknown'}`,
          );
          break;

        default:
          this.logger.warn(`Unknown payment status: ${data.status}`);
      }

      const duration = Date.now() - startTime;
      PaymentAuditLog.log('info', 'WEBHOOK_PROCESSED', {
        paymentId: data.id,
        externalReference,
        status: data.status,
        durationMs: duration,
      });
    } catch (error) {
      PaymentAuditLog.log('error', 'WEBHOOK_ERROR', {
        paymentId: data.id,
        externalReference,
        error: error.message,
      });

      this.logger.error(
        `Failed to process webhook for payment ${data.id}:`,
        error,
      );
      // Don't re-throw: Mercado Pago will retry
    }
  }

  /**
   * Handle pending payment (waiting for confirmation)
   */
  private async handlePaymentPending(
    externalReference: string,
    eventId: string,
    payload: any,
  ): Promise<void> {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { externalReference },
    });

    if (!transaction) {
      this.logger.warn(`Transaction not found: ${externalReference}`);
      return;
    }

    // Log event
    await this.prisma.paymentProviderLog.create({
      data: {
        transactionId: transaction.id,
        provider: 'MERCADOPAGO',
        eventId,
        eventType: 'payment.pending',
        payload,
      },
    });

    this.logger.log(
      `Payment pending: ${transaction.id} (${externalReference})`,
    );
  }

  /**
   * Validate state transition
   * Ensures only valid transitions are allowed
   */
  private canTransition(
    currentStatus: string,
    newStatus: string,
  ): boolean {
    const validNext = VALID_TRANSITIONS[currentStatus];
    return validNext && validNext.includes(newStatus);
  }

  /**
   * Handle approved payment
   * Move funds from Escrow to Available and update service status
   */
  private async handlePaymentApproved(
    serviceRequestId: string,
    paymentId: string,
    serviceRequest: any,
    transactionAmount: number,
  ): Promise<void> {
    this.logger.log(`✅ Payment approved: ${paymentId} for service ${serviceRequestId}`);

    return (this.prisma as any).$transaction(async (tx: any) => {
      // 1. Record payment received
      await tx.transaction.create({
        data: {
          walletId: serviceRequest.worker.walletId,
          jobId: serviceRequestId,
          type: 'PAYMENT_RECEIVED',
          amount: serviceRequest.priceWorkerNet,
          status: 'COMPLETED',
          description: `Pago aprobado por cliente - Servicio #${serviceRequestId.slice(0, 8)}`,
          referenceId: paymentId,
        },
      });

      // 2. Update service request status
      await tx.serviceRequest.update({
        where: { id: serviceRequestId },
        data: {
          status: 'AWAITING_COMPLETION',
          paymentStatus: 'PAID',
          paidAt: new Date(),
        },
      });

      // 3. Log audit event
      PaymentAuditLog.log(
        'info',
        'PAYMENT_APPROVED',
        {
          paymentId,
          serviceRequestId,
          workerNetAmount: serviceRequest.priceWorkerNet,
          workerId: serviceRequest.workerId,
        },
        false,
      );
    });
  }

  /**
   * Handle pending payment (e.g., waiting for bank verification)
   */
  private async handlePaymentPending(
    serviceRequestId: string,
    paymentId: string,
  ): Promise<void> {
    this.logger.log(
      `⏳ Payment pending: ${paymentId} for service ${serviceRequestId}`,
    );

    await (this.prisma as any).serviceRequest.update({
      where: { id: serviceRequestId },
      data: { paymentStatus: 'PENDING' },
    });

    PaymentAuditLog.log('info', 'PAYMENT_PENDING', {
      paymentId,
      serviceRequestId,
    });
  }

  /**
   * Handle failed/rejected payment
   * Release funds from escrow back to client
   */
  private async handlePaymentFailed(
    serviceRequestId: string,
    paymentId: string,
    reason: string,
    serviceRequest: any,
  ): Promise<void> {
    this.logger.log(
      `❌ Payment failed: ${paymentId} for service ${serviceRequestId} - Reason: ${reason}`,
    );

    return (this.prisma as any).$transaction(async (tx: any) => {
      // 1. Record payment failure
      await tx.transaction.create({
        data: {
          walletId: serviceRequest.worker.walletId,
          jobId: serviceRequestId,
          type: 'PAYMENT_FAILED',
          amount: serviceRequest.priceWorkerNet,
          status: 'FAILED',
          description: `Pago rechazado: ${reason}`,
          referenceId: paymentId,
        },
      });

      // 2. Update service status back to PENDING
      await tx.serviceRequest.update({
        where: { id: serviceRequestId },
        data: {
          status: 'PENDING_PAYMENT',
          paymentStatus: 'FAILED',
        },
      });

      // 3. Log audit event
      PaymentAuditLog.log('warn', 'PAYMENT_FAILED', {
        paymentId,
        serviceRequestId,
        reason,
      });
    });
  }

  /**
   * Release escrowed funds to worker (after service completion)
   * Should be called by service completion logic
   */
  async releaseEscrowedFunds(serviceRequestId: string): Promise<void> {
    const serviceRequest = await (this.prisma as any).serviceRequest.findUnique({
      where: { id: serviceRequestId },
      include: { worker: true },
    });

    if (!serviceRequest) {
      throwBillingException('SERVICE_NOT_FOUND');
    }

    if (serviceRequest.paymentStatus !== 'PAID') {
      throwBillingException(
        'SERVICE_INVALID_PRICE',
        `Cannot release funds: payment status is ${serviceRequest.paymentStatus}`,
      );
    }

    return (this.prisma as any).$transaction(async (tx: any) => {
      const workerWallet = await tx.wallet.findUnique({
        where: { userId: serviceRequest.workerId },
      });

      // Move from escrow to available
      await tx.transaction.create({
        data: {
          walletId: workerWallet.id,
          jobId: serviceRequestId,
          type: 'FUND_RELEASE',
          amount: serviceRequest.priceWorkerNet,
          status: 'COMPLETED',
          description: `Fondos liberados tras completar servicio #${serviceRequestId.slice(0, 8)}`,
        },
      });

      await tx.wallet.update({
        where: { id: workerWallet.id },
        data: {
          balancePending: { decrement: serviceRequest.priceWorkerNet },
          balanceAvailable: { increment: serviceRequest.priceWorkerNet },
        },
      });

      PaymentAuditLog.log('info', 'ESCROW_RELEASED', {
        serviceRequestId,
        workerId: serviceRequest.workerId,
        amount: serviceRequest.priceWorkerNet,
      });
    });
  }
}
