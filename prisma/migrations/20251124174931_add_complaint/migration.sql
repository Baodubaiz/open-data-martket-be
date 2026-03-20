-- CreateEnum
CREATE TYPE "public"."ComplaintStatus" AS ENUM ('PENDING', 'SELLER_COMPENSATED', 'SELLER_REFUND', 'ADMIN_REFUNDED', 'ADMIN_CLOSED');

-- CreateEnum
CREATE TYPE "public"."SellerAction" AS ENUM ('COMPENSATED', 'REQUEST_REFUND');

-- CreateTable
CREATE TABLE "public"."Complaint" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "public"."ComplaintStatus" NOT NULL DEFAULT 'PENDING',
    "seller_action" "public"."SellerAction",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_order_id_key" ON "public"."Complaint"("order_id");

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."Order"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;
