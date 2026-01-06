-- AlterTable: Add pricing columns if they don't exist
ALTER TABLE "ServiceCategory" ADD COLUMN IF NOT EXISTS "basePrice" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "hourlyRate" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "estimatedHours" DOUBLE PRECISION;

-- Note: Existing records should be seeded via seed.ts, not hardcoded here
-- The seed script provides the correct business values from a single source

-- CreateTable: ServiceFormula
CREATE TABLE IF NOT EXISTS "ServiceFormula" (
    "id" TEXT NOT NULL,
    "subcategory" "ServiceSubcategory" NOT NULL,
    "serviceCategoryId" TEXT,
    "baseTimeFormula" TEXT NOT NULL,
    "defaultMetadata" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DifficultyMultiplier
CREATE TABLE IF NOT EXISTS "DifficultyMultiplier" (
    "id" TEXT NOT NULL,
    "level" "DifficultyLevel" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DifficultyMultiplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ExtrasMultiplier
CREATE TABLE IF NOT EXISTS "ExtrasMultiplier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtrasMultiplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceFormula_subcategory_key" ON "ServiceFormula"("subcategory");
CREATE INDEX IF NOT EXISTS "ServiceFormula_subcategory_idx" ON "ServiceFormula"("subcategory");
CREATE INDEX IF NOT EXISTS "ServiceFormula_active_idx" ON "ServiceFormula"("active");
CREATE INDEX IF NOT EXISTS "ServiceFormula_serviceCategoryId_idx" ON "ServiceFormula"("serviceCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DifficultyMultiplier_level_key" ON "DifficultyMultiplier"("level");
CREATE INDEX IF NOT EXISTS "DifficultyMultiplier_level_idx" ON "DifficultyMultiplier"("level");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ExtrasMultiplier_code_key" ON "ExtrasMultiplier"("code");
CREATE INDEX IF NOT EXISTS "ExtrasMultiplier_code_idx" ON "ExtrasMultiplier"("code");
CREATE INDEX IF NOT EXISTS "ExtrasMultiplier_active_idx" ON "ExtrasMultiplier"("active");

-- AddForeignKey
ALTER TABLE "ServiceFormula" ADD CONSTRAINT IF NOT EXISTS "ServiceFormula_serviceCategoryId_fkey" 
FOREIGN KEY ("serviceCategoryId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
