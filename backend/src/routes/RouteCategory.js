import express from 'express';
import { getCategories, createCategory, deleteCategory } from '../controllers/ControlCategory.js';
import { protect } from '../middleware/authMiddleware.js'; // Ajuste o caminho para o seu middleware de auth

const router = express.Router();

// Todas as rotas de categoria precisam de login
router.route('/')
  .get(protect, getCategories)
  .post(protect, createCategory);

router.route('/:id')
  .delete(protect, deleteCategory);

export default router;