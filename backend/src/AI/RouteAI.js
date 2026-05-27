import express from 'express';
import { getFinancialAiReport, askFinancialAi, analyzeStrategyStructure } from './ControlAIInsights.js';
import { protect } from '../middleware/AuthMiddleware.js';
import { attachSubscription, enforceMinimumPlan } from '../middleware/SubscriptionMiddleware.js';

const router = express.Router();

router.use(protect, attachSubscription, enforceMinimumPlan('PRO'));

// Rota: GET /api/ai/report - Relatório Automatizado
router.get('/report', getFinancialAiReport);

// Rota: POST /api/ai/ask - Chat Interativo com a IA
router.post('/ask', askFinancialAi);
router.post('/strategy-audit', analyzeStrategyStructure);

export default router;