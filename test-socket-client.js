const { io } = require("socket.io-client");

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNWIxNjEyMTctZTQ4Yi00YzZjLWJhZjQtMmVkZTEzOWY3YTE2Iiwicm9sZSI6ImJ1eWVyIiwid2FsbGV0X2FkZHJlc3MiOiIweEFiQzEyMzQ1NjcxMjM4OTBEZWZBQkMxMjM0Nzg5MEVGYWJjYTIzNTUiLCJpYXQiOjE3NjI4NDE0MTcsImV4cCI6MTc2Mjg0ODYxN30.Wl3fj-ILEGOw7TPh-gjMBIvYWjD9IX-VGm7BKPsROUM";
const socket = io("http://localhost:3001", {
    auth: { token },
});

socket.on("connect", () => {
    console.log("✅ Connected with socket id:", socket.id);

    socket.emit("send_message", {
        conversation_id: "c3165d39-d43a-4b14-a772-f6f2770e1e94",
        content: "Xin chào từ client test 👋",
    });
});

socket.on("message_sent", (msg) => console.log("📨 Sent:", msg));
socket.on("receive_message", (msg) => console.log("💬 Received:", msg));
socket.on("connect_error", (err) => console.error("❌ Error:", err.message));
