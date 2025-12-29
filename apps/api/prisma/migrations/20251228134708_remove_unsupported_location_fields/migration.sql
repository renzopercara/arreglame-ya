/*
  Warnings:

  - You are about to drop the column `location` on the `ServiceRequest` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `WorkerProfile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "WorkerProfile_location_idx";

-- AlterTable
ALTER TABLE "ServiceRequest" DROP COLUMN "location";

-- AlterTable
ALTER TABLE "WorkerProfile" DROP COLUMN "location";
