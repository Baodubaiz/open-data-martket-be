import { Router } from "express";
import { SellerVerificationController } from "../controllers/sellerVerification.controller";
import { verifyToken, requireRole } from "../middleware/VerifyToken";

const router = Router();

// Buyer gửi yêu cầu đăng ký seller
router.post(
  "/verification",
  verifyToken,
  requireRole(["buyer"]),
  SellerVerificationController.create
);

// Buyer xem trạng thái yêu cầu mới nhất của mình
router.get(
  "/verification/me",
  verifyToken,
  requireRole(["buyer", "seller", "admin"]),
  SellerVerificationController.getMyLatest
);

// Admin: xem tất cả yêu cầu
router.get(
  "/verification/admin/all",
  verifyToken,
  requireRole(["admin"]),
  SellerVerificationController.getAll
);

// Admin: approve
router.patch(
  "/verification/:id/approve",
  verifyToken,
  requireRole(["admin"]),
  SellerVerificationController.approve
);

// Admin: reject
router.patch(
  "/verification/:id/reject",
  verifyToken,
  requireRole(["admin"]),
  SellerVerificationController.reject
);

export default router;
