-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'WORKER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ANON', 'LOGGED_IN', 'BLOCKED', 'DEBTOR');

-- CreateEnum
CREATE TYPE "WorkerStatus" AS ENUM ('ONLINE', 'PAUSED', 'OFFLINE', 'ON_JOB');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('CREATED', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_CLIENT_APPROVAL', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'UNDER_REVIEW', 'RESOLVED', 'PENDING', 'ANALYZING', 'OFFERING', 'EXPIRED');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('PENDING_SUBMISSION', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExtraTimeStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TargetAudience" AS ENUM ('WORKER', 'CLIENT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ESCROW_ALLOCATION', 'ESCROW_RELEASE', 'WITHDRAWAL', 'REFUND', 'PAYOUT', 'DISPUTE_REFUND');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'FAILED', 'AUTHORIZED', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MP', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MERCADOPAGO');

-- CreateEnum
CREATE TYPE "ActiveRole" AS ENUM ('CLIENT', 'WORKER');

-- CreateEnum
CREATE TYPE "SpecialtyStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "ServiceCategoryEnum" AS ENUM ('MAINTENANCE', 'PAINTING', 'HVAC', 'ELECTRICAL', 'PLUMBING');

-- CreateEnum
CREATE TYPE "ServiceSubcategory" AS ENUM ('LAWN_MOWING', 'GARDEN_CLEANUP', 'TREE_TRIMMING', 'PRESSURE_WASHING', 'INTERIOR_PAINTING', 'EXTERIOR_PAINTING', 'WALL_REPAIR', 'AC_INSTALLATION', 'AC_REPAIR', 'AC_MAINTENANCE', 'HEATING_INSTALLATION', 'OUTLET_INSTALLATION', 'LIGHTING_INSTALLATION', 'CIRCUIT_BREAKER', 'WIRING_REPAIR', 'LEAK_REPAIR', 'PIPE_INSTALLATION', 'DRAIN_CLEANING', 'FAUCET_INSTALLATION');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roles" "UserRole"[],
    "currentRole" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "status" "UserStatus" NOT NULL DEFAULT 'LOGGED_IN',
    "activeRole" "ActiveRole" NOT NULL DEFAULT 'CLIENT',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "mercadopagoCustomerId" TEXT,
    "mercadopagoAccessToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "trade" TEXT,
    "hourlyRate" DOUBLE PRECISION,
    "availability" JSONB,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "totalJobs" INTEGER NOT NULL DEFAULT 0,
    "status" "WorkerStatus" NOT NULL DEFAULT 'OFFLINE',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "lastLocationUpdate" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "cityId" TEXT,
    "reputationPoints" INTEGER NOT NULL DEFAULT 0,
    "currentPlan" TEXT NOT NULL DEFAULT 'STARTER',
    "acceptanceRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "cancellationRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "penaltyUntil" TIMESTAMP(3),
    "kycStatus" "KYCStatus" NOT NULL DEFAULT 'PENDING_SUBMISSION',
    "isKycVerified" BOOLEAN NOT NULL DEFAULT false,
    "legalName" TEXT,
    "taxId" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "dniFront" TEXT,
    "dniBack" TEXT,
    "insuranceDoc" TEXT,
    "selfie" TEXT,
    "kycSubmittedAt" TIMESTAMP(3),
    "kycApprovedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "reputationPoints" INTEGER NOT NULL DEFAULT 0,
    "currentPlan" TEXT NOT NULL DEFAULT 'CLIENT_BASIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iconName" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "estimatedHours" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_specialties" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "status" "SpecialtyStatus" NOT NULL DEFAULT 'PENDING',
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_formulas" (
    "id" TEXT NOT NULL,
    "subcategory" "ServiceSubcategory" NOT NULL,
    "serviceCategoryId" TEXT,
    "baseTimeFormula" TEXT NOT NULL,
    "defaultMetadata" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_formulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DifficultyMultiplier" (
    "id" TEXT NOT NULL,
    "level" "DifficultyLevel" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DifficultyMultiplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtrasMultiplier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtrasMultiplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "subcategory" "ServiceSubcategory",
    "metadata" JSONB,
    "difficultyLevel" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "serviceCategoryId" TEXT,
    "clientId" TEXT NOT NULL,
    "workerId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "cityId" TEXT,
    "coverageRadius" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "description" TEXT,
    "squareMeters" DOUBLE PRECISION NOT NULL,
    "gardenImageBefore" TEXT NOT NULL,
    "gardenImageAfter" TEXT,
    "evidenceImages" TEXT[],
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "estimatedHours" DOUBLE PRECISION NOT NULL,
    "aiReasoning" TEXT,
    "price" JSONB NOT NULL,
    "priceWorkerNet" DECIMAL(10,2),
    "pricePlatformFee" DECIMAL(10,2),
    "totalAmount" DECIMAL(10,2),
    "workerPayout" DECIMAL(10,2),
    "platformCommission" DECIMAL(10,2),
    "pin" TEXT NOT NULL DEFAULT '0000',
    "verificationCode" TEXT,
    "extraTimeStatus" "ExtraTimeStatus" NOT NULL DEFAULT 'NONE',
    "extraTimeMinutes" INTEGER,
    "extraTimeReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "assignmentAttempts" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "workerTimeoutAt" TIMESTAMP(3),
    "disputeDeadlineAt" TIMESTAMP(3),
    "payoutReleasedAt" TIMESTAMP(3),
    "warrantyExpiresAt" TIMESTAMP(3),

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "resolution" TEXT,
    "resolutionComment" TEXT,
    "aiAuditScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balancePending" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balanceAvailable" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currentBalance" INTEGER NOT NULL DEFAULT 0,
    "debtLimit" INTEGER NOT NULL DEFAULT -50000,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "jobId" TEXT,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "referenceId" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutRequest" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "cbuAlias" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "senderRole" TEXT,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "categoryId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "authorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL,
    "targetAudience" "TargetAudience" NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STRING',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_activeRole_idx" ON "User"("activeRole");

-- CreateIndex
CREATE INDEX "User_currentRole_idx" ON "User"("currentRole");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerProfile_userId_key" ON "WorkerProfile"("userId");

-- CreateIndex
CREATE INDEX "WorkerProfile_userId_idx" ON "WorkerProfile"("userId");

-- CreateIndex
CREATE INDEX "WorkerProfile_status_idx" ON "WorkerProfile"("status");

-- CreateIndex
CREATE INDEX "WorkerProfile_currentPlan_idx" ON "WorkerProfile"("currentPlan");

-- CreateIndex
CREATE INDEX "WorkerProfile_cityId_idx" ON "WorkerProfile"("cityId");

-- CreateIndex
CREATE INDEX "WorkerProfile_lastActiveAt_idx" ON "WorkerProfile"("lastActiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClientProfile_userId_key" ON "ClientProfile"("userId");

-- CreateIndex
CREATE INDEX "ClientProfile_userId_idx" ON "ClientProfile"("userId");

-- CreateIndex
CREATE INDEX "ClientProfile_currentPlan_idx" ON "ClientProfile"("currentPlan");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_userId_key" ON "CustomerProfile"("userId");

-- CreateIndex
CREATE INDEX "CustomerProfile_userId_idx" ON "CustomerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_slug_key" ON "service_categories"("slug");

-- CreateIndex
CREATE INDEX "service_categories_slug_idx" ON "service_categories"("slug");

-- CreateIndex
CREATE INDEX "service_categories_active_idx" ON "service_categories"("active");

-- CreateIndex
CREATE INDEX "worker_specialties_workerId_idx" ON "worker_specialties"("workerId");

-- CreateIndex
CREATE INDEX "worker_specialties_categoryId_idx" ON "worker_specialties"("categoryId");

-- CreateIndex
CREATE INDEX "worker_specialties_status_idx" ON "worker_specialties"("status");

-- CreateIndex
CREATE UNIQUE INDEX "worker_specialties_workerId_categoryId_key" ON "worker_specialties"("workerId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "service_formulas_subcategory_key" ON "service_formulas"("subcategory");

-- CreateIndex
CREATE INDEX "service_formulas_subcategory_idx" ON "service_formulas"("subcategory");

-- CreateIndex
CREATE INDEX "service_formulas_active_idx" ON "service_formulas"("active");

-- CreateIndex
CREATE INDEX "service_formulas_serviceCategoryId_idx" ON "service_formulas"("serviceCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "DifficultyMultiplier_level_key" ON "DifficultyMultiplier"("level");

-- CreateIndex
CREATE INDEX "DifficultyMultiplier_level_idx" ON "DifficultyMultiplier"("level");

-- CreateIndex
CREATE UNIQUE INDEX "ExtrasMultiplier_code_key" ON "ExtrasMultiplier"("code");

-- CreateIndex
CREATE INDEX "ExtrasMultiplier_code_idx" ON "ExtrasMultiplier"("code");

-- CreateIndex
CREATE INDEX "ExtrasMultiplier_active_idx" ON "ExtrasMultiplier"("active");

-- CreateIndex
CREATE UNIQUE INDEX "service_requests_idempotencyKey_key" ON "service_requests"("idempotencyKey");

-- CreateIndex
CREATE INDEX "service_requests_status_idx" ON "service_requests"("status");

-- CreateIndex
CREATE INDEX "service_requests_paymentStatus_idx" ON "service_requests"("paymentStatus");

-- CreateIndex
CREATE INDEX "service_requests_clientId_idx" ON "service_requests"("clientId");

-- CreateIndex
CREATE INDEX "service_requests_workerId_idx" ON "service_requests"("workerId");

-- CreateIndex
CREATE INDEX "service_requests_serviceCategoryId_idx" ON "service_requests"("serviceCategoryId");

-- CreateIndex
CREATE INDEX "service_requests_createdAt_idx" ON "service_requests"("createdAt");

-- CreateIndex
CREATE INDEX "service_requests_workerTimeoutAt_idx" ON "service_requests"("workerTimeoutAt");

-- CreateIndex
CREATE INDEX "service_requests_cityId_idx" ON "service_requests"("cityId");

-- CreateIndex
CREATE INDEX "service_requests_scheduledAt_idx" ON "service_requests"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_serviceRequestId_key" ON "Dispute"("serviceRequestId");

-- CreateIndex
CREATE INDEX "Dispute_createdAt_idx" ON "Dispute"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_updatedAt_idx" ON "Wallet"("updatedAt");

-- CreateIndex
CREATE INDEX "Wallet_status_idx" ON "Wallet"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_idempotencyKey_key" ON "Transaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Transaction_walletId_idx" ON "Transaction"("walletId");

-- CreateIndex
CREATE INDEX "Transaction_jobId_idx" ON "Transaction"("jobId");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_referenceId_idx" ON "Transaction"("referenceId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_walletId_status_createdAt_idx" ON "Transaction"("walletId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PayoutRequest_walletId_idx" ON "PayoutRequest"("walletId");

-- CreateIndex
CREATE INDEX "PayoutRequest_userId_idx" ON "PayoutRequest"("userId");

-- CreateIndex
CREATE INDEX "PayoutRequest_status_idx" ON "PayoutRequest"("status");

-- CreateIndex
CREATE INDEX "ChatMessage_jobId_idx" ON "ChatMessage"("jobId");

-- CreateIndex
CREATE INDEX "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");

-- CreateIndex
CREATE INDEX "ChatMessage_timestamp_idx" ON "ChatMessage"("timestamp");

-- CreateIndex
CREATE INDEX "Review_jobId_idx" ON "Review"("jobId");

-- CreateIndex
CREATE INDEX "Review_authorId_idx" ON "Review"("authorId");

-- CreateIndex
CREATE INDEX "Review_targetId_idx" ON "Review"("targetId");

-- CreateIndex
CREATE INDEX "Review_categoryId_idx" ON "Review"("categoryId");

-- CreateIndex
CREATE INDEX "SupportTicket_jobId_idx" ON "SupportTicket"("jobId");

-- CreateIndex
CREATE INDEX "SupportTicket_reporterId_idx" ON "SupportTicket"("reporterId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocument_version_key" ON "LegalDocument"("version");

-- CreateIndex
CREATE INDEX "LegalDocument_targetAudience_idx" ON "LegalDocument"("targetAudience");

-- CreateIndex
CREATE INDEX "LegalDocument_version_idx" ON "LegalDocument"("version");

-- CreateIndex
CREATE INDEX "UserConsent_userId_idx" ON "UserConsent"("userId");

-- CreateIndex
CREATE INDEX "UserConsent_documentId_idx" ON "UserConsent"("documentId");

-- CreateIndex
CREATE INDEX "UserConsent_acceptedAt_idx" ON "UserConsent"("acceptedAt");

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
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");

-- CreateIndex
CREATE INDEX "DeviceToken_token_idx" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_active_idx" ON "DeviceToken"("active");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_externalReference_key" ON "payment_transactions"("externalReference");

-- CreateIndex
CREATE INDEX "payment_transactions_userId_idx" ON "payment_transactions"("userId");

-- CreateIndex
CREATE INDEX "payment_transactions_professionalId_idx" ON "payment_transactions"("professionalId");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_externalReference_idx" ON "payment_transactions"("externalReference");

-- CreateIndex
CREATE INDEX "payment_transactions_createdAt_idx" ON "payment_transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_snapshots_transactionId_key" ON "transaction_snapshots"("transactionId");

-- CreateIndex
CREATE INDEX "transaction_snapshots_transactionId_idx" ON "transaction_snapshots"("transactionId");

-- CreateIndex
CREATE INDEX "ledger_entries_accountId_idx" ON "ledger_entries"("accountId");

-- CreateIndex
CREATE INDEX "ledger_entries_transactionId_idx" ON "ledger_entries"("transactionId");

-- CreateIndex
CREATE INDEX "ledger_entries_walletId_idx" ON "ledger_entries"("walletId");

-- CreateIndex
CREATE INDEX "ledger_entries_createdAt_idx" ON "ledger_entries"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_provider_logs_eventId_key" ON "payment_provider_logs"("eventId");

-- CreateIndex
CREATE INDEX "payment_provider_logs_eventId_idx" ON "payment_provider_logs"("eventId");

-- CreateIndex
CREATE INDEX "payment_provider_logs_transactionId_idx" ON "payment_provider_logs"("transactionId");

-- CreateIndex
CREATE INDEX "payment_provider_logs_processedAt_idx" ON "payment_provider_logs"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- CreateIndex
CREATE INDEX "system_config_key_idx" ON "system_config"("key");

-- CreateIndex
CREATE INDEX "outbox_events_processed_idx" ON "outbox_events"("processed");

-- CreateIndex
CREATE INDEX "outbox_events_aggregateId_idx" ON "outbox_events"("aggregateId");

-- CreateIndex
CREATE INDEX "outbox_events_type_idx" ON "outbox_events"("type");

-- CreateIndex
CREATE INDEX "outbox_events_createdAt_idx" ON "outbox_events"("createdAt");

-- AddForeignKey
ALTER TABLE "WorkerProfile" ADD CONSTRAINT "WorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_specialties" ADD CONSTRAINT "worker_specialties_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_specialties" ADD CONSTRAINT "worker_specialties_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_formulas" ADD CONSTRAINT "service_formulas_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "service_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "WorkerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "WorkerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LegalDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_snapshots" ADD CONSTRAINT "transaction_snapshots_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "payment_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_provider_logs" ADD CONSTRAINT "payment_provider_logs_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
