import { Router } from "express";
import { verifyToken, requireRole } from "../middleware/VerifyToken";
import * as complaintController from "../controllers/complaint.controller";
import {
  getSellerComplaints,
  getAdminComplaints, 
  adminRefundController,  // ⭐ THÊM DÒNG NÀY
} from "../controllers/complaint.controller";

const router = Router();

router.post("/", verifyToken, requireRole(["buyer"]), complaintController.create);

router.patch("/:id/seller", verifyToken, requireRole(["seller"]), complaintController.sellerRespond);

router.patch("/:id/admin/refund", adminRefundController); 

router.patch("/:id/admin/close", verifyToken, requireRole(["admin"]), complaintController.adminClose);

// Seller list complaints
router.get("/seller", verifyToken, requireRole(["seller"]), getSellerComplaints);

// ⭐ ADMIN LIST COMPLAINTS
router.get("/admin", verifyToken, requireRole(["admin"]), getAdminComplaints);
console.log("Complaint route loaded");
export default router;
