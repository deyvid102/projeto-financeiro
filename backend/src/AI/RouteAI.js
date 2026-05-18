import express from 'express';
import { getFinancialAiReport, askFinancialAi } from './ControlAIInsights.js';
import auth from '../middleware/AuthMiddleware.js';

const router = express.Router();

// Rota: GET /api/ai/report - Relatório Automatizado
router.get('/report', auth, getFinancialAiReport);

// Rota: POST /api/ai/ask - Chat Interativo com a IA
router.post('/ask', auth, askFinancialAi);

export default router;