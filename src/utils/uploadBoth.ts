import multer from "multer";
import path from "path";
import fs from "fs";

const ensureDir = (dir: string) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
    destination: (_req, file, cb) => {
        let folder = "";
        if (file.fieldname === "thumbnail_url")
            folder = path.join(__dirname, "../../public/upload/thumbnails");
        else if (file.fieldname === "file_url")
            folder = path.join(__dirname, "../../public/upload/datasets");
        ensureDir(folder);
        cb(null, folder);
    },
    filename: (_req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const imageExt = [".png", ".jpg", ".jpeg", ".webp"];
    const dataExt = [".csv", ".zip", ".json", ".txt", ".xlsx"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === "thumbnail_url" && !imageExt.includes(ext))
        return cb(new Error("Ảnh thumbnail không hợp lệ"));
    if (file.fieldname === "file_url" && !dataExt.includes(ext))
        return cb(new Error("File dataset không hợp lệ"));

    cb(null, true);
};

// 🟢 Middleware upload đồng thời 2 file
export const uploadBoth = multer({ storage, fileFilter }).fields([
    { name: "thumbnail_url", maxCount: 1 },
    { name: "file_url", maxCount: 1 },
]);
