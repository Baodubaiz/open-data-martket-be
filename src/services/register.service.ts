import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { createToken } from '../utils/jwt'

const prisma = new PrismaClient()

export const registerService = async (data: {
    wallet_address?: string
    email?: string
    password?: string
    phone_number?: string
    bank_account?: string
    bank_name?: string
    role?: string // default là "buyer" nếu không truyền
    full_name?: string
}) => {
    const {
        wallet_address,
        email,
        password,
        phone_number,
        bank_account,
        bank_name,
        role = 'buyer', // default
        full_name,
    } = data

    // Nếu role là seller nhưng không có bank_account → báo lỗi
    if (role === 'seller' && !bank_account) {
        throw new Error('Seller bắt buộc phải có tài khoản ngân hàng')
    }

    // Kiểm tra trùng lặp
    if (email) {
        const existingEmail = await prisma.user.findUnique({ where: { email } })
        if (existingEmail) throw new Error('Email đã tồn tại')
    }
    if (phone_number) {
        const existingPhone = await prisma.user.findUnique({ where: { phone_number } })
        if (existingPhone) throw new Error('Số điện thoại đã tồn tại')
    }
    if (bank_account) {
        const existingBank = await prisma.user.findUnique({ where: { bank_account } })
        if (existingBank) throw new Error('Tài khoản ngân hàng đã tồn tại')
    }
    if (wallet_address) {
        const existingWallet = await prisma.user.findUnique({ where: { wallet_address } })
        if (existingWallet) throw new Error('Ví đã được đăng ký')
    }

    // Hash password nếu có
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined

    // Tạo user
    const newUser = await prisma.user.create({
        data: {
            wallet_address,
            email,
            password: hashedPassword,
            phone_number,
            bank_account,
            bank_name,
            role: role as any, // Prisma enum Role
            full_name,
            // is_active, created_at, updated_at → Prisma tự set
        },
    })

    // Tạo token
    const token = createToken({
        user_id: newUser.user_id,
        role: newUser.role,
        wallet_address: newUser.wallet_address || undefined,
    })

    return { message: 'Đăng ký thành công', token }
}
