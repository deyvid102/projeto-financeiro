import express from 'express';
// 1. Mudança aqui: Importamos tudo (*) como o objeto 'cartController'
import * as cartController from '../controllers/ControlShoppingCart.js';
import auth from '../middleware/AuthMiddleware.js';

const router = express.Router();

// Agora o cartController.createItem (e os outros) funcionará corretamente
router.post('/', auth, cartController.createCartItem); // Verifique se o nome no controller é createCartItem

router.get('/', auth, cartController.getCartItems);

router.put('/:id', auth, cartController.updateCartItem);

router.delete('/:id', auth, cartController.deleteCartItem);

export default router;