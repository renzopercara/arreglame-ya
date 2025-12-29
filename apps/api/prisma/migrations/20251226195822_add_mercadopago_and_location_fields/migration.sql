-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "city" TEXT,
ADD COLUMN     "coverageRadius" DOUBLE PRECISION NOT NULL DEFAULT 15.0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mercadopagoAccessToken" TEXT,
ADD COLUMN     "mercadopagoCustomerId" TEXT;
