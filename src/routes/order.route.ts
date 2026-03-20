import { Router } from "express";
import * as orderController from "../controllers/Order.controller";
import { verifyToken, requireRole } from "../middleware/VerifyToken";

const router = Router();

// GET all orders
router.get("/", verifyToken, requireRole(["buyer", "seller", "admin"]), orderController.getAll);

// GET one order
router.get("/:id", verifyToken, requireRole(["buyer", "seller", "admin"]), orderController.getById);

// CREATE order (buyer)
router.post("/", verifyToken, requireRole(["buyer"]), orderController.create);

// UPDATE order (admin, seller)
router.put("/:id", verifyToken, requireRole(["admin", "seller"]), orderController.update);

// DELETE order (admin)
router.delete("/:id", verifyToken, requireRole(["admin"]), orderController.remove);

export default router;
