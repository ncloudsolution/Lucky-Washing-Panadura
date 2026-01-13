/*
  Warnings:

  - Added the required column `branch` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Expense" ADD COLUMN     "branch" TEXT NOT NULL;
