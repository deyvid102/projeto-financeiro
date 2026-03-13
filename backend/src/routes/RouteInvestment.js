import express from 'express';
import { 
  createInvestment, 
  getInvestments, 
  updateInvestmentValue, 
  deleteInvestment 
} from '../controllers/ControlInvestment.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createInvestment)
  .get(protect, getInvestments);

router.route('/:id')
  .put(protect, updateInvestmentValue)
  .delete(protect, deleteInvestment);

export default router;