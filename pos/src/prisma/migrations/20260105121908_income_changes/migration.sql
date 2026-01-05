-- AlterTable
ALTER TABLE "public"."BusinessMeta" ADD COLUMN     "incomeCategories" TEXT[] DEFAULT ARRAY[]::TEXT[];
