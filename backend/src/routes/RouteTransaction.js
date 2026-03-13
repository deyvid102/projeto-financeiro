import express from 'express';
import { 
  createTransaction, 
  getTransactions, 
  updateTransaction, // 1. Importe a nova função aqui
  deleteTransaction 
} from '../controllers/ControlTransaction.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas as rotas abaixo exigem autenticação
router.route('/')
  .post(protect, createTransaction)
  .get(protect, getTransactions);

router.route('/:id')
  .put(protect, updateTransaction) // 2. Adicione o método PUT aqui
  .delete(protect, deleteTransaction);

export default router;