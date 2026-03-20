import { Router } from "express";
import { payosWebhook, createPayOSLinkController } from "../controllers/payos.controller";
import { verifyToken } from "../middleware/VerifyToken";

const router = Router();

router.post("/create", verifyToken, createPayOSLinkController);
router.post("/webhook", payosWebhook);

export default router;
