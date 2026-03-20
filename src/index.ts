import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import cookieParser from "cookie-parser";

// 🧩 Import Routes
import loginRouter from "./routes/login.route";
import register from "./routes/register.route";
import dataset from "./routes/dataset.route";
import category from "./routes/category.route";
import user from "./routes/user.route";
import tag from "./routes/tag.route";
import transaction from "./routes/transaction.route";
import order from "./routes/order.route";
import review from "./routes/review.route";
import chat from "./routes/chat.route";
import seller from "./routes/seller.routes";
import uploadRouter from "./routes/upload.route";
import sellerUploadRouter from "./routes/sellerUpload.route";
import aiSearch from "./routes/aiSearch.route";
import walletRoutes from "./routes/wallet.route";
import payosRoutes from "./routes/payos.route";
import escrowRoutes from "./routes/escrow.route";
import withdrawRoutes from "./routes/withdraw.route";
import complaintRoute from "./routes/complaint.route";
import { payosWebhook } from "./controllers/payos.controller";

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3001; // ✅ Sử dụng port động cho Deploy

// 🛠️ Webhook phải đặt TRƯỚC express.json() nếu nó cần raw body
app.post("/api/payos/webhook", // ✅ Thêm /api cho đồng bộ
    express.raw({ type: "*/*" }),
    payosWebhook
);

// ✅ Cấu hình CORS linh hoạt cho cả Local và Deploy
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://open-data-martket.vercel.app" // ✅ Domain của bạn trên Vercel
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);

// ✅ Gom tất cả Routes vào một Router duy nhất với tiền tố /api
const apiRouter = express.Router();

apiRouter.use("/", loginRouter);
apiRouter.use("/", register);
apiRouter.use("/user", user);
apiRouter.use("/dataset", dataset);
apiRouter.use("/category", category);
apiRouter.use("/tag", tag);
apiRouter.use("/transaction", transaction);
apiRouter.use("/order", order);
apiRouter.use("/review", review);
apiRouter.use("/chat", chat);
apiRouter.use("/seller", seller);
apiRouter.use("/ai", aiSearch);
apiRouter.use("/wallet", walletRoutes);
apiRouter.use("/escrow", escrowRoutes);
apiRouter.use("/withdraw", withdrawRoutes);
apiRouter.use("/payos", payosRoutes);
apiRouter.use("/complaints", complaintRoute);
apiRouter.use("/upload", uploadRouter);
apiRouter.use("/seller-upload", sellerUploadRouter);

// ✅ Gắn apiRouter vào app với prefix /api
// Mọi request sẽ là: domain.com/api/order, domain.com/api/wallet...
app.use("/api", apiRouter);

// ⚙️ Static file
app.use("/upload", express.static(path.join(__dirname, "../public/upload")));

// ✅ Khởi tạo HTTP Server
const server = http.createServer(app);

// ✅ Initialize Socket.IO với CORS động
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// 🔐 Middleware xác thực Socket.IO
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Missing token"));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecretkey");
        (socket as any).user = decoded;
        next();
    } catch (err) {
        next(new Error("Invalid token"));
    }
});

const onlineUsers = new Map<string, string>();

io.on("connection", (socket) => {
    const user = (socket as any).user;
    console.log(`✅ User connected: ${user.user_id} (${user.role})`);
    onlineUsers.set(user.user_id, socket.id);

    socket.on("send_message", async (data) => {
        const { conversation_id, content } = data;
        const message = await prisma.message.create({
            data: {
                conversation_id,
                sender_id: user.user_id,
                content,
            },
        });

        const convo = await prisma.conversation.findUnique({
            where: { id: conversation_id },
        });
        if (!convo) return;

        const receiverId = convo.buyer_id === user.user_id ? convo.seller_id : convo.buyer_id;
        const receiverSocket = onlineUsers.get(receiverId);
        if (receiverSocket) {
            io.to(receiverSocket).emit("receive_message", message);
        }
        socket.emit("message_sent", message);
    });

    socket.on("disconnect", () => {
        console.log(`❌ User disconnected: ${user.user_id}`);
        onlineUsers.delete(user.user_id);
    });
});

// ✅ Server Listen
server.listen(port, () => {
    console.log(`🚀 Server running at port ${port}`);
});

// // ✅ Khởi động server
// server.listen(port, () => {
//     console.log(`🚀 Server running at http://localhost:${port}`);
// });
export default app;