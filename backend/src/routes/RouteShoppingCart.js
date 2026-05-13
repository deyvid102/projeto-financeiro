import express from 'express';
import cartController from '../controllers/ControlShoppingCart.js';
import auth from '../middleware/AuthMiddleware.js';

const router = express.Router();

// @route   POST /api/cart
router.post('/', auth, cartController.createItem);

// @route   GET /api/cart
router.get('/', auth, cartController.getItems);

// @route   PUT /api/cart/:id
router.put('/:id', auth, cartController.updateItem);

// @route   DELETE /api/cart/:id
router.delete('/:id', auth, cartController.deleteItem);

export default router;