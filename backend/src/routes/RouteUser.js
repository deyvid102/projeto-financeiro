import express from 'express';
import { registerUser, authUser, updateUserProfile } from '../controllers/ControlUser.js';
import { protect } from '../middleware/AuthMiddleware.js'; // Certifique-se de ter este middleware

const router = express.Router();

// Rota: POST /api/users/register
router.post('/register', registerUser);

// Rota: POST /api/users/login
router.post('/login', authUser);

// Rota: PUT /api/users/profile (Acessível apenas com Token)
// O ModalSettings deve disparar um api.put('/users/profile', dados)
router.put('/profile', protect, updateUserProfile);

export default router;