// be/src/controllers/wallet.controller.ts
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/VerifyToken";
import * as walletService from "../services/wallet.service";

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const data = await walletService.getMyWallet(req.user!);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const createTopup = async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;
    const link = await walletService.createTopupLink(
      req.user!,
      Number(amount),
    );
    res.json(link);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const adminGetAllWallets = async (req: AuthRequest, res: Response) => {
  try {
    const wallets = await walletService.adminGetAllWallets();
    res.json(wallets);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const adminAdjustWallet = async (req: AuthRequest, res: Response) => {
  try {
    const { user_id, amountDelta, reason } = req.body;
    const updated = await walletService.adminAdjustWallet(
      user_id,
      Number(amountDelta),
      reason,
    );
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};
