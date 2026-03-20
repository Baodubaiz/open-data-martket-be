import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller";
import { verifyToken, requireRole } from "../middleware/VerifyToken";

const router = Router();

// GET all transactions (admin only)
router.get("/", verifyToken, requireRole(["admin"]), transactionController.getAll);

// GET one transaction (buyer, seller, admin)
router.get("/:id", verifyToken, requireRole(["buyer", "seller", "admin"]), transactionController.getById);

// CREATE transaction (buyer)
router.post("/", verifyToken, transactionController.create);

// UPDATE transaction (admin only)
router.put("/:id", verifyToken, requireRole(["admin"]), transactionController.update);

// DELETE transaction (admin only)
router.delete("/:id", verifyToken, requireRole(["admin"]), transactionController.remove);

export default router;
