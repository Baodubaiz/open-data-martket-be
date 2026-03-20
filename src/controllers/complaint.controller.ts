import { Request, Response } from "express";
import * as complaintService from "../services/complaint.service";
import * as escrowService from "../services/escrow.service";
// Đảm bảo bạn đã import AuthRequest từ file middleware của mình
import { AuthRequest } from "../middleware/VerifyToken";

// 🟢 Buyer tạo khiếu nại (Complaint)
export async function create(req: AuthRequest, res: Response) {
  console.log("===== COMPLAINT CREATE START =====");

  try {
    // Check Guard: Giải quyết lỗi 'req.user' is possibly 'undefined'
    if (!req.user) {
      console.log("ERROR: Không có req.user (token sai hoặc thiếu)");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { order_id, seller_id, reason, phone } = req.body;
    const buyer_id = req.user.user_id;

    console.log("Parsed Fields:", { order_id, seller_id, buyer_id, reason, phone });

    const existed = await complaintService.getComplaintByOrder(order_id);
    if (existed) {
      console.log("ERROR: Complaint already exists");
      return res.status(400).json({ message: "Order already has complaint" });
    }

    const created = await complaintService.createComplaint({
      order_id,
      buyer_id,
      seller_id,
      reason,
      phone,
    });

    console.log("COMPLAINT CREATED:", created);
    return res.json(created);

  } catch (err: any) {
    console.error("Complaint create error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// 🟢 Seller phản hồi khiếu nại
export async function sellerRespond(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const updated = await complaintService.sellerRespond(id, action);
    return res.json(updated);
  } catch (err) {
    console.error("Seller respond error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// 🔴 Admin đóng khiếu nại
export async function adminClose(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updated = await complaintService.adminCloseComplaint(id);
    return res.json(updated);
  } catch (err) {
    console.error("Admin close complaint error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// 📋 Lấy danh sách khiếu nại của Seller (Sửa lỗi dòng 81)
export async function getSellerComplaints(req: AuthRequest, res: Response) {
  try {
    // Check Guard: Bắt buộc phải có user mới lấy được ID
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sellerId = req.user.user_id;
    const list = await complaintService.getComplaintsForSeller(sellerId);

    return res.json(list);
  } catch (err) {
    console.error("Get seller complaints error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// 📋 Admin lấy tất cả khiếu nại
export async function getAdminComplaints(_req: Request, res: Response) {
  try {
    const list = await complaintService.getAdminComplaints();
    console.log("BE trả complaint:", JSON.stringify(list, null, 2));
    return res.json(list);
  } catch (err) {
    console.error("Admin load complaint error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// 💰 Admin thực hiện hoàn tiền (Refund)
export async function adminRefundController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { escrow_id } = req.body;

    console.log("=== ADMIN REFUND START ===");
    console.log("Complaint ID:", id);
    console.log("Escrow ID:", escrow_id);

    if (!escrow_id) {
      return res.status(400).json({ message: "Missing escrow_id" });
    }

    const updated = await complaintService.adminRefund(id, escrow_id);

    return res.json({
      success: true,
      complaint: updated,
    });

  } catch (err: any) {
    console.error("Admin refund error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
}