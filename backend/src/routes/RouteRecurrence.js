import express from 'express';
import { 
  createRecurrence, 
  getRecurrences, 
  updateRecurrence, 
  deleteRecurrence 
} from '../controllers/ControlRecurrence.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// Agrupamento de rotas para o endpoint raiz /api/recurrences
router.route('/')
  .post(protect, createRecurrence)
  .get(protect, getRecurrences);

// Agrupamento de rotas para o endpoint com ID /api/recurrences/:id
router.route('/:id')
  .put(protect, updateRecurrence)
  .delete(protect, deleteRecurrence);

export default router;