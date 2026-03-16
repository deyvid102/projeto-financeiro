import express from 'express';
import { 
  createInvestment, 
  getInvestments, 
  updateInvestmentValue, 
  deleteInvestment,
  liquidateInvestment // <-- Nova função que vamos garantir no Controller
} from '../controllers/ControlInvestment.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createInvestment)
  .get(protect, getInvestments);

router.route('/:id')
  .put(protect, updateInvestmentValue)
  .delete(protect, deleteInvestment);

// Rota específica para finalizar o investimento e gerar a entrada opcional
router.put('/:id/liquidate', protect, liquidateInvestment);

export default router;