-- Financial Core System Migration
-- Implements double-entry ledger, transaction snapshots, and debt management

-- Add new enum values to existing enums
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'AUTHORIZED';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

-- Create new enums
CREATE TYPE "PaymentMethod" AS ENUM ('MP', 'CASH');
CREATE TYPE "PaymentProvider" AS ENUM ('MERCADOPAGO');

-- Update Wallet table with new fields for debt management
ALTER TABLE "Wallet" ADD COLUMN "currentBalance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Wallet" ADD COLUMN "debtLimit" INTEGER NOT NULL DEFAULT -50000;
ALTER TABLE "Wallet" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- Create index on wallet status
CREATE INDEX "Wallet_status_idx" ON "Wallet"("status");

-- Create payment_transactions table (main transaction record)
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "professionalId" TEXT,
    "walletId" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "amountTotal" INTEGER NOT NULL,
    "externalReference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- Create unique index on external reference for idempotency
CREATE UNIQUE INDEX "payment_transactions_externalReference_key" ON "payment_transactions"("externalReference");

-- Create indexes for payment_transactions
CREATE INDEX "payment_transactions_userId_idx" ON "payment_transactions"("userId");
CREATE INDEX "payment_transactions_professionalId_idx" ON "payment_transactions"("professionalId");
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");
CREATE INDEX "payment_transactions_externalReference_idx" ON "payment_transactions"("externalReference");
CREATE INDEX "payment_transactions_createdAt_idx" ON "payment_transactions"("createdAt");

-- Create transaction_snapshots table (immutable commission snapshots)
CREATE TABLE "transaction_snapshots" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "platformFeePercent" INTEGER NOT NULL,
    "serviceTaxPercent" INTEGER NOT NULL,
    "platformAmount" INTEGER NOT NULL,
    "professionalAmount" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_snapshots_pkey" PRIMARY KEY ("id")
);

-- Create unique index on transactionId (one snapshot per transaction)
CREATE UNIQUE INDEX "transaction_snapshots_transactionId_key" ON "transaction_snapshots"("transactionId");

-- Create index for transaction_snapshots
CREATE INDEX "transaction_snapshots_transactionId_idx" ON "transaction_snapshots"("transactionId");

-- Create ledger_entries table (double-entry bookkeeping)
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "transactionId" TEXT,
    "walletId" TEXT,
    "debit" INTEGER NOT NULL DEFAULT 0,
    "credit" INTEGER NOT NULL DEFAULT 0,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- Create indexes for ledger_entries
CREATE INDEX "ledger_entries_accountId_idx" ON "ledger_entries"("accountId");
CREATE INDEX "ledger_entries_transactionId_idx" ON "ledger_entries"("transactionId");
CREATE INDEX "ledger_entries_walletId_idx" ON "ledger_entries"("walletId");
CREATE INDEX "ledger_entries_createdAt_idx" ON "ledger_entries"("createdAt");

-- Create payment_provider_logs table (audit trail)
CREATE TABLE "payment_provider_logs" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_provider_logs_pkey" PRIMARY KEY ("id")
);

-- Create unique index on eventId for idempotency
CREATE UNIQUE INDEX "payment_provider_logs_eventId_key" ON "payment_provider_logs"("eventId");

-- Create indexes for payment_provider_logs
CREATE INDEX "payment_provider_logs_eventId_idx" ON "payment_provider_logs"("eventId");
CREATE INDEX "payment_provider_logs_transactionId_idx" ON "payment_provider_logs"("transactionId");
CREATE INDEX "payment_provider_logs_processedAt_idx" ON "payment_provider_logs"("processedAt");

-- Add foreign key constraints
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "transaction_snapshots" ADD CONSTRAINT "transaction_snapshots_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "payment_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_provider_logs" ADD CONSTRAINT "payment_provider_logs_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
