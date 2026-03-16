import express from 'express';
const router = express.Router();
import { 
  createTransaction, 
  getTransactions, 
  updateTransaction, 
  deleteTransaction 
} from '../controllers/ControlTransaction.js';
import { protect } from '../middleware/authMiddleware.js'; // Seu middleware de autenticação

// Rota principal: "/" mapeia para GET (buscar todas) e POST (criar uma)
router.route('/')
  .get(protect, getTransactions)
  .post(protect, createTransaction);

// Rota com ID: "/:id" mapeia para PUT (atualizar) e DELETE (remover)
router.route('/:id')
  .put(protect, updateTransaction)
  .delete(protect, deleteTransaction);

export default router;