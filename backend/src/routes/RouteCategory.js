import express from 'express';
import { 
  getCategories, 
  createCategory, 
  updateCategory, // Importe a nova função que criamos no controller
  deleteCategory 
} from '../controllers/ControlCategory.js';
import { protect } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// Todas as rotas de categoria precisam de login
router.route('/')
  .get(protect, getCategories)
  .post(protect, createCategory);

router.route('/:id')
  .put(protect, updateCategory)    // Adicionado o método PUT para edição
  .delete(protect, deleteCategory);

export default router;