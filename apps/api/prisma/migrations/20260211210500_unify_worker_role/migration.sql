-- AlterEnum: Change ActiveRole enum from PROVIDER to WORKER
-- This migration renames the PROVIDER value to WORKER in the ActiveRole enum

-- Step 1: Update all existing records using PROVIDER to use WORKER temporarily via a string cast
UPDATE "User" SET "activeRole" = 'CLIENT' WHERE "activeRole" = 'PROVIDER';

-- Step 2: Drop and recreate the enum type with the new value
-- Note: PostgreSQL doesn't support renaming enum values directly
-- We need to create a new enum and migrate

-- Create new enum with WORKER instead of PROVIDER
CREATE TYPE "ActiveRole_new" AS ENUM ('CLIENT', 'WORKER');

-- Alter the column to use the new enum type
ALTER TABLE "User" ALTER COLUMN "activeRole" TYPE "ActiveRole_new" USING ("activeRole"::text::"ActiveRole_new");

-- Drop old enum type
DROP TYPE "ActiveRole";

-- Rename new enum to the original name
ALTER TYPE "ActiveRole_new" RENAME TO "ActiveRole";

-- Step 3: Update records back - users who were PROVIDER (now set to CLIENT) should be WORKER
-- This query identifies users with WORKER role and sets their activeRole to WORKER
UPDATE "User" 
SET "activeRole" = 'WORKER' 
WHERE 'WORKER' = ANY("roles");
