import express from "express";
import { uploadSellerImages } from "../utils/uploadSeller";

const router = express.Router();

// 👉 ĐƯỜNG DẪN ĐÚNG: /seller-upload + /images = /seller-upload/images
router.post("/images", uploadSellerImages, (req, res) => {
  const files = req.files as {
    [field: string]: Express.Multer.File[];
  };

  const front = files["front_image"]?.[0];
  const back = files["back_image"]?.[0];

  if (!front || !back) {
    return res.status(400).json({ message: "Thiếu file ảnh." });
  }

  // Khớp với app.use("/upload", express.static(...))
  const frontUrl = `/upload/seller/${front.filename}`;
  const backUrl = `/upload/seller/${back.filename}`;

  return res.json({
    front_image_url: `http://localhost:3001${frontUrl}`,
    back_image_url: `http://localhost:3001${backUrl}`,
  });
});

export default router;
