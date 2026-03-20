import { Request, Response } from 'express'
import { loginService } from '../services/login.service'

export const loginController = async (req: Request, res: Response) => {
    const { email, password } = req.body

    try {
        const token = await loginService(email, password)
        res.json({ token })
    } catch (err: any) {
        if (err.message === 'Email không tồn tại' || err.message === 'Sai mật khẩu') {
            res.status(401).json({ error: err.message })
        } else {
            res.status(500).json({ error: 'Lỗi server' })
        }
    }
}
