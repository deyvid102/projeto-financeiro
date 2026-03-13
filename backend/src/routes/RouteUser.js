import express from 'express';
import { registerUser, authUser } from '../controllers/ControlUser.js';

const router = express.Router();

// Rota: POST /api/users/register
router.post('/register', registerUser);

// Rota: POST /api/users/login
router.post('/login', authUser);

export default router;