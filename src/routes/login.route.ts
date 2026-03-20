import express from 'express'
import { loginController } from '../controllers/login.controller'

const router = express.Router()

// POST /auth/login
router.post('/login', loginController)

export default router
