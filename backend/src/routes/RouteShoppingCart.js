import express from 'express';
import * as cartController from '../controllers/ControlShoppingCart.js';
import auth from '../middleware/AuthMiddleware.js';

const router = express.Router();

// Rotas simplificadas e diretas
router.get('/', auth, cartController.getCartItems);
router.get('/:id', auth, cartController.getCartItemById);
router.post('/', auth, cartController.createCartItem);
router.put('/:id', auth, cartController.updateCartItem);
router.delete('/:id', auth, cartController.deleteCartItem);

export default router;