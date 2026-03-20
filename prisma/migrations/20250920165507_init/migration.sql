-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('buyer', 'seller', 'admin');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('VND', 'ETH');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "public"."ConfirmStatus" AS ENUM ('waiting', 'confirmed', 'failed');

-- CreateTable
CREATE TABLE "public"."User" (
    "user_id" TEXT NOT NULL,
    "wallet_address" TEXT,
    "email" TEXT,
    "password" TEXT,
    "full_name" TEXT,
    "phone_number" TEXT,
    "bank_account" TEXT,
    "bank_name" TEXT,
    "role" "public"."Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "public"."Dataset" (
    "dataset_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price_vnd" DOUBLE PRECISION,
    "price_eth" DOUBLE PRECISION,
    "file_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("dataset_id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "order_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "payment_method" "public"."PaymentMethod" NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'pending',
    "total_amount" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "transaction_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "tx_hash" TEXT,
    "bank_ref" TEXT,
    "status" "public"."ConfirmStatus" NOT NULL DEFAULT 'waiting',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "review_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "public"."Tag" (
    "tag_id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("tag_id")
);


-- CreateIndex
CREATE UNIQUE INDEX "User_wallet_address_key" ON "public"."User"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_number_key" ON "public"."User"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "User_bank_account_key" ON "public"."User"("bank_account");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "public"."Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_bank_ref_key" ON "public"."Transaction"("bank_ref");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "public"."Tag"("name");

-- AddForeignKey
ALTER TABLE "public"."Dataset" ADD CONSTRAINT "Dataset_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dataset" ADD CONSTRAINT "Dataset_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."Category"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."Dataset"("dataset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."Order"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."Dataset"("dataset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tag" ADD CONSTRAINT "Tag_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."Dataset"("dataset_id") ON DELETE RESTRICT ON UPDATE CASCADE;