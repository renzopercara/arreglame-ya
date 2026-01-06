/*
  Warnings:

  - The `category` column on the `ServiceRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ServiceCategoryEnum" AS ENUM ('MAINTENANCE', 'PAINTING', 'HVAC', 'ELECTRICAL', 'PLUMBING');

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "serviceCategoryId" TEXT,
DROP COLUMN "category",
ADD COLUMN     "category" "ServiceCategoryEnum";

-- DropEnum
DROP TYPE "ServiceCategory";

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iconName" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "estimatedHours" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE INDEX "ServiceCategory_slug_idx" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE INDEX "ServiceCategory_active_idx" ON "ServiceCategory"("active");

-- CreateIndex
CREATE INDEX "ServiceRequest_serviceCategoryId_idx" ON "ServiceRequest"("serviceCategoryId");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
