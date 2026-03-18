import express from 'express';
import { 
  createTransaction, 
  getTransactions, 
  updateTransaction, 
  deleteTransaction 
} from '../controllers/ControlTransaction.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rotas para /api/transactions
router.route('/')
  .get(protect, getTransactions)
  .post(protect, createTransaction);

// Rotas para /api/transactions/:id
router.route('/:id')
  .put(protect, updateTransaction)
  .delete(protect, deleteTransaction);

export default router;