/**
 * Payment Controller - REST API Endpoints
 * 
 * Endpoints:
 * - POST /api/payments/create - Create new payment
 * - GET /api/payments/:id - Get payment details
 * - GET /api/payments/user/:userId - Get user payment history
 * - POST /api/payments/:id/refund - Refund a payment
 * 
 * Security: All endpoints require JWT authentication
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PaymentService } from './payment.service';
import { DebtManagementService } from './debt-management.service';
import { PaymentMethod } from '@prisma/client';

// DTOs
class CreatePaymentDto {
  professionalId?: string;
  serviceRequestId?: string;
  paymentMethod: 'MP' | 'CASH';
  totalAmount: number; // In centavos
  externalReference?: string;
}

class RefundPaymentDto {
  reason: string;
}

@Controller('api/payments')
@UseGuards(AuthGuard)
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private paymentService: PaymentService,
    private debtManagementService: DebtManagementService,
  ) {}

  /**
   * Create a new payment
   * POST /api/payments/create
   */
  @Post('create')
  async createPayment(@Request() req, @Body() dto: CreatePaymentDto) {
    const userId = req.user.userId;

    // Validate amount
    if (dto.totalAmount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Validate payment method
    if (!['MP', 'CASH'].includes(dto.paymentMethod)) {
      throw new BadRequestException('Invalid payment method');
    }

    this.logger.log(
      `Creating payment: User ${userId} | Method: ${dto.paymentMethod} | Amount: ${dto.totalAmount}`,
    );

    const result = await this.paymentService.createPayment({
      userId,
      professionalId: dto.professionalId,
      serviceRequestId: dto.serviceRequestId,
      paymentMethod: dto.paymentMethod as PaymentMethod,
      totalAmount: dto.totalAmount,
      externalReference: dto.externalReference,
    });

    return {
      success: true,
      transaction: {
        id: result.transaction.id,
        status: result.transaction.status,
        amount: result.transaction.amountTotal,
        externalReference: result.transaction.externalReference,
        paymentMethod: result.transaction.paymentMethod,
      },
      snapshot: {
        platformFee: result.snapshot.platformAmount,
        professionalNet: result.snapshot.professionalAmount,
      },
      paymentData: result.paymentData, // For MP: { preferenceId, initPoint }
    };
  }

  /**
   * Get payment details by external reference
   * GET /api/payments/:reference
   */
  @Get(':reference')
  async getPayment(@Request() req, @Param('reference') reference: string) {
    const transaction = await this.paymentService.getTransactionByReference(
      reference,
    );

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    // Check authorization: user must be involved in transaction
    const userId = req.user.userId;
    if (
      transaction.userId !== userId &&
      transaction.professionalId !== userId
    ) {
      throw new BadRequestException('Unauthorized');
    }

    return {
      success: true,
      transaction: {
        id: transaction.id,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        amount: transaction.amountTotal,
        externalReference: transaction.externalReference,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
      snapshot: transaction.snapshot,
      ledger: transaction.ledgerEntries,
    };
  }

  /**
   * Get user payment history
   * GET /api/payments/user/history
   */
  @Get('user/history')
  async getUserPayments(@Request() req) {
    const userId = req.user.userId;
    const transactions = await this.paymentService.getUserTransactions(
      userId,
      50,
    );

    return {
      success: true,
      count: transactions.length,
      transactions: transactions.map((t) => ({
        id: t.id,
        status: t.status,
        paymentMethod: t.paymentMethod,
        amount: t.amountTotal,
        externalReference: t.externalReference,
        platformFee: t.snapshot?.platformAmount,
        professionalNet: t.snapshot?.professionalAmount,
        createdAt: t.createdAt,
      })),
    };
  }

  /**
   * Refund a payment
   * POST /api/payments/:id/refund
   */
  @Post(':id/refund')
  async refundPayment(
    @Request() req,
    @Param('id') transactionId: string,
    @Body() dto: RefundPaymentDto,
  ) {
    // TODO: Add authorization check (only admin or service owner)

    this.logger.log(
      `Refunding payment: ${transactionId} | Reason: ${dto.reason}`,
    );

    await this.paymentService.refundPayment(transactionId, dto.reason);

    return {
      success: true,
      message: 'Payment refunded successfully',
    };
  }

  /**
   * Get debt status
   * GET /api/payments/debt/status
   */
  @Get('debt/status')
  async getDebtStatus(@Request() req) {
    const userId = req.user.userId;
    const status = await this.debtManagementService.getDebtStatus(userId);

    return {
      success: true,
      debt: status,
    };
  }

  /**
   * Generate debt payment link
   * POST /api/payments/debt/pay
   */
  @Post('debt/pay')
  async generateDebtPaymentLink(@Request() req) {
    const userId = req.user.userId;

    this.logger.log(`Generating debt payment link for user ${userId}`);

    const result = await this.debtManagementService.generateDebtPaymentLink(
      userId,
    );

    return {
      success: true,
      paymentLink: result,
    };
  }
}
