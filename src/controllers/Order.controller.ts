import { Request, Response } from "express";
import * as orderService from "../services/Order.service";
import { AuthRequest } from "../middleware/VerifyToken";

// 📌 Lấy tất cả order (admin xem tất cả, buyer/seller chỉ xem order liên quan)
export const getAll = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await orderService.getAll(req.user!);
    res.json(orders);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// 📌 Lấy order theo id
export const getById = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Kiểm tra req.user TRƯỚC khi gọi service để tránh lỗi 'undefined'
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: Vui lòng đăng nhập" });
    }

    // 2. Bây giờ TypeScript đã biết chắc chắn req.user tồn tại
    const order = await orderService.getById(req.params.id, req.user);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json(order);

  } catch (err: any) {
    // 3. Log lỗi ra terminal để bạn dễ debug
    console.error("❌ Error in getById:", err.message);
    return res.status(400).json({ error: err.message });
  }
};

// 📌 Tạo order (buyer)
export const create = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }

    if (req.user.role !== "buyer") {
      return res.status(403).json({ message: "Only buyers can create orders" });
    }

    if (!req.body.dataset_id) {
       return res.status(400).json({ message: "Thiếu dữ liệu: dataset_id" });
    }

    // Gửi đúng user_id vào service
    const newOrder = await orderService.create(req.body, req.user.user_id);
    res.json(newOrder);
  } catch (err: any) {
    console.error("❌ Error in createOrder:", err.message);
    res.status(400).json({ message: err.message });
  }
};

// 📌 Cập nhật order (admin có thể chỉnh sửa status, seller chỉ xem)
export const update = async (req: AuthRequest, res: Response) => {
  try {
    const updated = await orderService.update(req.params.id, req.body, req.user!);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// 📌 Xóa order (admin)
export const remove = async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await orderService.remove(req.params.id);
    res.json(deleted);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
