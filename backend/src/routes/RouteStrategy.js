import express from 'express';
import {
  createStrategyCategory,
  getStrategyCategories,
  deleteStrategyCategory,
  createStrategyCard,
  updateStrategyCategory,
  getStrategyCards,
  updateStrategyCard,
  deleteStrategyCard,
  addChildCard,
  updateChildCard,
  removeChildCard
} from '../controllers/ControlStrategy.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/categories')
  .post(createStrategyCategory)
  .get(getStrategyCategories);

router.route('/categories/:id')
  .put(updateStrategyCategory)
  .delete(deleteStrategyCategory);

router.route('/cards')
  .post(createStrategyCard)
  .get(getStrategyCards);

router.route('/cards/:id')
  .put(updateStrategyCard)
  .delete(deleteStrategyCard);

router.route('/cards/:parentId/children')
  .post(addChildCard);

router.route('/cards/:parentId/children/:childId')
  .put(updateChildCard)
  .delete(removeChildCard);

export default router;