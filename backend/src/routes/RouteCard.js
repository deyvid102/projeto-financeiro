import express from 'express';
import {
  getCards,
  createCard,
  updateCard,
  deleteCard,
  payBill,
  getBillSummary,
  getVaStatement,
} from '../controllers/ControlCard.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// /api/cards
router.route('/')
  .get(protect, getCards)
  .post(protect, createCard);

// /api/cards/:id
router.route('/:id')
  .put(protect, updateCard)
  .delete(protect, deleteCard);

// /api/cards/:id/pay-bill  → Pagar fatura (crédito)
router.patch('/:id/pay-bill', protect, payBill);

// /api/cards/:id/bill-summary  → Resumo da fatura (crédito)
router.get('/:id/bill-summary', protect, getBillSummary);

// /api/cards/:id/va-statement  → Extrato do VA
router.get('/:id/va-statement', protect, getVaStatement);

export default router;
