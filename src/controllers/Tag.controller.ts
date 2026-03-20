import { Request, Response } from "express";
import * as tagService from "../services/Tag.service";

// 📌 Lấy tất cả tag
export const getAll = async (req: Request, res: Response) => {
  try {
    const tags = await tagService.getAll();
    res.json(tags);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Lấy 1 tag theo id
export const getById = async (req: Request, res: Response) => {
  try {
    const tag = await tagService.getById(req.params.id);
    res.json(tag);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Tạo tag (seller + admin)
export const create = async (req: Request, res: Response) => {
  try {
    const newTag = await tagService.create(req.body);
    res.json(newTag);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Cập nhật tag (seller + admin)
export const update = async (req: Request, res: Response) => {
  try {
    const updated = await tagService.update(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Xóa tag (admin)
export const remove = async (req: Request, res: Response) => {
  try {
    const deleted = await tagService.remove(req.params.id);
    res.json(deleted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
