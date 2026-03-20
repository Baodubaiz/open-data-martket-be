import { Request, Response } from "express";
import * as datasetService from "../services/Dataset.service";
import { AuthRequest } from "../middleware/VerifyToken";
import path from "path";
import { readPreviewFile } from "../utils/readPreview";
import { parse } from "csv-parse";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken"

// 🟢 Seller tạo dataset
export const create = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    // 📦 Lấy file từ req.files (multer.fields)
    const files = req.files as {
      thumbnail_url?: Express.Multer.File[];
      file_url?: Express.Multer.File[];
    };

    const thumbnail = files?.thumbnail_url?.[0];
    const datasetFile = files?.file_url?.[0];

    // ⚙️ Lấy thông tin file
    let fileSizeMB: string | null = null;
    let fileFormat: string | null = null;

    if (datasetFile) {
      const fileStats = fs.statSync(datasetFile.path);
      fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2); // 💾 MB
      fileFormat = path.extname(datasetFile.originalname)
        .replace(".", "")
        .toUpperCase(); // CSV, XLSX, JSON...
    }

    // ⚙️ Chuẩn bị dữ liệu để lưu
    const body = {
      ...req.body,
      price_vnd: Number(req.body.price_vnd) || 0,
      price_eth: Number(req.body.price_eth) || 0,
      is_active: req.body.is_active === "true",
      thumbnail_url: thumbnail ? `/upload/thumbnails/${thumbnail.filename}` : null,
      file_url: datasetFile ? `/upload/datasets/${datasetFile.filename}` : null,
      file_size_mb: fileSizeMB,
      file_format: fileFormat,
    };

    // 💾 Lưu vào DB qua service
    const dataset = await datasetService.create(req.user.user_id, body);

    res.status(201).json({
      message: "✅ Dataset created successfully",
      data: dataset,
    });
  } catch (err: any) {
    console.error("❌ Lỗi tạo dataset:", err);
    res.status(400).json({ error: err.message });
  }
};




// 🟢 Lấy tất cả datasets
export const getAll = async (_req: Request, res: Response) => {
  const datasets = await datasetService.getAll();
  res.json(datasets);
};

// 🟢 Lấy tất cả datasets active
export const getAllActive = async (_req: Request, res: Response) => {
  const datasets = await datasetService.getAllActive();
  res.json(datasets);
};

// 🟢 Lấy dataset theo ID
export const getById = async (req: Request, res: Response) => {
  const dataset = await datasetService.getById(req.params.id);
  if (!dataset) return res.status(404).json({ error: "Dataset not found" });
  res.json(dataset);
};

