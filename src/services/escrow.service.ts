import {
  PrismaClient,
  WalletTxType,
  WalletTxStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

export type EscrowStatus =
  | "HOLDING"
  | "RELEASED"
  | "DISPUTED"
  | "REFUNDED"
  | "CANCELLED";

/**
 * Seller xem các escrow của mình
 */

export async function getEscrowForSeller(sellerId: string) {
  const list = await prisma.escrow.findMany({
    where: { seller_id: sellerId },
    orderBy: { created_at: "desc" },
    include: {
      // Lấy order kèm dataset + buyer để FE dùng
      order: {
        include: {
          dataset: {
            select: {
              dataset_id: true,
              title: true,
            },
          },
          buyer: {
            select: {
              full_name: true,
              email: true,
            },
          },
        },
      },

      // Lấy thông tin buyer/seller gắn trực tiếp với escrow
      buyer: {
        select: {
          full_name: true,
          email: true,
        },
      },
      seller: {
        select: {
          full_name: true,
          email: true,
        },
      },
    },
  });

  return list.map((e) => ({
    escrow_id: e.escrow_id,
    order_id: e.order_id,
    amount: e.amount,
    status: e.status as EscrowStatus,
    release_at: e.release_at,
    created_at: e.created_at,
    released_at: e.released_at,
    buyer: e.buyer,
    seller: e.seller,
    dataset: e.order?.dataset ?? null,
  }));
}

/**
 * Admin: lấy toàn bộ escrow
 */
export async function getAllEscrowForAdmin() {
  const list = await prisma.escrow.findMany({
    orderBy: { created_at: "desc" },
    include: {
      order: {
        include: {
          dataset: {
            select: {
              dataset_id: true,
              title: true,
            },
          },
          buyer: {
            select: {
              full_name: true,
              email: true,
            },
          },
        },
      },
      buyer: {
        select: {
          full_name: true,
          email: true,
        },
      },
      seller: {
        select: {
          full_name: true,
          email: true,
        },
      },
    },
  });

  return list.map((e) => ({
    escrow_id: e.escrow_id,
    order_id: e.order_id,
    amount: e.amount,
    status: e.status as EscrowStatus,
    release_at: e.release_at,
    created_at: e.created_at,
    released_at: e.released_at,
    buyer: e.buyer,
    seller: e.seller,
    dataset: e.order?.dataset ?? null,
  }));
}

/**
 * Admin: giải ngân cho seller
 * - Giảm pending_balance
 * - Tăng balance
 * - Log WalletTransaction loại ESCROW_RELEASE
 */
export async function adminReleaseEscrow(
  escrowId: string,
  note?: string | null
) {
  return prisma.$transaction(async (tx) => {
    // 1. Lấy escrow
    const escrow = await tx.escrow.findUnique({
      where: { escrow_id: escrowId },
    });

    if (!escrow) {
      throw new Error("Escrow không tồn tại");
    }

    if (escrow.status !== "HOLDING") {
      throw new Error("Chỉ escrow đang giam mới được giải ngân");
    }

    // 2. Lấy ví seller
    let sellerWallet = await tx.wallet.findUnique({
      where: { user_id: escrow.seller_id },
    });

    if (!sellerWallet) {
      // Trường hợp hiếm, nhưng để chắc ăn thì tạo ví cho seller
      sellerWallet = await tx.wallet.create({
        data: { user_id: escrow.seller_id },
      });
    }

    if (sellerWallet.pending_balance < escrow.amount) {
      throw new Error("pending_balance của seller không đủ để giải ngân");
    }

    // 3. Chuyển tiền từ pending_balance -> balance
    const updatedWallet = await tx.wallet.update({
      where: { wallet_id: sellerWallet.wallet_id },
      data: {
        pending_balance: { decrement: escrow.amount },
        balance: { increment: escrow.amount },
      },
    });

    // 4. Log transaction ESCROW_RELEASE
    await tx.walletTransaction.create({
      data: {
        wallet_id: updatedWallet.wallet_id,
        type: WalletTxType.ESCROW_RELEASE,
        status: WalletTxStatus.COMPLETED,
        amount: escrow.amount,
        description: `Giải ngân escrow cho order ${escrow.order_id}`,
        ref_order_id: escrow.order_id,
      },
    });

    // 5. Cập nhật trạng thái escrow
    const updatedEscrow = await tx.escrow.update({
      where: { escrow_id: escrowId },
      data: {
        status: "RELEASED",
        released_at: new Date(),
        release_note: note ?? undefined,
      },
    });

    return updatedEscrow;
  });
}

/**
 * Admin: hoàn tiền cho buyer
 * - Giảm pending_balance của seller (nếu đang giữ tiền escrow)
 * - Cộng lại balance cho buyer
 * - Log WalletTransaction loại ESCROW_REFUND cho cả 2 bên
 */
export async function adminRefundEscrow(
  escrowId: string,
  note?: string | null
) {
  return prisma.$transaction(async (tx) => {
    // 1. Lấy escrow
    const escrow = await tx.escrow.findUnique({
      where: { escrow_id: escrowId },
    });

    if (!escrow) {
      throw new Error("Escrow không tồn tại");
    }

    if (escrow.status !== "HOLDING") {
      throw new Error("Chỉ escrow đang giam mới được hoàn tiền");
    }

    // 2. Xử lý ví seller: giảm pending_balance, log ESCROW_REFUND (âm tiền)
    let sellerWallet = await tx.wallet.findUnique({
      where: { user_id: escrow.seller_id },
    });

    if (sellerWallet) {
      if (sellerWallet.pending_balance < escrow.amount) {
        throw new Error("pending_balance của seller không đủ để hoàn tiền");
      }

      sellerWallet = await tx.wallet.update({
        where: { wallet_id: sellerWallet.wallet_id },
        data: {
          pending_balance: { decrement: escrow.amount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          wallet_id: sellerWallet.wallet_id,
          type: WalletTxType.ESCROW_REFUND,
          status: WalletTxStatus.COMPLETED,
          amount: -escrow.amount,
          description: `Hoàn tiền cho buyer từ escrow order ${escrow.order_id}`,
          ref_order_id: escrow.order_id,
        },
      });
    }

    // 3. Xử lý ví buyer: tăng balance, log ESCROW_REFUND (dương tiền)
    let buyerWallet = await tx.wallet.findUnique({
      where: { user_id: escrow.buyer_id },
    });

    if (!buyerWallet) {
      buyerWallet = await tx.wallet.create({
        data: { user_id: escrow.buyer_id },
      });
    }

    await tx.wallet.update({
      where: { wallet_id: buyerWallet.wallet_id },
      data: {
        balance: { increment: escrow.amount },
      },
    });

    await tx.walletTransaction.create({
      data: {
        wallet_id: buyerWallet.wallet_id,
        type: WalletTxType.ESCROW_REFUND,
        status: WalletTxStatus.COMPLETED,
        amount: escrow.amount,
        description: `Nhận hoàn tiền escrow cho order ${escrow.order_id}`,
        ref_order_id: escrow.order_id,
      },
    });

    // 4. Cập nhật trạng thái escrow
    const updatedEscrow = await tx.escrow.update({
      where: { escrow_id: escrowId },
      data: {
        status: "REFUNDED",
        released_at: new Date(),
        release_note: note ?? undefined,
      },
    });

    return updatedEscrow;
  });
}


/**
 * Admin: gia hạn thời gian giam
 */
export async function adminExtendEscrow(
  escrowId: string,
  extraDays: number,
  note?: string | null
) {
  const escrow = await prisma.escrow.findUnique({
    where: { escrow_id: escrowId },
  });

  if (!escrow) {
    throw new Error("Escrow không tồn tại");
  }

  const baseReleaseAt = escrow.release_at ?? escrow.created_at;
  const newReleaseAt = new Date(
    baseReleaseAt.getTime() + extraDays * 24 * 60 * 60 * 1000
  );

  return prisma.escrow.update({
    where: { escrow_id: escrowId },
    data: {
      release_at: newReleaseAt,
    },
  });
}
