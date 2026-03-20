import { Request, Response } from 'express'
import { registerService } from '../services/register.service'

export const registerController = async (req: Request, res: Response) => {
    try {
        const result = await registerService(req.body)
        res.status(201).json(result)
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }
}