// 🟢 Lấy tất cả dataset theo seller_id
export const getBySellerId = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const datasets = await datasetService.getBySellerId(sellerId);

    if (!datasets || datasets.length === 0)
      return res.status(404).json({ message: "Seller chưa có dataset nào" });

    return res.status(200).json({
      message: "Lấy danh sách dataset của seller thành công",
      data: datasets,
    });
  } catch (error: any) {
    console.error("❌ Lỗi getBySellerId:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


// 🟢 Lấy tất cả dataset theo tên seller (tìm kiếm gần đúng, không phân biệt hoa thường)
export const getBySellerName = async (req: Request, res: Response) => {
  try {
    const { sellerName } = req.params;
    const datasets = await datasetService.getBySellerName(sellerName);

    if (!datasets || datasets.length === 0)
      return res.status(404).json({ message: "Không tìm thấy dataset nào của seller này" });

    return res.status(200).json({
      message: "Lấy danh sách dataset theo tên seller thành công",
      data: datasets,
    });
  } catch (error: any) {
    console.error("❌ Lỗi getBySellerName:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


// 🟢 Seller cập nhật dataset
export const update = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const datasetId = req.params.id;
    if (!datasetId) return res.status(400).json({ error: "Invalid dataset ID" });

    // 📦 Lấy file từ req.files (multer.fields)
    const files = req.files as {
      thumbnail_url?: Express.Multer.File[];
      file_url?: Express.Multer.File[];
    };

    const thumbnail = files?.thumbnail_url?.[0];
    const datasetFile = files?.file_url?.[0];

    // ⚙️ Xử lý body
    const body = { ...req.body };

    if (body.price_vnd !== undefined) body.price_vnd = Number(body.price_vnd);
    if (body.price_eth !== undefined) body.price_eth = Number(body.price_eth);
    if (body.is_active !== undefined)
      body.is_active = body.is_active === "true" || body.is_active === true;

    // 🖼️ Chỉ cập nhật thumbnail nếu có file mới
    if (thumbnail) {
      body.thumbnail_url = `/upload/thumbnails/${thumbnail.filename}`;
    } else {
      delete body.thumbnail_url; // giữ nguyên cũ
    }

    // 📂 Cập nhật dataset file nếu có file mới
    if (datasetFile) {
      body.file_url = `/upload/datasets/${datasetFile.filename}`;
    } else {
      delete body.file_url; // giữ nguyên cũ
    }

    // 💾 Gọi service cập nhật
    const dataset = await datasetService.update(req.params.id, req.user, body);
    res.json(dataset);
  } catch (err: any) {
    console.error("❌ Lỗi cập nhật dataset:", err);
    res.status(400).json({ error: err.message });
  }
};


// 🟢 Xoá dataset
export const remove = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    await datasetService.remove(req.params.id, req.user);
    res.json({ message: "Deleted successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getPreview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = Number(req.query.limit) || 5;

    const dataset = await datasetService.getById(id);
    if (!dataset || !dataset.file_url) {
      return res.status(404).json({ success: false, message: "Dataset not found" });
    }

    const filePath = path.join(__dirname, "../../public", dataset.file_url);
    const preview = await readPreviewFile(filePath, limit);

    return res.status(200).json({
      success: true,
      message: "Preview fetched successfully",
      data: preview,
    });
  } catch (error: any) {
    console.error("❌ Lỗi khi đọc preview:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};



const prisma = new PrismaClient(); // 👈 khai báo PrismaClient dùng cho transaction check

export const downloadFile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    let token = req.query.token;

    if (Array.isArray(token)) token = token[0];
    const tokenStr = token as string | undefined;

    console.log("🧩 Incoming token:", tokenStr || "❌ no token");

    const dataset = await datasetService.getById(id);
    if (!dataset) {
      console.log("❌ Dataset not found");
      return res.status(404).json({ message: "Dataset not found" });
    }

    console.log("📁 Dataset active:", dataset.is_active);

    const filePath = path.join(__dirname, "../../public", dataset.file_url);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    // ✅ Public dataset cho phép tải
    if (dataset.is_active && (!token || token === "")) {
      console.log("✅ Public dataset download without login");
      return res.download(filePath, path.basename(filePath));
    }


    let user: any = null;
    if (tokenStr) {
      try {
        user = jwt.verify(tokenStr, process.env.JWT_SECRET || "mysecretkey");
        console.log("✅ JWT decoded:", user);
      } catch (err) {
        console.error("❌ JWT verify error:", err);
        return res.status(401).json({ error: "Token không hợp lệ hoặc hết hạn" });
      }
    }

    if (!user) {
      console.warn("🚫 Không có user sau verify → Trả lỗi Thiếu token");
      return res.status(401).json({ error: "Thiếu token" });
    }

    const isAdmin = user.role === "admin";
    const isSeller = dataset.seller_id === user.user_id;
    console.log("👤 Role check:", { isAdmin, isSeller, user_id: user.user_id });

    // ✅ Cho phép tải luôn nếu hợp lệ
    console.log("✅ Authorized download by", user.role);
    return res.download(filePath, path.basename(filePath));
  } catch (error: any) {
    console.error("🔥 Server error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const downloadSample = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = 50; // chỉ 50 dòng đầu
    // 🧱 Đảm bảo thư mục temp tồn tại
    const tempDir = path.join(__dirname, "../../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const samplePath = path.join(tempDir, `sample_${id}.csv`);

    const dataset = await datasetService.getById(id);
    if (!dataset || !dataset.file_url) {
      return res.status(404).json({ success: false, message: "Dataset not found" });
    }

    const filePath = path.join(__dirname, "../../public", dataset.file_url);
    const ext = path.extname(filePath).toLowerCase();

    if (ext !== ".csv") {
      return res.status(400).json({ success: false, message: "Only CSV supported for sample download." });
    }

    const sampleFile = path.join(__dirname, "../../temp", `sample_${id}.csv`);
    const readStream = fs.createReadStream(filePath, { encoding: "utf8" });
    const writeStream = fs.createWriteStream(sampleFile);

    let lineCount = 0;
    readStream.on("data", (chunk: Buffer | string) => {
      const text = chunk.toString(); // 🔥 ép Buffer → string
      const lines = text.split("\n");
      for (const line of lines) {
        writeStream.write(line + "\n");
        lineCount++;
        if (lineCount > limit) {
          readStream.destroy(); // dừng đọc sớm
          writeStream.end();
          break;
        }
      }
    });

    readStream.on("close", () => {
      res.download(sampleFile, `${dataset.title}_sample.csv`, () => {
        fs.unlink(sampleFile, () => { }); // xoá sau khi gửi xong
      });
    });

    readStream.on("error", (err) => {
      res.status(500).json({ success: false, message: "Error reading file", error: err.message });
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
