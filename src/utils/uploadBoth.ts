import multer from "multer";
import path from "path";
import { Request, Response, NextFunction } from "express";

// 🟡 Serverless-compatible: Dùng memoryStorage thay cho diskStorage, tránh lưu locally!
const storage = multer.memoryStorage();

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const imageExt = [".png", ".jpg", ".jpeg", ".webp"];
    const dataExt = [".csv", ".zip", ".json", ".txt", ".xlsx"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === "thumbnail_url" && !imageExt.includes(ext)) {
        return cb(new Error("Ảnh thumbnail không hợp lệ"));
    }
    if (file.fieldname === "file_url" && !dataExt.includes(ext)) {
        return cb(new Error("File dataset không hợp lệ"));
    }
    if (file.fieldname !== "thumbnail_url" && file.fieldname !== "file_url") {
        return cb(new Error("Trường upload không hợp lệ"));
    }

    cb(null, true);
};

// 🟢 Cấu hình multer, giới hạn 20MB
const uploadMulter = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }
}).fields([
    { name: "thumbnail_url", maxCount: 1 },
    { name: "file_url", maxCount: 1 },
]);

// 🟢 Middleware upload đồng thời 2 file, bắt lỗi trả về JSON (không lọt catch lỗi nội bộ)
export const uploadBoth = (req: Request, res: Response, next: NextFunction) => {
    uploadMulter(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ error: "Kích thước file vượt quá giới hạn (20MB)" });
            }
            return res.status(400).json({ error: err.message || "Lỗi upload file" });
        } else if (err) {
            return res.status(400).json({ error: err.message || "Lỗi upload file" });
        }
        next();
    });
};
