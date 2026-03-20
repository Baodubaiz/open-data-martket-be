import { Request, Response } from "express";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { createPayOSLink } from "../services/payos.service";
import { AuthRequest } from "../middleware/VerifyToken";
const prisma = new PrismaClient();

function deepSort(obj: any): any {
  return Object.keys(obj)
    .sort()
    .reduce((acc: any, key: string) => {
      let v = obj[key];

      if (v === null || v === undefined) v = "";

      if (typeof v === "object" && !Array.isArray(v)) {
        acc[key] = deepSort(v);
      } else if (Array.isArray(v)) {
        acc[key] = v.map((item) =>
          typeof item === "object" ? deepSort(item) : item
        );
      } else {
        acc[key] = v;
      }

      return acc;
    }, {});
}

function createSignature(data: any, key: string) {
  const sorted = deepSort(data);

  const query = Object.keys(sorted)
    .map((k) => {
      let v = sorted[k];
      if (typeof v === "object") v = JSON.stringify(v);
      if (!v) v = "";
      return `${k}=${v}`;
    })
    .join("&");

  return crypto.createHmac("sha256", key).update(query).digest("hex");
}

export async function payosWebhook(req: Request, res: Response) {
  try {
    console.log("=== WEBHOOK PAYOS ===");

    const raw = req.body?.toString("utf8") || "{}";
    const body = JSON.parse(raw);

    const { data, signature, success } = body;

    if (!data || !signature) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const serverSig = createSignature(data, process.env.PAYOS_CHECKSUM_KEY!);

    if (serverSig !== signature) {
      console.log("❌ Sai chữ ký PayOS");
      return res.status(400).json({ message: "Invalid signature" });
    }

    if (!success || data.code !== "00") {
      console.log("⚠ Thanh toán thất bại");
      return res.status(200).json({ message: "Ignored" });
    }

    const orderCode = String(data.orderCode);
    const amount = Number(data.amount);

    const tx = await prisma.walletTransaction.findFirst({
      where: {
        payos_order_code: orderCode,
        type: "DEPOSIT",
        status: "PENDING",
      },
    });

    if (!tx) {
      console.log("⚠ Không tìm thấy giao dịch PENDING");
      return res.status(200).json({ message: "No pending transaction" });
    }

    await prisma.$transaction(async (db) => {
      await db.wallet.update({
        where: { wallet_id: tx.wallet_id },
        data: {
          balance: { increment: amount },
        },
      });

      await db.walletTransaction.update({
        where: { wallet_tx_id: tx.wallet_tx_id },
        data: {
          status: "COMPLETED",
          description: "Auto nạp tiền thành công ",
          bank_reference: data.reference,
        },
      });
    });

    console.log("✔ NẠP THÀNH CÔNG:", amount);

    return res.status(200).json({ message: "OK" });

  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function createPayOSLinkController(req: AuthRequest, res: Response) {
  try {
    const { amount } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Missing user in token" });
    }

    const userId = req.user.user_id;

    const result = await createPayOSLink(amount, userId);

    return res.status(200).json({
      message: "Create PayOS link success",
      data: result,
    });

  } catch (err) {
    console.error("CREATE LINK ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}