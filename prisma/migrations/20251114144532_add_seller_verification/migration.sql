-- CreateEnum
CREATE TYPE "public"."SellerVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."SellerVerification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_number" TEXT,
    "id_number" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "bank_user_name" TEXT NOT NULL,
    "bank_account" TEXT NOT NULL,
    "shop_description" TEXT,
    "front_image_url" TEXT NOT NULL,
    "back_image_url" TEXT NOT NULL,
    "status" "public"."SellerVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "ai_score" INTEGER,
    "ai_analysis" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SellerVerification_user_id_idx" ON "public"."SellerVerification"("user_id");

-- AddForeignKey
ALTER TABLE "public"."SellerVerification" ADD CONSTRAINT "SellerVerification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
