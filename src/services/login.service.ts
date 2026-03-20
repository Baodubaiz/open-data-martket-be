import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { createToken } from '../utils/jwt'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export const loginService = async (email: string, password: string) => {
    // 1. Tìm user
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
        throw new Error('Email không tồn tại')
    }

    // 2. So sánh mật khẩu
    const match = await bcrypt.compare(password, user.password!)
    if (!match) {
        throw new Error('Sai mật khẩu')
    }

    // 3. Tạo token
    const token = createToken({
        user_id: user.user_id,
        role: user.role,
        wallet_address: user.wallet_address || undefined,
    })

    // const decoded = jwt.decode(token) as { [key: string]: any };
    // console.log('Decoded token:', decoded);

    return token
}
