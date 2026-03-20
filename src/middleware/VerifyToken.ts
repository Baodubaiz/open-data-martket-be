// middleware/verifyToken.ts

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey'

export interface UserPayload {
    user_id: string;
    role: string;
    wallet_address?: string;
}

export interface AuthRequest extends Request {
    user?: UserPayload;
}

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction): void {
    let token: string | null = null;

    // 1. Ưu tiên lấy token từ Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }

    // 2. Nếu không có, lấy từ cookie
    if (!token && req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    // 3. Nếu vẫn không có, báo lỗi
    if (!token) {
        return res.status(401).json({ error: "Thiếu token" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Token không hợp lệ hoặc hết hạn" });
    }
}


// 📌 Middleware yêu cầu role
export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: "Forbidden: insufficient role" });
            return;
        }

        next();
    };
};
