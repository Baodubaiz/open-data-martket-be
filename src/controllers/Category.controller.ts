import { Request, Response } from "express";
import * as categoryService from "../services/Category.service";

// Tạo category
export const create = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.create(req.body);
    res.json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Lấy tất cả categories
export const getAll = async (_req: Request, res: Response) => {
  const categories = await categoryService.getAll();
  res.json(categories);
};

// Lấy 1 category
export const getById = async (req: Request, res: Response) => {
  const category = await categoryService.getById(req.params.id);
  if (!category) return res.status(404).json({ error: "Category not found" });
  res.json(category);
};

// Cập nhật
export const update = async (req: Request, res: Response) => {
  try {
    const category = await categoryService.update(req.params.id, req.body);
    res.json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Xoá
export const remove = async (req: Request, res: Response) => {
  try {
    await categoryService.remove(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
