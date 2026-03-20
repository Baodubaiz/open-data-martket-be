import { Request, Response } from "express";
import * as complaintService from "../services/complaint.service";
import * as escrowService from "../services/escrow.service";

export async function create(req: Request, res: Response) {
  console.log("===== COMPLAINT CREATE START =====");

  console.log("USER TOKEN:", req.user);
  console.log("BODY FE GỬI LÊN:", req.body);

  try {
    if (!req.user) {
      console.log("ERROR: Không có req.user (token sai)");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { order_id, seller_id, reason, phone } = req.body;
    const buyer_id = req.user.user_id;

    console.log("Parsed Fields:");
    console.log("order_id:", order_id);
    console.log("seller_id:", seller_id);
    console.log("buyer_id:", buyer_id);
    console.log("reason:", reason);
    console.log("phone:", phone);

    const existed = await complaintService.getComplaintByOrder(order_id);
    console.log("CHECK EXISTED COMPLAINT:", existed);

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
export async function getSellerComplaints(req: Request, res: Response) {
    try {
        const sellerId = req.user.user_id;

        const list = await complaintService.getComplaintsForSeller(sellerId);

        return res.json(list);
    } catch (err) {
        console.error("Get seller complaints error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function getAdminComplaints(req: Request, res: Response) {
  try {
    const list = await complaintService.getAdminComplaints();

    console.log("BE trả complaint:", JSON.stringify(list, null, 2));  // <---- THÊM DÒNG NÀY

    return res.json(list);
  } catch (err) {
    console.error("Admin load complaint error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}


// PATCH /complaints/:id/admin/refund
export async function adminRefundController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { escrow_id } = req.body; // FE gửi escrow_id

    console.log("ADMIN REFUND:");
    console.log("Complaint ID:", id);
    console.log("Escrow ID:", escrow_id);
     console.log("=== ADMIN REFUND START ===");
  console.log("Complaint ID:", req.params.id);
  console.log("BODY:", req.body);

    if (!escrow_id) {
      return res.status(400).json({ message: "Missing escrow_id" });
    }

    // Gọi service refund đúng (service hiện tại dùng escrow_id)
    const updated = await complaintService.adminRefund(id, escrow_id);

    return res.json({
      success: true,
      complaint: updated,
    });

  } catch (err: any) {
    console.error("Admin refund error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
