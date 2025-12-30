-- AddEmailVerificationAndEnhancedKYC
-- This migration adds email verification fields to User table and enhances KYC fields in WorkerProfile

-- ============================================
-- USER TABLE: Add Email Verification
-- ============================================

-- Add email verification fields
ALTER TABLE "User" ADD COLUMN "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "emailVerificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- Add index for email verification token lookups
CREATE INDEX "User_emailVerificationToken_idx" ON "User"("emailVerificationToken");

-- ============================================
-- WORKERPROFILE TABLE: Enhanced KYC
-- ============================================

-- Add enhanced KYC fields
ALTER TABLE "WorkerProfile" ADD COLUMN "isKycVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WorkerProfile" ADD COLUMN "legalName" TEXT;
ALTER TABLE "WorkerProfile" ADD COLUMN "taxId" TEXT;
ALTER TABLE "WorkerProfile" ADD COLUMN "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "WorkerProfile" ADD COLUMN "kycSubmittedAt" TIMESTAMP(3);
ALTER TABLE "WorkerProfile" ADD COLUMN "kycApprovedAt" TIMESTAMP(3);

-- Add index for KYC status lookups
CREATE INDEX "WorkerProfile_isKycVerified_idx" ON "WorkerProfile"("isKycVerified");
CREATE INDEX "WorkerProfile_kycStatus_isKycVerified_idx" ON "WorkerProfile"("kycStatus", "isKycVerified");

-- ============================================
-- DATA MIGRATION: Set defaults
-- ============================================

-- For existing users who can login, we keep isEmailVerified as false
-- They will need to verify their email for financial operations

-- For existing workers with APPROVED KYC status, set isKycVerified to true
UPDATE "WorkerProfile" 
SET "isKycVerified" = true, "kycApprovedAt" = NOW()
WHERE "kycStatus" = 'APPROVED';

-- For existing workers with other statuses, keep isKycVerified as false
-- They will need to complete KYC verification

-- ============================================
-- SECURITY NOTES
-- ============================================

-- 1. Email Verification:
--    - New users will have isEmailVerified = false by default
--    - Financial operations (payments, withdrawals) require email verification
--    - Verification token is single-use and should be cleared after use

-- 2. Enhanced KYC:
--    - isKycVerified provides a quick boolean check for authorization
--    - kycStatus tracks the workflow state (PENDING_SUBMISSION, PENDING_REVIEW, APPROVED, REJECTED)
--    - Both must be checked: kycStatus = APPROVED AND isKycVerified = true
--    - Additional fields (legalName, taxId, dateOfBirth) support regulatory compliance

-- 3. Commission Model Update:
--    - Platform now charges 5% to client (on top of base)
--    - Platform charges 5% to worker (deducted from base)
--    - Total platform revenue: 10% (5% from each party)
--    - This is enforced in CommissionService, not in the database
