import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Cấu hình nơi lưu file: /be/public/upload/seller
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, "../public/upload/seller");
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({ storage });

// POST /api/upload/seller-images
router.post(
  "/seller-images",
  upload.fields([
    { name: "front_image", maxCount: 1 },
    { name: "back_image", maxCount: 1 },
  ]),
  (req, res) => {
    const files = req.files as {
      [field: string]: Express.Multer.File[];
    };

    const frontFile = files["front_image"]?.[0];
    const backFile = files["back_image"]?.[0];

    if (!frontFile || !backFile) {
      return res.status(400).json({ message: "Thiếu file ảnh." });
    }

    // /upload đang được serve static ở index.ts
    const frontUrl = `/upload/seller/${frontFile.filename}`;
    const backUrl = `/upload/seller/${backFile.filename}`;

    return res.json({
      front_image_url: `http://localhost:3001${frontUrl}`,
      back_image_url: `http://localhost:3001${backUrl}`,
    });
  }
);

export default router;
