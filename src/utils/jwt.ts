// utils/jwt.ts

import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey' // Dùng biến môi trường thật khi deploy

export function createToken(user: {
    user_id: string
    role: string
    wallet_address?: string
}) {
    const payload: any = {
        user_id: user.user_id,
        role: user.role
    }

    if (user.wallet_address) {
        payload.wallet_address = user.wallet_address
    }

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '24h' // Token có hiệu lực 24 giờ
    })
}
