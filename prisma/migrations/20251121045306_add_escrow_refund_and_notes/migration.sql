-- AlterEnum
ALTER TYPE "public"."WalletTxType" ADD VALUE 'ESCROW_REFUND';

-- AlterTable
ALTER TABLE "public"."Escrow" ADD COLUMN     "extend_note" TEXT,
ADD COLUMN     "release_note" TEXT;
