import { Router } from "express";
import { verifyToken, requireRole } from "../middleware/VerifyToken";
import * as escrowController from "../controllers/escrow.controller";

const router = Router();

// Admin: danh sách escrow
router.get(
  "/admin",
  verifyToken,
  requireRole(["admin"]),
  escrowController.adminGetAll
);

// FE gọi POST /escrow/:id/release
router.post(
  "/:id/release",
  verifyToken,
  requireRole(["admin"]),
  escrowController.adminRelease
);

// FE gọi POST /escrow/:id/refund
router.post(
  "/:id/refund",
  verifyToken,
  requireRole(["admin"]),
  escrowController.adminRefund
);

// FE gọi POST /escrow/:id/extend
router.post(
  "/:id/extend",
  verifyToken,
  requireRole(["admin"]),
  escrowController.adminExtend
);

// Seller xem escrow của mình
router.get(
  "/seller",
  verifyToken,
  requireRole(["seller"]),
  escrowController.sellerGetMyEscrow
);

export default router;
