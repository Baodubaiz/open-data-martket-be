import { Router } from "express";
import * as chatController from "../controllers/chat.controller";
import { verifyToken, requireRole } from "../middleware/VerifyToken";

const router = Router();

// 🧩 Buyer khởi tạo chat với Seller
router.post("/conversations", verifyToken, requireRole(["buyer"]), chatController.createConversation);

// 📋 Lấy danh sách chat (buyer hoặc seller)
router.get("/conversations", verifyToken, requireRole(["buyer", "seller"]), chatController.getConversations);

// 💬 Gửi tin nhắn
router.post("/messages", verifyToken, requireRole(["buyer", "seller"]), chatController.sendMessage);

// 📜 Lấy tất cả tin nhắn của 1 conversation
router.get("/conversations/:id/messages", verifyToken, chatController.getMessages);

router.patch("/messages/:id/read", verifyToken, chatController.markAsRead);

export default router;
