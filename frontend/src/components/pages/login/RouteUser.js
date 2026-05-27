import express from 'express';
import { 
  registerUser, 
  verifyEmail, 
  authUser, 
  updateUserProfile 
} from '../controllers/ControlUser.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-email', verifyEmail);
router.post('/login', authUser);
router.put('/profile', protect, updateUserProfile);

export default router;