import express from 'express';
import { 
  createRecurrence, 
  getRecurrences, 
  updateRecurrence, 
  deleteRecurrence 
} from '../controllers/ControlRecurrence.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createRecurrence)
  .get(protect, getRecurrences);

router.route('/:id')
  .put(protect, updateRecurrence)
  .delete(protect, deleteRecurrence);

export default router;