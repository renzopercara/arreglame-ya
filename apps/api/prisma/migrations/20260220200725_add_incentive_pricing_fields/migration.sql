-- AlterTable: add incentive pricing fields to service_requests
-- basePrice: immutable snapshot of the original calculated price
-- extraIncrement: accumulated incentive amount added by the client
-- incrementCount: number of times the price was incremented

ALTER TABLE "service_requests"
  ADD COLUMN IF NOT EXISTS "basePrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "extraIncrement" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "incrementCount" INTEGER NOT NULL DEFAULT 0;

-- Seed system_config entries for incentive pricing parameters
INSERT INTO "system_config" ("id", "key", "value", "type", "description", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'PRICE_INCREMENT_PERCENTAGE', '10', 'INT', 'Percentage added each time a client chooses to incentivize their request', NOW(), NOW()),
  (gen_random_uuid(), 'MAX_INCREMENT_COUNT',        '3',  'INT', 'Maximum number of times a client can increment the price for a single request', NOW(), NOW()),
  (gen_random_uuid(), 'SERVICE_EXPIRATION_HOURS',   '24', 'INT', 'Hours before an unassigned service request transitions to EXPIRED status',    NOW(), NOW())
ON CONFLICT ("key") DO NOTHING;
