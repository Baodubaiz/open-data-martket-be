import { PrismaClient } from "@prisma/client";
import { UserPayload } from "../middleware/VerifyToken";

const prisma = new PrismaClient();

// Lấy tất cả transaction
export const getAll = async () => {
  return await prisma.transaction.findMany();
};

// Lấy transaction theo id (buyer chỉ được xem txn của mình, seller xem txn liên quan đến dataset mình bán, admin xem tất cả)
export const getById = async (id: string, user: UserPayload) => {
  const txn = await prisma.transaction.findUnique({
    where: { transaction_id: id },
    include: {
      order: {
        include: { dataset: true },
      },
    },
  });

  if (!txn) throw new Error("Transaction not found");

  if (user.role === "buyer" && txn.order.buyer_id !== user.user_id) {
    throw new Error("Not allowed");
  }

  if (user.role === "seller" && txn.order.dataset.seller_id !== user.user_id) {
    throw new Error("Not allowed");
  }

  return txn;
};

// Tạo transaction (buyer)
// Thêm UserPayload vào tham số thứ 2
export const create = async (data: any, user: any) => {
  // data chính là req.body gửi từ front-end (chứa order_id)
  // user chính là thông tin người đang đăng nhập

  const order = await prisma.order.findUnique({
    where: { order_id: data.order_id },
  });

  if (!order) throw new Error("Không tìm thấy đơn hàng (Order not found)");

  // Logic kiểm tra: Chỉ buyer của order đó mới được tạo transaction
  if (order.buyer_id !== user.user_id) {
    throw new Error("Bạn không có quyền thanh toán cho đơn hàng này!");
  }

  return await prisma.transaction.create({
    data: {
      ...data,
      // Đảm bảo data chứa đúng các trường trong database
    }
  });
};

// Cập nhật transaction (seller xác nhận, admin toàn quyền)
export const update = async (id: string, data: any, user: UserPayload) => {
  const txn = await prisma.transaction.findUnique({
    where: { transaction_id: id },
    include: { order: { include: { dataset: true } } },
  });

  if (!txn) throw new Error("Transaction not found");

  if (user.role === "seller" && txn.order.dataset.seller_id !== user.user_id) {
    throw new Error("Not allowed");
  }

  return await prisma.transaction.update({
    where: { transaction_id: id },
    data,
  });
};

// Xóa transaction (admin)
export const remove = async (id: string) => {
  return await prisma.transaction.delete({
    where: { transaction_id: id },
  });
};
