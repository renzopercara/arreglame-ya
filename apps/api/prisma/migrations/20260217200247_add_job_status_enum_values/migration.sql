-- Fix for PostgreSQL Error 55P04 (Enum Transaction Lock)
-- 
-- IMPORTANT: Prisma wraps all migrations in an implicit BEGIN/COMMIT transaction.
-- This COMMIT closes that implicit transaction to allow ENUM values to be persisted
-- to the system catalog before they are used in subsequent ALTER TABLE statements.
-- 
-- Close Prisma's implicit transaction to persist ENUM values before using them
COMMIT;

-- Add new JobStatus enum values outside of a transaction
ALTER TYPE "JobStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "JobStatus" ADD VALUE IF NOT EXISTS 'ANALYZING';
ALTER TYPE "JobStatus" ADD VALUE IF NOT EXISTS 'OFFERING';
ALTER TYPE "JobStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

-- Begin new transaction for remaining schema changes
BEGIN;

-- Update ServiceRequest default status to use new PENDING value
ALTER TABLE "service_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Add enterprise workflow fields to service_requests table
ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "cityId" TEXT;
ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "totalAmount" DECIMAL(10,2);
ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "workerPayout" DECIMAL(10,2);
ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "platformCommission" DECIMAL(10,2);
ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "verificationCode" TEXT;
ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "assignmentAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);
ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "workerTimeoutAt" TIMESTAMP(3);
ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "disputeDeadlineAt" TIMESTAMP(3);
ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "payoutReleasedAt" TIMESTAMP(3);

-- Create indexes for enterprise workflow fields
CREATE INDEX IF NOT EXISTS "service_requests_workerTimeoutAt_idx" ON "service_requests"("workerTimeoutAt");
CREATE INDEX IF NOT EXISTS "service_requests_cityId_idx" ON "service_requests"("cityId");
CREATE INDEX IF NOT EXISTS "service_requests_scheduledAt_idx" ON "service_requests"("scheduledAt");

-- Create unique constraint for idempotencyKey
CREATE UNIQUE INDEX IF NOT EXISTS "service_requests_idempotencyKey_key" ON "service_requests"("idempotencyKey");

-- Commit the transaction to finalize structural changes
COMMIT;
