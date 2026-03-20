// be/src/services/sellerVerification.service.ts

import {
  PrismaClient,
  SellerVerificationStatus,
  Role,
} from "@prisma/client";
import {
  runSellerVerificationAI,
  SellerVerificationAIResult,
} from "./sellerVerificationAi.service";

const prisma = new PrismaClient();

export class SellerVerificationService {
  // 🟢 Buyer: kiểm tra đang có request PENDING chưa
  static async getActiveRequestByUser(userId: string) {
    return prisma.sellerVerification.findFirst({
      where: {
        user_id: userId,
        status: SellerVerificationStatus.PENDING,
      },
    });
  }

  // 🟢 Buyer: tạo request mới (gọi AI + lưu vào DB)
  static async createRequest(params: {
    userId: string;
    full_name: string;
    phone_number?: string;
    id_number: string;
    bank_name: string;
    bank_user_name: string;
    bank_account: string;
    shop_description?: string;
    front_image_url: string;
    back_image_url: string;
  }) {
    // Không cho tạo nếu đang có request PENDING
    const existing = await this.getActiveRequestByUser(params.userId);
    if (existing) {
      throw new Error(
        "Bạn đang có một yêu cầu Seller đang chờ xét duyệt."
      );
    }

    // 🧠 Gọi AI đánh giá hồ sơ
    let aiResult: SellerVerificationAIResult | null = null;
    try {
      aiResult = await runSellerVerificationAI({
        full_name: params.full_name,
        id_number: params.id_number,
        phone_number: params.phone_number,
        bank_name: params.bank_name,
        bank_user_name: params.bank_user_name,
        bank_account: params.bank_account,
        shop_description: params.shop_description,
        front_image_url: params.front_image_url,
        back_image_url: params.back_image_url,
      });
    } catch (err) {
      console.error(
        "[SellerVerificationService] Lỗi khi gọi AI:",
        err
      );
      aiResult = null; // vẫn cho tạo request bình thường
    }

    const verification = await prisma.sellerVerification.create({
      data: {
        user_id: params.userId,
        full_name: params.full_name,
        phone_number: params.phone_number ?? null,
        id_number: params.id_number,
        bank_name: params.bank_name,
        bank_user_name: params.bank_user_name,
        bank_account: params.bank_account,
        shop_description: params.shop_description ?? null,
        front_image_url: params.front_image_url,
        back_image_url: params.back_image_url,
        status: SellerVerificationStatus.PENDING,

        // 🧠 Lưu kết quả AI vào 2 cột trong Prisma
        ai_score: aiResult?.score ?? null,
        ai_analysis: aiResult?.analysis ?? null,
        // admin_note & reviewed_at để null, khi admin duyệt mới set
      },
    });

    return verification;
  }

  // 🟢 Buyer: lấy request mới nhất của mình (bất kể status)
  static async getLatestRequestByUser(userId: string) {
    return prisma.sellerVerification.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
            full_name: true,
          },
        },
      },
    });
  }

  // 🟢 Admin: lấy tất cả request
  static async getAllRequests() {
    return prisma.sellerVerification.findMany({
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
            full_name: true,
          },
        },
      },
    });
  }

  // 🟢 Admin: cập nhật status (APPROVED / REJECTED)
  static async updateStatus(params: {
    id: string;
    status: SellerVerificationStatus;
    admin_note?: string;
  }) {
    const { id, status, admin_note } = params;

    // Cập nhật record
    const verification = await prisma.sellerVerification.update({
      where: { id },
      data: {
        status,
        admin_note: admin_note ?? null,
        reviewed_at: new Date(),
      },
    });

    // Nếu APPROVED → chuyển role user thành seller
    if (status === SellerVerificationStatus.APPROVED) {
      await prisma.user.update({
        where: { user_id: verification.user_id },
        data: {
          role: Role.seller,
        },
      });
    }

    return verification;
  }
}
