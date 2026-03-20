import { Request, Response } from "express";
import * as reviewService from "../services/review.service";

export const getByDataset = async (req: Request, res: Response) => {
  try {
    const data = await reviewService.getByDataset(req.params.datasetId);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const data = await reviewService.getById(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const user = req.user as any; // lấy từ VerifyToken middleware
    const data = await reviewService.create(user.user_id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const data = await reviewService.update(user.user_id, req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const data = await reviewService.remove(req.user as any, req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const reply = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const data = await reviewService.reply(user.user_id, req.params.id, req.body.reply);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
