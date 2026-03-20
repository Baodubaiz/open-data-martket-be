import { Request, Response } from "express";
import * as escrowService from "../services/escrow.service";

// ADMIN GET ALL
export async function adminGetAll(req: Request, res: Response) {
  try {
    const list = await escrowService.getAllEscrowForAdmin();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

// ADMIN RELEASE
export async function adminRelease(req: Request, res: Response) {
  try {
    const escrow_id = req.params.id;
    const { note = "" } = req.body;

    const result = await escrowService.adminReleaseEscrow(escrow_id, note);
    res.json({ message: "Giải ngân thành công", result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

// ADMIN REFUND
export async function adminRefund(req: Request, res: Response) {
  try {
    const escrow_id = req.params.id;
    const { note = "" } = req.body;

    const result = await escrowService.adminRefundEscrow(escrow_id, note);
    res.json({ message: "Hoàn tiền thành công", result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

// ADMIN EXTEND
export async function adminExtend(req: Request, res: Response) {
  try {
    const escrow_id = req.params.id;
    const { extraDays, note = "" } = req.body;

    if (!extraDays)
      return res.status(400).json({ message: "Thiếu extraDays" });

    const result = await escrowService.adminExtendEscrow(
      escrow_id,
      Number(extraDays),
      note
    );

    res.json({ message: "Gia hạn thành công", result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

// SELLER GET MY ESCROW
export async function sellerGetMyEscrow(req: Request, res: Response) {
  try {
    const user: any = (req as any).user;
    const sellerId = user.user_id;

    const list = await escrowService.getEscrowForSeller(sellerId);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}
