-- AlterEnum: Change ActiveRole enum from PROVIDER to WORKER
-- This migration renames the PROVIDER value to WORKER in the ActiveRole enum

-- Step 1: Add a temporary column to preserve original activeRole state
ALTER TABLE "User" ADD COLUMN "activeRole_temp" TEXT;
UPDATE "User" SET "activeRole_temp" = "activeRole"::text;

-- Step 2: Set all users to CLIENT temporarily (safe default)
UPDATE "User" SET "activeRole" = 'CLIENT';

-- Step 3: Drop and recreate the enum type with the new value
-- Note: PostgreSQL doesn't support renaming enum values directly

-- Create new enum with WORKER instead of PROVIDER
CREATE TYPE "ActiveRole_new" AS ENUM ('CLIENT', 'WORKER');

-- Alter the column to use the new enum type
ALTER TABLE "User" ALTER COLUMN "activeRole" TYPE "ActiveRole_new" USING ("activeRole"::text::"ActiveRole_new");

-- Drop old enum type
DROP TYPE "ActiveRole";

-- Rename new enum to the original name
ALTER TYPE "ActiveRole_new" RENAME TO "ActiveRole";

-- Step 4: Restore activeRole based on temporary column
-- Users who were in PROVIDER mode should be set to WORKER
UPDATE "User" 
SET "activeRole" = 'WORKER' 
WHERE "activeRole_temp" = 'PROVIDER';

-- Users who were in CLIENT mode stay in CLIENT mode
-- (This is already the default from Step 2, but being explicit)
UPDATE "User" 
SET "activeRole" = 'CLIENT' 
WHERE "activeRole_temp" = 'CLIENT';

-- Step 5: Clean up temporary column
ALTER TABLE "User" DROP COLUMN "activeRole_temp";

