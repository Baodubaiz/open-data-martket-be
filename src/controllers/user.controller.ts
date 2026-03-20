import { Request, Response } from "express";
import * as userService from "../services/user.services";

// 📌 Lấy tất cả user (admin only)
export const getAll = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAll();
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📌 Lấy user theo id
export const getById = async (req: Request, res: Response) => {
  try {
    const targetId = req.params.id;
    const currentUser = (req as any).user;

    // buyer/seller chỉ được xem chính mình
    if (["buyer", "seller"].includes(currentUser.role) && currentUser.user_id !== targetId) {
      return res.status(403).json({ message: "Forbidden: cannot view others" });
    }

    const user = await userService.getById(targetId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📌 Tạo user (đăng ký)
export const create = async (req: Request, res: Response) => {
  try {
    const newUser = await userService.create(req.body);
    res.json({ success: true, data: newUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📌 Cập nhật user
export const update = async (req: Request, res: Response) => {
  try {
    const targetId = req.params.id;
    const currentUser = (req as any).user;

    if (["buyer", "seller"].includes(currentUser.role) && currentUser.user_id !== targetId) {
      return res.status(403).json({ message: "Forbidden: cannot update others" });
    }

    const updatedUser = await userService.update(targetId, req.body);
    res.json({ success: true, data: updatedUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📌 Xóa user (admin only)
export const remove = async (req: Request, res: Response) => {
  try {
    const deletedUser = await userService.remove(req.params.id);
    res.json({ success: true, data: deletedUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📌 Lấy thông tin chính user (Profile)
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.user_id;
    const user = await userService.getById(userId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📌 Cập nhật thông tin chính user (Profile)
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.user_id;

    const updatedUser = await userService.update(userId, req.body);

    res.json({ success: true, data: updatedUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

