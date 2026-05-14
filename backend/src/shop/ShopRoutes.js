import express from 'express';
import { createSmartItem, getUserWishlist } from './ShopController.js';
// Importe seu middleware de autenticação (exemplo: protect ou auth)
// import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/shop/add
 * @desc    Adiciona um item à wishlist com detecção automática de categoria e link Magalu
 * @access  Private
 */
router.post('/add', createSmartItem);

/**
 * @route   GET /api/shop/wishlist
 * @desc    Busca todos os itens da wishlist do usuário logado
 * @access  Private
 */
router.get('/wishlist', getUserWishlist);

export default router;