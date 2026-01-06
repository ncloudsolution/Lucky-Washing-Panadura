/*
  Warnings:

  - You are about to drop the column `paymentMethod` on the `OrderMeta` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."OrderMeta" DROP COLUMN "paymentMethod";
