-- Multi-Identity System Migration
-- This migration implements the multi-role identity system with zero data loss

-- Step 1: Add new enum for SpecialtyStatus
CREATE TYPE "SpecialtyStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'REJECTED');

-- Step 2: Add new columns to User table
ALTER TABLE "User" ADD COLUMN "roles" "UserRole"[] DEFAULT ARRAY['CLIENT']::"UserRole"[];
ALTER TABLE "User" ADD COLUMN "currentRole" "UserRole" DEFAULT 'CLIENT';

-- Step 3: Migrate existing role data to new structure
-- Copy existing role to currentRole
UPDATE "User" SET "currentRole" = "role";

-- Set roles array based on existing role and profiles
UPDATE "User" u
SET "roles" = CASE
  WHEN u."role" = 'ADMIN' THEN ARRAY['ADMIN', 'CLIENT', 'WORKER']::"UserRole"[]
  WHEN u."role" = 'WORKER' THEN (
    SELECT CASE 
      WHEN EXISTS (SELECT 1 FROM "ClientProfile" cp WHERE cp."userId" = u.id)
      THEN ARRAY['CLIENT', 'WORKER']::"UserRole"[]
      ELSE ARRAY['WORKER']::"UserRole"[]
    END
  )
  WHEN u."role" = 'CLIENT' THEN ARRAY['CLIENT']::"UserRole"[]
  ELSE ARRAY['CLIENT']::"UserRole"[]
END;

-- Step 4: Create WorkerSpecialty table
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

-- Step 5: Add indexes for WorkerSpecialty
CREATE UNIQUE INDEX "worker_specialties_workerId_categoryId_key" ON "worker_specialties"("workerId", "categoryId");
CREATE INDEX "worker_specialties_workerId_idx" ON "worker_specialties"("workerId");
CREATE INDEX "worker_specialties_categoryId_idx" ON "worker_specialties"("categoryId");
CREATE INDEX "worker_specialties_status_idx" ON "worker_specialties"("status");

-- Step 6: Add foreign key constraints
ALTER TABLE "worker_specialties" ADD CONSTRAINT "worker_specialties_workerId_fkey" 
  FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "worker_specialties" ADD CONSTRAINT "worker_specialties_categoryId_fkey" 
  FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Add categoryId to Review table for category-specific ratings
ALTER TABLE "Review" ADD COLUMN "categoryId" TEXT;

-- Step 8: Add foreign key for Review.categoryId
ALTER TABLE "Review" ADD CONSTRAINT "Review_categoryId_fkey" 
  FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 9: Add index for Review.categoryId
CREATE INDEX "Review_categoryId_idx" ON "Review"("categoryId");

-- Step 10: Add index for User.currentRole
CREATE INDEX "User_currentRole_idx" ON "User"("currentRole");

-- Step 11: Migrate existing trade data to WorkerSpecialty (if ServiceCategory exists)
-- This will create PENDING specialties for workers with trade information
-- Note: This requires ServiceCategory data to exist, otherwise skip
INSERT INTO "worker_specialties" ("id", "workerId", "categoryId", "status", "experienceYears", "metadata", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  wp."id" as "workerId",
  sc."id" as "categoryId",
  'ACTIVE'::"SpecialtyStatus" as "status",
  0 as "experienceYears",
  jsonb_build_object('migratedFromTrade', wp."trade") as "metadata",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "WorkerProfile" wp
CROSS JOIN "service_categories" sc
WHERE wp."trade" IS NOT NULL 
  AND wp."trade" != ''
  AND sc."slug" = 'maintenance' -- Default to maintenance category for migration
  AND NOT EXISTS (
    SELECT 1 FROM "worker_specialties" ws 
    WHERE ws."workerId" = wp."id" AND ws."categoryId" = sc."id"
  )
LIMIT 1000; -- Safety limit

-- Step 12: Mark old role column as deprecated (keep for rollback capability)
COMMENT ON COLUMN "User"."role" IS 'DEPRECATED: Use roles array and currentRole instead. Kept for backward compatibility.';

-- Step 13: Mark old trade column as deprecated
COMMENT ON COLUMN "WorkerProfile"."trade" IS 'DEPRECATED: Use WorkerSpecialty table instead. Kept for backward compatibility.';
