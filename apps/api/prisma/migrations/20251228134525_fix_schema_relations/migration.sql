/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE INDEX "ServiceRequest_paymentStatus_idx" ON "ServiceRequest"("paymentStatus");

-- CreateIndex
CREATE INDEX "ServiceRequest_paidAt_idx" ON "ServiceRequest"("paidAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_clientId_paymentStatus_idx" ON "ServiceRequest"("clientId", "paymentStatus");

-- CreateIndex
CREATE INDEX "ServiceRequest_workerId_paymentStatus_idx" ON "ServiceRequest"("workerId", "paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_idempotencyKey_key" ON "Transaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Transaction_referenceId_idx" ON "Transaction"("referenceId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_walletId_status_createdAt_idx" ON "Transaction"("walletId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Wallet_updatedAt_idx" ON "Wallet"("updatedAt");
