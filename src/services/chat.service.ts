import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 🧩 Tạo hoặc lấy conversation giữa buyer và seller
export const createOrGetConversation = async (buyerId: string, sellerId: string) => {
    let convo = await prisma.conversation.findFirst({
        where: { buyer_id: buyerId, seller_id: sellerId },
    });
    if (!convo) {
        convo = await prisma.conversation.create({
            data: { buyer_id: buyerId, seller_id: sellerId },
        });
    }
    return convo;
};

// 📋 Lấy tất cả conversation của user
export const getUserConversations = async (userId: string, role: string) => {
    if (role === "buyer") {
        return await prisma.conversation.findMany({
            where: { buyer_id: userId },
            include: { seller: true, messages: { take: 1, orderBy: { created_at: "desc" } } },
        });
    }
    if (role === "seller") {
        return await prisma.conversation.findMany({
            where: { seller_id: userId },
            include: { buyer: true, messages: { take: 1, orderBy: { created_at: "desc" } } },
        });
    }
};

// 💬 Gửi tin nhắn mới
export const sendMessage = async (conversationId: string, senderId: string, content: string) => {
    return await prisma.message.create({
        data: { conversation_id: conversationId, sender_id: senderId, content },
    });
};

// 📜 Lấy danh sách tin nhắn của 1 conversation
export const getMessagesByConversation = async (conversationId: string) => {
    return await prisma.message.findMany({
        where: { conversation_id: conversationId },
        orderBy: { created_at: "asc" },
    });
};


export const markMessageAsRead = async (messageId: string, userId: string) => {
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { conversation: true },
    });

    if (!message) throw new Error("Message not found");

    // Buyer chỉ được đánh dấu tin của mình, tương tự với seller
    if (
        message.conversation.buyer_id !== userId &&
        message.conversation.seller_id !== userId
    ) {
        throw new Error("Not authorized to mark this message");
    }

    await prisma.message.update({
        where: { id: messageId },
        data: { is_read: true },
    });
};
