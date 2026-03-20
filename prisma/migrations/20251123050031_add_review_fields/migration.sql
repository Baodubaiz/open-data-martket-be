/*
  Warnings:

  - Added the required column `order_id` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_buyer_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_dataset_id_fkey";

-- AlterTable
ALTER TABLE "public"."Review" ADD COLUMN     "order_id" TEXT NOT NULL,
ADD COLUMN     "reply" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."Dataset"("dataset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."Order"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;
