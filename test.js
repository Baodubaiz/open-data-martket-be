const https = require("https");

https.get("https://sandbox-api.payos.vn/v2/payment-requests", (res) => {
  console.log("STATUS:", res.statusCode);
}).on("error", (err) => {
  console.error("ERROR:", err);
});
