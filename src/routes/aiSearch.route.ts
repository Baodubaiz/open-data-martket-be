import { Router } from "express";
import * as aiSearchController from "../controllers/aiSearch.controller";

const router = Router();

// Không cần auth: ai cũng có thể hỏi AI gợi ý dataset
router.post("/search", aiSearchController.search);

export default router;
