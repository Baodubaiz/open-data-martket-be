// be/src/services/withdraw.service.ts
import {
  PrismaClient,
  WithdrawStatus,
  WalletTxType,
  WalletTxStatus,
} from "@prisma/client";
import { UserPayload } from "../middleware/VerifyToken";

const prisma = new PrismaClient();

// Seller tạo yêu cầu rút tiền
export const createWithdrawRequest = async (
  user: UserPayload,
  amount: number,
  note?: string,
) => {
  if (user.role !== "seller") {
    throw new Error("Chỉ seller mới được rút tiền");
  }

  if (!amount || amount <= 0) {
    throw new Error("Số tiền rút phải > 0");
  }

  return prisma.$transaction(async (tx) => {
    let wallet = await tx.wallet.findUnique({
      where: { user_id: user.user_id },
    });

    if (!wallet) {
      throw new Error("Seller chưa có ví");
    }

    if (wallet.balance < amount) {
      throw new Error("Số dư ví không đủ để rút");
    }

    // 1. Chuyển từ balance sang pending_balance (chờ admin duyệt)
    await tx.wallet.update({
      where: { wallet_id: wallet.wallet_id },
      data: {
        balance: { decrement: amount },
        pending_balance: { increment: amount },
      },
    });

    // 2. Log transaction (WITHDRAW_REQ)
    await tx.walletTransaction.create({
      data: {
        wallet_id: wallet.wallet_id,
        type: WalletTxType.WITHDRAW_REQ,
        status: WalletTxStatus.COMPLETED,
        amount: -amount,
        description: "Seller yêu cầu rút tiền",
      },
    });

    // 3. Tạo WithdrawRequest
    const withdraw = await tx.withdrawRequest.create({
      data: {
        user_id: user.user_id,
        amount,
        status: WithdrawStatus.PENDING,
        note,
      },
    });

    return withdraw;
  });
};

// Seller xem lịch sử rút tiền của mình
export const getMyWithdrawRequests = async (user: UserPayload) => {
  return prisma.withdrawRequest.findMany({
    where: { user_id: user.user_id },
    orderBy: { created_at: "desc" },
  });
};

// Admin xem tất cả yêu cầu rút
export const adminGetAllWithdrawRequests = async () => {
  return prisma.withdrawRequest.findMany({
    orderBy: { created_at: "desc" },
    include: {
      user: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          role: true,
        },
      },
      admin: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },
    },
  });
};

// Admin approve
export const adminApproveWithdraw = async (
  withdraw_id: string,
  adminId: string,
) => {
  return prisma.$transaction(async (tx) => {
    const request = await tx.withdrawRequest.findUnique({
      where: { withdraw_id },
    });

    if (!request) throw new Error("Yêu cầu rút không tồn tại");
    if (request.status !== WithdrawStatus.PENDING) {
      throw new Error("Yêu cầu rút đã được xử lý");
    }

    const wallet = await tx.wallet.findUnique({
      where: { user_id: request.user_id },
    });

    if (!wallet) throw new Error("Ví của seller không tồn tại");

    if (wallet.pending_balance < request.amount) {
      throw new Error("pending_balance không đủ để duyệt rút");
    }

    // Tiền đã bị trừ khỏi balance khi tạo request
    // Giờ chỉ giảm pending_balance (tiền rời khỏi hệ thống)
    await tx.wallet.update({
      where: { wallet_id: wallet.wallet_id },
      data: {
        pending_balance: { decrement: request.amount },
      },
    });

    // Transaction log WITHDRAW_DONE (không tác động balance)
    await tx.walletTransaction.create({
      data: {
        wallet_id: wallet.wallet_id,
        type: WalletTxType.WITHDRAW_DONE,
        status: WalletTxStatus.COMPLETED,
        amount: 0,
        description: "Admin xác nhận đã chuyển tiền rút",
      },
    });

    const updated = await tx.withdrawRequest.update({
      where: { withdraw_id },
      data: {
        status: WithdrawStatus.APPROVED,
        processed_at: new Date(),
        admin_id: adminId,
      },
    });

    return updated;
  });
};

// Admin reject
export const adminRejectWithdraw = async (
  withdraw_id: string,
  adminId: string,
  note?: string,
) => {
  return prisma.$transaction(async (tx) => {
    const request = await tx.withdrawRequest.findUnique({
      where: { withdraw_id },
    });

    if (!request) throw new Error("Yêu cầu rút không tồn tại");
    if (request.status !== WithdrawStatus.PENDING) {
      throw new Error("Yêu cầu rút đã được xử lý");
    }

    const wallet = await tx.wallet.findUnique({
      where: { user_id: request.user_id },
    });

    if (!wallet) throw new Error("Ví của seller không tồn tại");

    if (wallet.pending_balance < request.amount) {
      throw new Error("pending_balance không đủ để hoàn lại");
    }

    // Hoàn lại tiền: pending_balance giảm, balance tăng
    await tx.wallet.update({
      where: { wallet_id: wallet.wallet_id },
      data: {
        pending_balance: { decrement: request.amount },
        balance: { increment: request.amount },
      },
    });

    // Transaction log ADJUST
    await tx.walletTransaction.create({
      data: {
        wallet_id: wallet.wallet_id,
        type: WalletTxType.ADJUST,
        status: WalletTxStatus.COMPLETED,
        amount: request.amount,
        description: "Yêu cầu rút bị từ chối, hoàn lại số dư",
      },
    });

    const updated = await tx.withdrawRequest.update({
      where: { withdraw_id },
      data: {
        status: WithdrawStatus.REJECTED,
        processed_at: new Date(),
        admin_id: adminId,
        note: note ?? request.note,
      },
    });

    return updated;
  });
};
