import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { verifyToken, requireRole } from "../middleware/VerifyToken";

const router = Router();

// 🧭 Endpoint cho user hiện tại
router.get("/me", verifyToken, userController.getProfile);

router.patch("/me", verifyToken, userController.updateProfile);


// 📌 Lấy tất cả user (chỉ admin)
router.get("/", verifyToken, requireRole(["admin"]), userController.getAll);

// 📌 Lấy 1 user theo user_id
router.get("/:id", verifyToken, requireRole(["buyer", "seller", "admin"]), userController.getById);

// 📌 Tạo user (đăng ký) → public, không cần token
router.post("/", userController.create);

// 📌 Cập nhật user
router.put("/:id", verifyToken, requireRole(["buyer", "seller", "admin"]), userController.update);

// 📌 Xóa user (chỉ admin)
router.delete("/:id", verifyToken, requireRole(["admin"]), userController.remove);

export default router;
