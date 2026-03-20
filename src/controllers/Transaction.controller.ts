import { Request, Response } from "express";
import * as transactionService from "../services/Transaction.service";
import { AuthRequest } from "../middleware/VerifyToken";

// 📌 Lấy tất cả transaction
export const getAll = async (req: AuthRequest, res: Response) => {
  try {
    const txns = await transactionService.getAll();
    res.json(txns);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Lấy transaction theo id (buyer, seller, admin)
export const getById = async (req: AuthRequest, res: Response) => {
  try {
    const txn = await transactionService.getById(req.params.id, req.user!);
    res.json(txn);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Tạo transaction (buyer)
// Tìm đến hàm create của bạn
export const create = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Kiểm tra xem user có tồn tại không (do middleware VerifyToken gắn vào)
    if (!req.user) {
      return res.status(401).json({ message: "Bạn cần đăng nhập!" });
    }

    // 2. TRUYỀN ĐỦ 2 THAM SỐ: req.body VÀ req.user
    const newTxn = await transactionService.create(req.body, req.user);

    res.json(newTxn);
  } catch (err: any) {
    console.error("Lỗi Controller:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// 📌 Cập nhật transaction (admin)
export const update = async (req: AuthRequest, res: Response) => {
  try {
    const updated = await transactionService.update(req.params.id, req.body, req.user!);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Xóa transaction (admin)
export const remove = async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await transactionService.remove(req.params.id);
    res.json(deleted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
