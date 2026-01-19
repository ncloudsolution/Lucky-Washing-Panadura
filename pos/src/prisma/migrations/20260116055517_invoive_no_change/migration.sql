-- AlterTable
ALTER TABLE "public"."OrderMeta" ALTER COLUMN "invoiceId" DROP DEFAULT,
ALTER COLUMN "invoiceId" SET DATA TYPE TEXT;
DROP SEQUENCE "OrderMeta_invoiceId_seq";
