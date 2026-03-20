-- CreateTable
CREATE TABLE "public"."WalletDeposit" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletDeposit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."WalletDeposit" ADD CONSTRAINT "WalletDeposit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
