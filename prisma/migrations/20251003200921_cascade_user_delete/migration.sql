/*
  Warnings:

  - Made the column `category_id` on table `Dataset` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Dataset" DROP CONSTRAINT "Dataset_category_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Dataset" DROP CONSTRAINT "Dataset_seller_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_buyer_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_dataset_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_buyer_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_dataset_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tag" DROP CONSTRAINT "Tag_dataset_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_order_id_fkey";

-- DropIndex
DROP INDEX "public"."Tag_name_key";

-- AlterTable
ALTER TABLE "public"."Dataset" ALTER COLUMN "category_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Dataset" ADD CONSTRAINT "Dataset_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dataset" ADD CONSTRAINT "Dataset_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."Category"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."Dataset"("dataset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."Order"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."Dataset"("dataset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tag" ADD CONSTRAINT "Tag_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."Dataset"("dataset_id") ON DELETE CASCADE ON UPDATE CASCADE;
