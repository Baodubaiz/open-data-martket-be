import { Router } from "express";
import { verifyToken, requireRole } from "../middleware/VerifyToken";
import * as withdrawController from "../controllers/withdraw.controller";

const router = Router();

// Seller tạo & xem yêu cầu rút tiền của mình
router.post(
  "/",
  verifyToken,
  requireRole(["seller"]),
  withdrawController.create,
);

router.get(
  "/me",
  verifyToken,
  requireRole(["seller"]),
  withdrawController.getMyRequests,
);

// Admin quản lý tất cả yêu cầu rút
router.get(
  "/admin",
  verifyToken,
  requireRole(["admin"]),
  withdrawController.adminGetAll,
);

router.post(
  "/admin/approve",
  verifyToken,
  requireRole(["admin"]),
  withdrawController.adminApprove,
);

router.post(
  "/admin/reject",
  verifyToken,
  requireRole(["admin"]),
  withdrawController.adminReject,
);

export default router;
