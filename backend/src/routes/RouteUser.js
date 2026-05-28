import express from 'express';
import { 
  registerUser, 
  verifyEmail, 
  authUser, 
  googleAuthUser,
  forgotPassword,
  resetPassword,
  updateUserProfile 
} from '../controllers/ControlUser.js';
import { protect } from '../middleware/AuthMiddleware.js'; // Certifique-se de ter este middleware

const router = express.Router();

// Rota: POST /api/users/register
router.post('/register', registerUser);

// Rota: POST /api/users/verify-email
router.post('/verify-email', verifyEmail);

// Rota: POST /api/users/login
router.post('/login', authUser);

// Rota: POST /api/users/google-login
router.post('/google-login', googleAuthUser);

// Rota: POST /api/users/forgot-password
router.post('/forgot-password', forgotPassword);

// Rota: POST /api/users/reset-password
router.post('/reset-password', resetPassword);

// Rota: PUT /api/users/profile (Acessível apenas com Token)
// O ModalSettings deve disparar um api.put('/users/profile', dados)
router.put('/profile', protect, updateUserProfile);

export default router;