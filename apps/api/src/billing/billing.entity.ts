/**
 * Billing Service Entity
 * Type definitions for billing operations and transaction history
 */

export interface BillingEntity {
  id: string;
  serviceRequestId: string;
  workerId: string;
  clientId: string;
  transactionId: string;
  totalAmount: number;
  workerNetAmount: number;
  platformFee: number;
  taxAmount: number;
  paymentGatewayFee: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'MERCADOPAGO' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER';
  currency: 'ARS' | 'USD';
  timestamp: Date;
  completedAt?: Date;
  refundedAt?: Date;
  failureReason?: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

export interface TransactionHistory {
  id: string;
  walletId: string;
  type: 'ESCROW_ALLOCATION' | 'ESCROW_RELEASE' | 'PAYMENT_RECEIVED' | 'PAYMENT_FAILED' | 'WITHDRAWAL' | 'REFUND' | 'PAYOUT';
  amount: number;
  balance: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description: string;
  referenceId?: string; // Payment gateway transaction ID
  createdAt: Date;
  completedAt?: Date;
}

export interface WalletBalance {
  userId: string;
  balancePending: number;
  balanceAvailable: number;
  totalBalance: number;
  currency: string;
  lastUpdated: Date;
}

export interface PaymentPreference {
  id: string;
  serviceRequestId: string;
  preferenceId: string; // Mercado Pago preference ID
  initPoint: string; // URL de checkout
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  expiresAt: Date;
  createdAt: Date;
}

export interface RefundRecord {
  id: string;
  originalPaymentId: string;
  serviceRequestId: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string; // Admin ID
}

export interface CommissionCalculation {
  totalAmount: number;
  paymentGatewayFeePercentage: number;
  paymentGatewayFee: number;
  amountAfterGateway: number;
  platformFeePercentage: number;
  platformFee: number;
  taxPercentage: number;
  taxAmount: number;
  workerNetAmount: number;
  workerNetPercentage: number;
  breakdown: string;
}

export interface PaymentAuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  operationType: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'REFUND';
  serviceRequestId: string;
  userId: string;
  amount?: number;
  status?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}
