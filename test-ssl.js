const tls = require("tls");

const socket = tls.connect(
  {
    host: "sandbox-api.payos.vn",
    port: 443,
    servername: "sandbox-api.payos.vn"
  },
  () => {
    console.log("SSL CONNECTED OK!");
    socket.end();
  }
);

socket.on("error", err => {
  console.error("SSL ERROR:", err);
});
