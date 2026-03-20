import { Request, Response } from "express";
import * as chatService from "../services/chat.service";
import { AuthRequest } from "../middleware/VerifyToken";

// 🧩 Tạo hoặc lấy conversation
export const createConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { seller_id } = req.body;
        const convo = await chatService.createOrGetConversation(req.user!.user_id, seller_id);
        res.status(201).json({ success: true, data: convo });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 📋 Lấy danh sách conversation của user
export const getConversations = async (req: AuthRequest, res: Response) => {
    try {
        const convos = await chatService.getUserConversations(req.user!.user_id, req.user!.role);
        res.json({ success: true, data: convos });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 💬 Gửi tin nhắn
export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { conversation_id, content } = req.body;
        const message = await chatService.sendMessage(conversation_id, req.user!.user_id, content);
        res.status(201).json({ success: true, data: message });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 📜 Lấy tin nhắn theo conversation
export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; // ✅ key chính xác
        const messages = await chatService.getMessagesByConversation(id);
        res.json({ success: true, data: messages });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ✅ Đánh dấu tin nhắn đã đọc
export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await chatService.markMessageAsRead(id, req.user!.user_id);
        res.json({ success: true, message: "Message marked as read" });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

