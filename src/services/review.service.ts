import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Lấy review theo dataset
export const getByDataset = async (datasetId: string) => {
  return await prisma.review.findMany({
    where: { dataset_id: datasetId },
    include: {
      buyer: {
        select: { full_name: true, email: true }
      }
    },
    orderBy: { created_at: "desc" }
  });
};

// Lấy review theo id
export const getById = async (id: string) => {
  return await prisma.review.findUnique({
    where: { review_id: id }
  });
};

// Buyer tạo review
export const create = async (buyerId: string, data: any) => {
  const { dataset_id, rating, comment } = data;

  if (rating < 1 || rating > 5) {
    throw new Error("Rating phải từ 1 đến 5");
  }

  // Buyer phải có order COMPLETED hoặc RELEASED
const order = await prisma.order.findFirst({
  where: {
    buyer_id: buyerId,
    dataset_id,
    status: { in: ["completed"] },
  },
});

  if (!order) {
    throw new Error("Bạn chưa mua dataset này, nên không thể đánh giá.");
  }

  // Không cho review hai lần cùng đơn hàng
  const existed = await prisma.review.findFirst({
    where: { order_id: order.order_id }
  });

  if (existed) {
    throw new Error("Bạn đã đánh giá đơn hàng này rồi.");
  }

  return await prisma.review.create({
    data: {
      buyer_id: buyerId,
      dataset_id,
      order_id: order.order_id,
      rating,
      comment
    }
  });
};

// Buyer sửa review
export const update = async (buyerId: string, reviewId: string, data: any) => {
  const review = await prisma.review.findUnique({
    where: { review_id: reviewId }
  });

  if (!review) throw new Error("Review không tồn tại");

  if (review.buyer_id !== buyerId) {
    throw new Error("Bạn không có quyền sửa review này");
  }

  return await prisma.review.update({
    where: { review_id: reviewId },
    data
  });
};

// Buyer/Admin xoá review
export const remove = async (user: any, reviewId: string) => {
  const review = await prisma.review.findUnique({
    where: { review_id: reviewId }
  });

  if (!review) throw new Error("Review không tồn tại");

  // Admin xoá tất cả
  if (user.role === "admin") {
    return await prisma.review.delete({ where: { review_id: reviewId } });
  }

  // Buyer xoá của chính họ
  if (user.role === "buyer" && user.user_id === review.buyer_id) {
    return await prisma.review.delete({ where: { review_id: reviewId } });
  }

  throw new Error("Không có quyền xoá review");
};

// Seller trả lời review
export const reply = async (sellerId: string, reviewId: string, reply: string) => {
  const review = await prisma.review.findUnique({
    where: { review_id: reviewId }
  });

  if (!review) throw new Error("Review không tồn tại");

  const dataset = await prisma.dataset.findUnique({
    where: { dataset_id: review.dataset_id }
  });

  if (!dataset || dataset.seller_id !== sellerId) {
    throw new Error("Bạn không thể trả lời review này");
  }

  return await prisma.review.update({
    where: { review_id: reviewId },
    data: { reply }
  });
};
