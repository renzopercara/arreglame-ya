/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - Made the column `currentRole` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ALTER COLUMN "roles" DROP DEFAULT,
ALTER COLUMN "currentRole" SET NOT NULL;
