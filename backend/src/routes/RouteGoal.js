import express from 'express';
import { 
  getGoals, 
  createGoal, 
  updateBalance, 
  deleteGoal 
} from '../controllers/ControlGoal.js';
import { protect } from '../middleware/AuthMiddleware.js'; // Padronize o Case do arquivo

const router = express.Router();

router.get('/', protect, getGoals);
router.post('/', protect, createGoal);
router.patch('/:id/balance', protect, updateBalance);
router.delete('/:id', protect, deleteGoal);

export default router;