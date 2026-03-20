import { Router } from "express";
import * as categoryController from "../controllers/Category.controller";
import { verifyToken, requireRole } from "../middleware/VerifyToken";

const router = Router();

// Public
router.get("/", categoryController.getAll);
router.get("/:id", categoryController.getById);

// Admin mới được quản lý category
router.post("/", verifyToken, requireRole(["admin"]), categoryController.create);
router.put("/:id", verifyToken, requireRole(["admin"]), categoryController.update);
router.delete("/:id", verifyToken, requireRole(["admin"]), categoryController.remove);

export default router;
