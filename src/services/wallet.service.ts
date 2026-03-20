// be/src/services/wallet.service.ts
import {
  PrismaClient,
  WalletTxType,
  WalletTxStatus,
} from "@prisma/client";
import { payOS } from "../config/payos";
import { UserPayload } from "../middleware/VerifyToken";

const prisma = new PrismaClient();

const ensureWallet = async (userId: string) => {
  let wallet = await prisma.wallet.findUnique({ where: { user_id: userId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        user_id: userId,
      },
    });
  }
  return wallet;
};

export const getMyWallet = async (user: UserPayload) => {
  const wallet = await ensureWallet(user.user_id);
  const txns = await prisma.walletTransaction.findMany({
    where: { wallet_id: wallet.wallet_id },
    orderBy: { created_at: "desc" },
    take: 50,
  });
  return {
    wallet,
    transactions: txns,
  };
};

export const createTopupLink = async (user: UserPayload, amount: number) => {
  if (!amount || amount < 1000) {
    throw new Error("Số tiền tối thiểu là 1.000 VND");
  }

  const wallet = await ensureWallet(user.user_id);

  // Dùng wallet_address nếu có, fallback user_id cho dễ debug
  const userLabel = user.wallet_address ?? user.user_id;

  // PayOS orderCode dạng số
  const orderCode = Number(String(Date.now()).slice(-10));

  // Lưu transaction PENDING
  await prisma.walletTransaction.create({
    data: {
      wallet_id: wallet.wallet_id,
      type: WalletTxType.DEPOSIT,
      status: WalletTxStatus.PENDING,
      amount,
      description: `Nạp ví cho user ${userLabel}`,
      payos_order_code: String(orderCode),
    },
  });

  const payload = {
    orderCode,
    amount,
    description: `Nap vi OpenDataMarket user ${userLabel}`,
    cancelUrl: process.env.PAYOS_CANCEL_URL || "https://example.com/cancel",
    returnUrl: process.env.PAYOS_RETURN_URL || "https://example.com/success",
  };

  const paymentLink = await payOS.paymentRequests.create(payload);
  return paymentLink; // có checkoutUrl
};


// webhook PayOS
export const handlePayOSWebhook = async (rawBody: any) => {
  const data: any = payOS.webhooks.verify(rawBody);

  const orderCode = String(data.orderCode || data.data?.orderCode);
  const amount = data.amount || data.data?.amount;
  const bankRef = data.reference || data.data?.reference;

  if (!orderCode || !amount) {
    throw new Error("Webhook thiếu orderCode hoặc amount");
  }

  await prisma.$transaction(async (tx) => {
    const txn = await tx.walletTransaction.findUnique({
      where: { payos_order_code: orderCode },
      include: { wallet: true },
    });

    if (!txn) return;
    if (txn.status === WalletTxStatus.COMPLETED) return;

    if (txn.amount !== amount) {
      throw new Error("Số tiền webhook không khớp");
    }

    await tx.wallet.update({
      where: { wallet_id: txn.wallet_id },
      data: {
        balance: { increment: amount },
      },
    });

    await tx.walletTransaction.update({
      where: { wallet_tx_id: txn.wallet_tx_id },
      data: {
        status: WalletTxStatus.COMPLETED,
        bank_reference: bankRef || undefined,
      },
    });
  });

  return { ok: true };
};

// ADMIN: xem tất cả ví
export const adminGetAllWallets = async () => {
  return prisma.wallet.findMany({
    include: {
      user: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
};

// ADMIN: cộng / trừ tiền khả dụng
export const adminAdjustWallet = async (
  userId: string,
  amountDelta: number,
  reason?: string,
) => {
  if (!amountDelta) throw new Error("amountDelta phải khác 0");

  return prisma.$transaction(async (tx) => {
    let wallet = await tx.wallet.findUnique({ where: { user_id: userId } });
    if (!wallet) {
      wallet = await tx.wallet.create({ data: { user_id: userId } });
    }

    const updated = await tx.wallet.update({
      where: { wallet_id: wallet.wallet_id },
      data: {
        balance: { increment: amountDelta },
      },
    });

    await tx.walletTransaction.create({
      data: {
        wallet_id: wallet.wallet_id,
        type: WalletTxType.ADJUST,
        status: WalletTxStatus.COMPLETED,
        amount: amountDelta,
        description:
          reason ||
          `Admin điều chỉnh số dư (${amountDelta > 0 ? "cộng" : "trừ"})`,
      },
    });

    return updated;
  });
};
