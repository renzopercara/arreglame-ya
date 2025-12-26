/*
  Warnings:

  - The values [PENDING,EN_ROUTE,STARTED] on the enum `JobStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [RELEASED,REFUNDED] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [CALL_OUT,SERVICE,MATERIALS,COMMISSION] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `materialPrice` on the `ServiceRequest` table. All the data in the column will be lost.
  - You are about to drop the column `servicePrice` on the `ServiceRequest` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `ServiceRequest` table. All the data in the column will be lost.
  - You are about to drop the column `mercadoPagoId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `stripeId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `WorkerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRate` on the `WorkerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `verified` on the `WorkerProfile` table. All the data in the column will be lost.
  - You are about to drop the `LoyaltyPoints` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `contentHash` to the `LegalDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `LegalDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cbuAlias` to the `PayoutRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedHours` to the `ServiceRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gardenImageBefore` to the `ServiceRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `ServiceRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `squareMeters` to the `ServiceRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `SupportTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priority` to the `SupportTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SupportTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contentHash` to the `UserConsent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `version` to the `UserConsent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `WorkerProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JobStatus_new" AS ENUM ('CREATED', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_CLIENT_APPROVAL', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'UNDER_REVIEW', 'RESOLVED');
ALTER TABLE "ServiceRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ServiceRequest" ALTER COLUMN "status" TYPE "JobStatus_new" USING ("status"::text::"JobStatus_new");
ALTER TYPE "JobStatus" RENAME TO "JobStatus_old";
ALTER TYPE "JobStatus_new" RENAME TO "JobStatus";
DROP TYPE "JobStatus_old";
ALTER TABLE "ServiceRequest" ALTER COLUMN "status" SET DEFAULT 'CREATED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionStatus_new" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'FAILED');
ALTER TABLE "Transaction" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Transaction" ALTER COLUMN "status" TYPE "TransactionStatus_new" USING ("status"::text::"TransactionStatus_new");
ALTER TYPE "TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "TransactionStatus_old";
ALTER TABLE "Transaction" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('ESCROW_ALLOCATION', 'ESCROW_RELEASE', 'WITHDRAWAL', 'REFUND', 'PAYOUT', 'DISPUTE_REFUND');
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "LoyaltyPoints" DROP CONSTRAINT "LoyaltyPoints_userId_fkey";

-- DropIndex
DROP INDEX "WorkerProfile_location_idx";

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "senderRole" TEXT;

-- AlterTable
ALTER TABLE "ClientProfile" ADD COLUMN     "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reputationPoints" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "aiAuditScore" DOUBLE PRECISION,
ADD COLUMN     "resolutionComment" TEXT;

-- AlterTable
ALTER TABLE "LegalDocument" ADD COLUMN     "contentHash" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PayoutRequest" ADD COLUMN     "cbuAlias" TEXT NOT NULL,
ADD COLUMN     "processedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ServiceRequest" DROP COLUMN "materialPrice",
DROP COLUMN "servicePrice",
DROP COLUMN "totalPrice",
ADD COLUMN     "aiReasoning" TEXT,
ADD COLUMN     "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "estimatedHours" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "evidenceImages" TEXT[],
ADD COLUMN     "extraTimeMinutes" INTEGER,
ADD COLUMN     "extraTimeReason" TEXT,
ADD COLUMN     "gardenImageAfter" TEXT,
ADD COLUMN     "gardenImageBefore" TEXT NOT NULL,
ADD COLUMN     "price" JSONB NOT NULL,
ADD COLUMN     "pricePlatformFee" DOUBLE PRECISION,
ADD COLUMN     "priceWorkerNet" DOUBLE PRECISION,
ADD COLUMN     "squareMeters" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "warrantyExpiresAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'CREATED';

-- AlterTable
ALTER TABLE "SupportTicket" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "priority" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "mercadoPagoId",
DROP COLUMN "stripeId",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "referenceId" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "User" DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "password",
DROP COLUMN "phone",
DROP COLUMN "rating",
ADD COLUMN     "passwordHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserConsent" ADD COLUMN     "contentHash" TEXT NOT NULL,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT,
ADD COLUMN     "version" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WorkerProfile" DROP COLUMN "category",
DROP COLUMN "hourlyRate",
DROP COLUMN "verified",
ADD COLUMN     "acceptanceRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "cancellationRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "dniBack" TEXT,
ADD COLUMN     "dniFront" TEXT,
ADD COLUMN     "insuranceDoc" TEXT,
ADD COLUMN     "kycStatus" "KYCStatus" NOT NULL DEFAULT 'PENDING_SUBMISSION',
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "penaltyUntil" TIMESTAMP(3),
ADD COLUMN     "selfie" TEXT;

-- DropTable
DROP TABLE "LoyaltyPoints";

-- CreateTable
CREATE TABLE "PlanConfig" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "targetAudience" "TargetAudience" NOT NULL,
    "name" TEXT NOT NULL,
    "minPoints" INTEGER NOT NULL DEFAULT 0,
    "commissionFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "priorityBonus" INTEGER NOT NULL DEFAULT 0,
    "benefits" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReputationRule" (
    "id" TEXT NOT NULL,
    "actionKey" TEXT NOT NULL,
    "pointsDelta" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STRING',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanConfig_code_key" ON "PlanConfig"("code");

-- CreateIndex
CREATE INDEX "PlanConfig_code_idx" ON "PlanConfig"("code");

-- CreateIndex
CREATE INDEX "PlanConfig_targetAudience_idx" ON "PlanConfig"("targetAudience");

-- CreateIndex
CREATE UNIQUE INDEX "ReputationRule_actionKey_key" ON "ReputationRule"("actionKey");

-- CreateIndex
CREATE INDEX "ReputationRule_actionKey_idx" ON "ReputationRule"("actionKey");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSetting_key_idx" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "ChatMessage_jobId_idx" ON "ChatMessage"("jobId");

-- CreateIndex
CREATE INDEX "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");

-- CreateIndex
CREATE INDEX "ChatMessage_timestamp_idx" ON "ChatMessage"("timestamp");

-- CreateIndex
CREATE INDEX "ClientProfile_currentPlan_idx" ON "ClientProfile"("currentPlan");

-- CreateIndex
CREATE INDEX "Dispute_createdAt_idx" ON "Dispute"("createdAt");

-- CreateIndex
CREATE INDEX "LegalDocument_targetAudience_idx" ON "LegalDocument"("targetAudience");

-- CreateIndex
CREATE INDEX "LegalDocument_version_idx" ON "LegalDocument"("version");

-- CreateIndex
CREATE INDEX "PayoutRequest_walletId_idx" ON "PayoutRequest"("walletId");

-- CreateIndex
CREATE INDEX "PayoutRequest_userId_idx" ON "PayoutRequest"("userId");

-- CreateIndex
CREATE INDEX "PayoutRequest_status_idx" ON "PayoutRequest"("status");

-- CreateIndex
CREATE INDEX "Review_authorId_idx" ON "Review"("authorId");

-- CreateIndex
CREATE INDEX "Review_targetId_idx" ON "Review"("targetId");

-- CreateIndex
CREATE INDEX "ServiceRequest_createdAt_idx" ON "ServiceRequest"("createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_jobId_idx" ON "SupportTicket"("jobId");

-- CreateIndex
CREATE INDEX "SupportTicket_reporterId_idx" ON "SupportTicket"("reporterId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "UserConsent_userId_idx" ON "UserConsent"("userId");

-- CreateIndex
CREATE INDEX "UserConsent_documentId_idx" ON "UserConsent"("documentId");

-- CreateIndex
CREATE INDEX "UserConsent_acceptedAt_idx" ON "UserConsent"("acceptedAt");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "WorkerProfile_currentPlan_idx" ON "WorkerProfile"("currentPlan");

-- CreateIndex
CREATE INDEX "WorkerProfile_location_idx" ON "WorkerProfile"("location");
