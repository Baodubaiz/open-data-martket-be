const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");

// Proxy bypass firewall
const proxy = "http://51.159.66.43:3128";
const agent = new HttpsProxyAgent(proxy);

axios.get("https://sandbox-api.payos.vn/v2/payment-requests", {
    httpsAgent: agent,
    timeout: 15000,
})
.then((res) => {
    console.log("KẾT QUẢ:", res.status, res.data);
})
.catch((err) => {
    console.error("LỖI:", err.message);
});
