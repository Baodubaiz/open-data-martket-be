import express from 'express'
import { registerController } from '../controllers/register.controller'

const router = express.Router()

// POST /auth/register
router.post('/register', registerController)

export default router
