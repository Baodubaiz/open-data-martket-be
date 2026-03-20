-- CreateEnum
CREATE TYPE "public"."WalletTxType" AS ENUM ('DEPOSIT', 'PURCHASE', 'ESCROW_HOLD', 'ESCROW_RELEASE', 'WITHDRAW_REQ', 'WITHDRAW_DONE', 'ADJUST');

-- CreateEnum
CREATE TYPE "public"."WalletTxStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."EscrowStatus" AS ENUM ('HOLDING', 'RELEASED', 'DISPUTED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."WithdrawStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."Wallet" (
    "wallet_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "pending_balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("wallet_id")
);

-- CreateTable
CREATE TABLE "public"."WalletTransaction" (
    "wallet_tx_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" "public"."WalletTxType" NOT NULL,
    "status" "public"."WalletTxStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "ref_order_id" TEXT,
    "payos_order_code" TEXT,
    "bank_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("wallet_tx_id")
);

-- CreateTable
CREATE TABLE "public"."Escrow" (
    "escrow_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "public"."EscrowStatus" NOT NULL DEFAULT 'HOLDING',
    "release_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),

    CONSTRAINT "Escrow_pkey" PRIMARY KEY ("escrow_id")
);

-- CreateTable
CREATE TABLE "public"."WithdrawRequest" (
    "withdraw_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "public"."WithdrawStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "admin_id" TEXT,
    "note" TEXT,

    CONSTRAINT "WithdrawRequest_pkey" PRIMARY KEY ("withdraw_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_user_id_key" ON "public"."Wallet"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_payos_order_code_key" ON "public"."WalletTransaction"("payos_order_code");

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_order_id_key" ON "public"."Escrow"("order_id");

-- AddForeignKey
ALTER TABLE "public"."Wallet" ADD CONSTRAINT "Wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WalletTransaction" ADD CONSTRAINT "WalletTransaction_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."Wallet"("wallet_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Escrow" ADD CONSTRAINT "Escrow_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."Order"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Escrow" ADD CONSTRAINT "Escrow_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Escrow" ADD CONSTRAINT "Escrow_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WithdrawRequest" ADD CONSTRAINT "WithdrawRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WithdrawRequest" ADD CONSTRAINT "WithdrawRequest_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
