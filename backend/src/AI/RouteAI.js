import express from 'express';
import { getFinancialAiReport } from './ControlAIInsights.js';
import auth from '../middleware/AuthMiddleware.js';

const router = express.Router();

// Rota: GET /api/ai/report
router.get('/report', auth, getFinancialAiReport);

export default router;