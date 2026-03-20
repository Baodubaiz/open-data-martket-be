import { Router } from "express";
import * as walletController from "../controllers/wallet.controller";
import { verifyToken, requireRole } from "../middleware/VerifyToken";

const router = Router();

// user
router.get("/me", verifyToken, walletController.getMe);
router.post("/topup", verifyToken, walletController.createTopup);

// admin
router.get(
  "/",
  verifyToken,
  requireRole(["admin"]),
  walletController.adminGetAllWallets,
);
router.post(
  "/admin/adjust",
  verifyToken,
  requireRole(["admin"]),
  walletController.adminAdjustWallet,
);

export default router;
