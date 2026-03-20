import { Router } from "express";
import * as datasetController from "../controllers/Dataset.controller";
import { verifyToken, requireRole } from "../middleware/VerifyToken";
import { uploadBoth } from "../utils/uploadBoth";

const router = Router();

// 🟢 Public: ai cũng xem được dataset
router.get("/active", datasetController.getAllActive);
router.get("/:id", datasetController.getById);

router.get("/:id/preview", datasetController.getPreview);
router.get("/:id/download", datasetController.downloadFile);
router.get("/:id/sample", datasetController.downloadSample);

// 🔒 Seller/Admin: có quyền quản lý dataset
router.get("/", verifyToken, requireRole(["seller", "admin"]), datasetController.getAll);
router.post("/", verifyToken, requireRole(["seller", "admin"]), uploadBoth, datasetController.create);
router.put("/:id", verifyToken, requireRole(["seller", "admin"]), uploadBoth, datasetController.update);
router.delete("/:id", verifyToken, requireRole(["seller", "admin"]), datasetController.remove);

// 🧩 Seller: lấy tất cả dataset của chính mình
router.get("/seller/:sellerId", datasetController.getBySellerId);
// 🧩 Seller: lấy tất cả dataset của chính mình theo tên (tìm kiếm gần đúng)
router.get("/seller/name/:sellerName", datasetController.getBySellerName);
export default router;
