// be/src/controllers/sellerVerification.controller.ts

import { Request, Response } from "express";
import { SellerVerificationService } from "../services/sellerVerification.service";
import { SellerVerificationStatus } from "@prisma/client";

export class SellerVerificationController {
  // 🟢 Buyer tạo yêu cầu
  static async create(req: any, res: Response) {
    try {
      const user = req.user; // lấy từ verifyToken
      if (!user || !user.user_id) {
        return res
          .status(401)
          .json({ message: "Không xác định được người dùng." });
      }

      const {
        full_name,
        phone_number,
        id_number,
        bank_name,
        bank_user_name,
        bank_account,
        shop_description,
        front_image_url,
        back_image_url,
      } = req.body;

      if (
        !full_name ||
        !id_number ||
        !bank_name ||
        !bank_user_name ||
        !bank_account ||
        !front_image_url ||
        !back_image_url
      ) {
        return res.status(400).json({
          message: "Thiếu thông tin required trong form đăng ký seller.",
        });
      }

      const verification =
        await SellerVerificationService.createRequest({
          userId: user.user_id,
          full_name,
          phone_number,
          id_number,
          bank_name,
          bank_user_name,
          bank_account,
          shop_description,
          front_image_url,
          back_image_url,
        });

      return res.status(201).json(verification);
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({
        message:
          err.message ||
          "Không thể tạo yêu cầu Seller. Vui lòng thử lại sau.",
      });
    }
  }

  // 🟢 Buyer xem request mới nhất của chính mình
  static async getMyLatest(req: any, res: Response) {
    try {
      const user = req.user;
      if (!user || !user.user_id) {
        return res
          .status(401)
          .json({ message: "Không xác định được người dùng." });
      }

      const latest =
        await SellerVerificationService.getLatestRequestByUser(
          user.user_id
        );
      if (!latest) {
        return res.status(404).json({
          message: "Bạn chưa có yêu cầu Seller nào.",
        });
      }

      return res.json(latest);
    } catch (err: any) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Lỗi khi lấy yêu cầu Seller mới nhất." });
    }
  }

  // 🟢 Admin: xem tất cả yêu cầu
  static async getAll(_req: Request, res: Response) {
    try {
      const list = await SellerVerificationService.getAllRequests();
      return res.json(list);
    } catch (err: any) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Không thể lấy danh sách yêu cầu Seller." });
    }
  }

  // 🟢 Admin: approve yêu cầu
  static async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Thiếu id yêu cầu." });
      }

      const updated = await SellerVerificationService.updateStatus({
        id,
        status: SellerVerificationStatus.APPROVED,
      });

      return res.json(updated);
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({
        message: err.message || "Không thể duyệt yêu cầu.",
      });
    }
  }

  // 🟢 Admin: reject yêu cầu (kèm lý do)
  static async reject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { admin_note } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Thiếu id yêu cầu." });
      }
      if (!admin_note || !admin_note.trim()) {
        return res
          .status(400)
          .json({ message: "Vui lòng nhập lý do từ chối." });
      }

      const updated = await SellerVerificationService.updateStatus({
        id,
        status: SellerVerificationStatus.REJECTED,
        admin_note: admin_note.trim(),
      });

      return res.json(updated);
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({
        message: err.message || "Không thể từ chối yêu cầu.",
      });
    }
  }
}
