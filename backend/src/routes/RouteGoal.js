import express from 'express';
import { getGoals, createGoal, updateBalance, deleteGoal } from '../controllers/ControlGoal.js';
import auth from '../middleware/AuthMiddleware.js'; // 'auth' aqui receberá a função 'protect'

const router = express.Router();

router.get('/', auth, getGoals);
router.post('/', auth, createGoal);
router.patch('/:id/balance', auth, updateBalance);
router.delete('/:id', auth, deleteGoal);

export default router;