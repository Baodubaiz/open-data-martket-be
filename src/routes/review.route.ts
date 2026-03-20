import { Router } from "express";
import { verifyToken, requireRole } from "../middleware/VerifyToken";
import * as controller from "../controllers/review.controller";

const router = Router();

// Lấy review theo dataset
router.get("/dataset/:datasetId", controller.getByDataset);

// Lấy review theo id
router.get("/:id", controller.getById);

// Buyer tạo review
router.post("/", verifyToken, requireRole(["buyer"]), controller.create);

// Buyer sửa review
router.put("/:id", verifyToken, requireRole(["buyer"]), controller.update);

// Buyer xoá hoặc admin xoá review
router.delete("/:id", verifyToken, requireRole(["buyer", "admin"]), controller.remove);

// Seller trả lời review
router.post("/reply/:id", verifyToken, requireRole(["seller"]), controller.reply);

export default router;
