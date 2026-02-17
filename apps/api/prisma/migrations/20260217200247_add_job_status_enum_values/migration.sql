-- Fix for PostgreSQL Error 55P04 (Enum Transaction Lock)
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

-- Create any additional indexes or constraints if needed
-- (placeholder for future structural changes)
