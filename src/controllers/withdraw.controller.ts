// be/src/controllers/withdraw.controller.ts
import { Response } from "express";
import { AuthRequest } from "../middleware/VerifyToken";
import * as withdrawService from "../services/withdraw.service";

export const create = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, note } = req.body;
    const withdraw = await withdrawService.createWithdrawRequest(
      req.user!,
      Number(amount),
      note,
    );
    res.json(withdraw);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getMyRequests = async (req: AuthRequest, res: Response) => {
  try {
    const list = await withdrawService.getMyWithdrawRequests(req.user!);
    res.json(list);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const adminGetAll = async (req: AuthRequest, res: Response) => {
  try {
    const list = await withdrawService.adminGetAllWithdrawRequests();
    res.json(list);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const adminApprove = async (req: AuthRequest, res: Response) => {
  try {
    const { withdraw_id } = req.body;
    if (!withdraw_id)
      return res.status(400).json({ error: "Thiếu withdraw_id" });

    const result = await withdrawService.adminApproveWithdraw(
      withdraw_id,
      req.user!.user_id,
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const adminReject = async (req: AuthRequest, res: Response) => {
  try {
    const { withdraw_id, note } = req.body;
    if (!withdraw_id)
      return res.status(400).json({ error: "Thiếu withdraw_id" });

    const result = await withdrawService.adminRejectWithdraw(
      withdraw_id,
      req.user!.user_id,
      note,
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
