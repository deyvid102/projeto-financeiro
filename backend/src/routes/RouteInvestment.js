import express from 'express';
import { 
  createInvestment, 
  getInvestments, 
  updateInvestmentValue, 
  deleteInvestment,
  liquidateInvestment 
} from '../controllers/ControlInvestment.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

/**
 * @desc Todas as rotas de investimento exigem autenticação
 */
router.use(protect); 

// --- ROTAS GERAIS ---
// POST: Cria investimento (processa ticker, quantity, etc)
// GET: Lista investimentos (calcula valores em tempo real via API/Datas)
router.route('/')
  .post(createInvestment)
  .get(getInvestments);

// --- ROTAS DE AÇÕES ESPECÍFICAS ---
router.route('/:id')
  .put(updateInvestmentValue)
  .delete(deleteInvestment);

/**
 * @route   PUT /api/investments/:id/liquidate
 * @desc    Finaliza o ativo (venda/resgate) e gera transação de entrada automática.
 * @access  Private
 * @payload { addAsIncome: boolean, sellPrice: number }
 */
router.put('/:id/liquidate', liquidateInvestment);

export default router;