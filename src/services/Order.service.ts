// be/src/services/Order.service.ts
import {
  PrismaClient,
  PaymentMethod,
  PaymentStatus,
  WalletTxType,
  WalletTxStatus,
} from "@prisma/client";
import { UserPayload } from "../middleware/VerifyToken";

const prisma = new PrismaClient();

export const getAll = async (user: UserPayload) => {
  if (user.role === "admin") {
    return await prisma.order.findMany({ include: { dataset: true } });
  }
  if (user.role === "buyer") {
    return await prisma.order.findMany({
      where: { buyer_id: user.user_id },
      include: { 
    dataset: true,
    complaint: true,     // 👈 THÊM DÒNG NÀY
    escrow: true          // 👈 Để biết escrow đang HOLDING / DISPUTED / REFUNDED
  },
    });
  }
  if (user.role === "seller") {
    return await prisma.order.findMany({
      where: { dataset: { seller_id: user.user_id } },
      include: { 
  dataset: true,
  complaint: true,
  escrow: true
}

    });
  }
};

export const getById = async (id: string, user: UserPayload) => {
  console.log("=== ORDER getById() ===");
  console.log("Order ID FE yêu cầu:", id);
  console.log("User từ token:", user);

  const order = await prisma.order.findUnique({
    where: { order_id: id },
    include: {
      dataset: true,
      complaint: true,
      escrow: true,
    },
  });

  console.log("ORDER TRẢ VỀ CHO FE:", order);

  if (!order) {
    console.log("ERROR: Order không tồn tại");
    throw new Error("Order not found");
  }

  if (user.role === "buyer" && order.buyer_id !== user.user_id) {
    console.log("ERROR: Buyer không trùng user_id");
    throw new Error("Not allowed");
  }

  return order;
};

export const create = async (data: any, buyerId: string) => {
  return await prisma.$transaction(async (tx) => {
    const dataset = await tx.dataset.findUnique({
      where: { dataset_id: data.dataset_id },
    });

    if (!dataset || dataset.price_vnd == null) {
      throw new Error("Dataset không tồn tại hoặc chưa có giá VND");
    }

    const amount = Math.round(dataset.price_vnd);
    if (amount <= 0) {
      throw new Error("Giá dataset không hợp lệ");
    }

    let buyerWallet = await tx.wallet.findUnique({
      where: { user_id: buyerId },
    });

    if (!buyerWallet) {
      buyerWallet = await tx.wallet.create({
        data: { user_id: buyerId },
      });
    }

    if (buyerWallet.balance < amount) {
      throw new Error("Số dư ví không đủ, vui lòng nạp thêm tiền");
    }

    await tx.wallet.update({
      where: { wallet_id: buyerWallet.wallet_id },
      data: {
        balance: { decrement: amount },
      },
    });

    await tx.walletTransaction.create({
      data: {
        wallet_id: buyerWallet.wallet_id,
        type: WalletTxType.PURCHASE,
        status: WalletTxStatus.COMPLETED,
        amount: -amount,
        description: `Mua dataset ${dataset.title}`,
      },
    });

    const order = await tx.order.create({
      data: {
        buyer_id: buyerId,
        dataset_id: data.dataset_id,
        payment_method: PaymentMethod.VND,
        status: PaymentStatus.completed,
        bank_ref: `WALLET_${Date.now()}`,
        total_amount: dataset.price_vnd,
      },
      include: { dataset: true },
    });

    const sellerId = dataset.seller_id;

    let sellerWallet = await tx.wallet.findUnique({
      where: { user_id: sellerId },
    });

    if (!sellerWallet) {
      sellerWallet = await tx.wallet.create({
        data: { user_id: sellerId },
      });
    }

    await tx.wallet.update({
      where: { wallet_id: sellerWallet.wallet_id },
      data: {
        pending_balance: { increment: amount },
      },
    });

    await tx.escrow.create({
      data: {
        order_id: order.order_id,
        buyer_id: buyerId,
        seller_id: sellerId,
        amount,
        status: "HOLDING",
        release_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    });

    return order;
  });
};

export const update = async (id: string, data: any, user: UserPayload) => {
  if (user.role !== "seller") throw new Error("Only seller can update orders");

  return await prisma.order.update({
    where: { order_id: id },
    data,
  });
};

export const remove = async (id: string) => {
  return await prisma.order.delete({
    where: { order_id: id },
  });
};
