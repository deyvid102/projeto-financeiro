import express from 'express';
import { 
  registerUser, 
  verifyEmail, 
  authUser, 
  googleAuthUser, 
  forgotPassword, // Importe a nova função
  resetPassword,  // Importe a nova função
  updateUserProfile 
} from '../controllers/ControlUser.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-email', verifyEmail);
router.post('/login', authUser);
router.post('/google-login', googleAuthUser);
router.post('/forgot-password', forgotPassword); // Nova rota para solicitar reset
router.post('/reset-password', resetPassword);   // Nova rota para resetar a senha
router.put('/profile', protect, updateUserProfile);

export default router;