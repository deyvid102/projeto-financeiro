import express from 'express';
import { 
  createInvestment, 
  getInvestments, 
  updateInvestmentValue, 
  deleteInvestment,
  liquidateInvestment,
  getTickerPrice // <--- Importado com sucesso agora
} from '../controllers/ControlInvestment.js';
import { protect } from '../middleware/AuthMiddleware.js';
import { attachSubscription, enforceMinimumPlan } from '../middleware/SubscriptionMiddleware.js';

const router = express.Router();

/**
 * @desc Todas as rotas de investimento exigem autenticação
 */
router.use(protect, attachSubscription); 

// --- ROTAS GERAIS E ESTÁTICAS ---
// Importante: /price deve vir ANTES de /:id para não haver conflito
router.get('/price', enforceMinimumPlan('PRO'), getTickerPrice);

router.route('/')
  .post(enforceMinimumPlan('PRO'), createInvestment)
  .get(getInvestments);

// --- ROTAS DE ATIVOS ESPECÍFICOS (DINÂMICAS) ---
router.route('/:id')
  .put(enforceMinimumPlan('PRO'), updateInvestmentValue)
  .delete(enforceMinimumPlan('PRO'), deleteInvestment);

/**
 * @route   PUT /api/investments/:id/liquidate
 * @desc    Finaliza o ativo (venda/resgate) e gera transação de entrada automática.
 * @access  Private
 * @payload { addAsIncome: boolean, sellPrice: number }
 */
router.put('/:id/liquidate', enforceMinimumPlan('PRO'), liquidateInvestment);

export default router;