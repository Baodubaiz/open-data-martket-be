import { PrismaClient,ComplaintStatus  } from "@prisma/client";
const prisma = new PrismaClient();

// ==================== CREATE ====================

export async function createComplaint(data: {
  
    order_id: string;
    buyer_id: string;
    seller_id: string;
    reason: string;
    phone: string;
}) {
    return await prisma.complaint.create({ data });
}

// ==================== GET BY ORDER ====================

export async function getComplaintByOrder(orderId: string) {
   console.log("=== SERVICE getComplaintByOrder() ===");
  console.log("orderId nhận vào:", orderId);
    return prisma.complaint.findUnique({
        where: { order_id: orderId },
    });
}

// ==================== SELLER RESPOND ====================

export async function sellerRespond(
    id: string,
    action: "COMPENSATED" | "REQUEST_REFUND"
) {
    return prisma.complaint.update({
        where: { id },
        data: {
            seller_action: action,
            status:
                action === "COMPENSATED"
                    ? "SELLER_COMPENSATED"
                    : "SELLER_REFUND",
        },
    });
}

// ==================== ADMIN REFUND ====================

// =================== ADMIN REFUND =======================
export async function adminRefund(id: string, orderId: string) {
  console.log("===== ADMIN REFUND START =====");
  console.log("Complaint ID:", id);
  console.log("Order ID FE gửi lên:", orderId);

  try {
    // 1. Tìm escrow theo order_id
    console.log("Step 1: Tìm escrow theo order_id...");
    const escrow = await prisma.escrow.findFirst({
       where: { escrow_id: orderId }, 
    });

    console.log("Escrow found:", escrow);

    if (!escrow) {
      console.log("❌ Lỗi: Escrow không tồn tại");
      throw new Error("Escrow not found");
    }

    console.log("Escrow status:", escrow.status);

    // 2. Không cho refund nếu escrow đã RELEASED (seller đã nhận tiền)
    if (escrow.status === "RELEASED") {
      console.log("❌ Lỗi: Escrow đã RELEASED → không thể hoàn tiền");
      throw new Error("Escrow already released, cannot refund");
    }

    // 3. Hoàn tiền cho buyer
    console.log("Step 3: Hoàn tiền cho buyer...");
    console.log("Refunding amount:", escrow.amount);

    const updateBuyer = await prisma.wallet.update({
      where: { user_id: escrow.buyer_id },
      data: { balance: { increment: escrow.amount } },
    });
    const buyerWallet = await prisma.wallet.findUnique({
  where: { user_id: escrow.buyer_id },
});

if (!buyerWallet) {
  throw new Error("Buyer wallet not found");
}

// 3.1 Ghi log giao dịch ví (refund cho buyer)
await prisma.walletTransaction.create({
  data: {
    wallet_id: buyerWallet.wallet_id,
    type: "ADJUST",              // hoặc tạo TYPE mới "REFUND"
    status: "COMPLETED",
    amount: escrow.amount,       // tiền + vào ví
    description: `Admin hoàn tiền đơn hàng ${escrow.order_id}`,
    ref_order_id: escrow.order_id,
  },
});
    console.log("Buyer wallet updated:", updateBuyer);

    // 4. Đánh dấu escrow REFUNDED
    console.log("Step 4: Cập nhật escrow là REFUNDED...");
    const updateEscrow = await prisma.escrow.update({
      where: { escrow_id: escrow.escrow_id },
      data: { status: "REFUNDED" },
    });

    console.log("Escrow updated:", updateEscrow);

    // 5. Cập nhật complaint
    console.log("Step 5: Cập nhật complaint ADMIN_REFUNDED...");
    const updateComplaint = await prisma.complaint.update({
      where: { id },
      data: { status: "ADMIN_REFUNDED" },
    });

    console.log("Complaint updated:", updateComplaint);

    console.log("===== ADMIN REFUND SUCCESS =====");
    return updateComplaint;

  } catch (err: any) {
    console.error("===== ADMIN REFUND ERROR =====");
    console.error("Error message:", err.message);
    console.error("Full error:", err);
    throw err;
  }
}


// Lấy khiếu nại cho Seller
export async function getComplaintsForSeller(sellerId: string) {
  return prisma.complaint.findMany({
    where: { seller_id: sellerId },
    orderBy: { created_at: "desc" },
    include: {
      buyer: { select: { full_name: true } },
      seller: { select: { full_name: true } },
      order: true,
    },
  });
}



// ==================== ADMIN CLOSE ====================

export async function adminCloseComplaint(id: string) {
    return prisma.complaint.update({
        where: { id },
        data: { status: "ADMIN_CLOSED" },
    });
}
export async function getAllComplaints() {
  return prisma.complaint.findMany({
    orderBy: { created_at: "desc" },
  });
}
export async function getAdminComplaints() {
  return prisma.complaint.findMany({
    orderBy: { created_at: "desc" },
    include: {
      buyer: {
        select: { full_name: true, email: true }
      },
      seller: {
        select: { full_name: true, email: true }
      },
      order: {
  include: {
    escrow: true
  }
}

    }
  });
}

export async function updateComplaintStatus(id: string, status: ComplaintStatus) {
  return prisma.complaint.update({
    where: { id },
    data: { status }
  });
}