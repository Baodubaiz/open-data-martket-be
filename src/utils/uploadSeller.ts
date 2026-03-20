import multer from "multer";
import path from "path";
import fs from "fs";

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    // 🟢 Lưu vào be/public/upload/seller (đúng với app.use("/upload", ...))
    const folder = path.join(__dirname, "../../public/upload/seller");
    ensureDir(folder);
    cb(null, folder);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".jfif", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error("Định dạng ảnh không hợp lệ"));
  }
  cb(null, true);
};

export const uploadSellerImages = multer({
  storage,
  fileFilter,
}).fields([
  { name: "front_image", maxCount: 1 },
  { name: "back_image", maxCount: 1 },
]);
