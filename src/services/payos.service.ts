import { PrismaClient } from "@prisma/client";
import { PayOS } from "@payos/node";

const prisma = new PrismaClient();

// ✅ Sửa lỗi "Expected 0-1 arguments, but got 3"
const payOS = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID!,
  apiKey: process.env.PAYOS_API_KEY!,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
});

export async function createPayOSLink(amount: number, userId: string) {
  try {
    // 1. Tạo orderCode duy nhất (tối đa 10 chữ số)
    const orderCode = Number(String(Date.now()).slice(-9));

    // 2. Lấy URL frontend từ biến môi trường
    const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

    // 3. Kiểm tra ví
    const wallet = await prisma.wallet.findUnique({
      where: { user_id: userId },
    });

    if (!wallet) throw new Error("Wallet not found");

    // 4. Lưu transaction tạm thời
    await prisma.walletTransaction.create({
      data: {
        wallet_id: wallet.wallet_id,
        amount,
        type: "DEPOSIT",
        status: "PENDING",
        payos_order_code: String(orderCode),
        description: `Nạp tiền ODM user ${userId}`,
      },
    });

    // 5. Build body gửi PayOS
    const body: any = {
      orderCode,
      amount,
      description: "Nạp tiền vào ví ODM",
      cancelUrl: `${CLIENT_URL}/wallet`,
      returnUrl: `${CLIENT_URL}/wallet`,
    };

    const response = await payOS.paymentRequests.create(body);
    return response;

  } catch (err: any) {
    console.error("PAYOS ERROR:", err.message);
    throw err;
  }
}