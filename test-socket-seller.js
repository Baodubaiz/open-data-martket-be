const { io } = require("socket.io-client");

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMjkxZjYyNGEtYmI5ZS00YWQ2LWJkMTQtYzJhMTllYjU5MzVlIiwicm9sZSI6InNlbGxlciIsIndhbGxldF9hZGRyZXNzIjoiMHhBYkMxMjM0NTY3MTIzODkwRGVmQUJDMTIzNDc4OTBFRmFiY2EyMzQ1IiwiaWF0IjoxNzYyODQxOTU2LCJleHAiOjE3NjI4NDkxNTZ9.I4dL5ZMwNm-p0jXQ1MKegfAEGUZLm68ytrUF-7SCzvg";
const socket = io("http://localhost:3001", {
    auth: { token },
});

socket.on("connect", () => {
    console.log("✅ Connected with socket id:", socket.id);

    socket.emit("send_message", {
        conversation_id: "c3165d39-d43a-4b14-a772-f6f2770e1e94",
        content: "Xin chào từ seller test 👋",
    });
});

socket.on("message_sent", (msg) => console.log("📨 Sent:", msg));
socket.on("receive_message", (msg) => console.log("💬 Received:", msg));
socket.on("connect_error", (err) => console.error("❌ Error:", err.message));
