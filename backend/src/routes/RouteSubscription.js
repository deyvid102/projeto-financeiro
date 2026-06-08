import express from 'express';
import { protect } from '../middleware/AuthMiddleware.js';
import * as ControlSubscription from '../controllers/ControlSubscription.js';

const router = express.Router();

router.post('/', protect, ControlSubscription.createSubscription);
router.post('/subscribe', protect, ControlSubscription.subscribe);
router.get('/', protect, ControlSubscription.listUserSubscriptions);
router.get('/:id', protect, ControlSubscription.getSubscription);
router.put('/:id/pay', protect, ControlSubscription.paySubscription);
router.put('/:id', protect, ControlSubscription.updateSubscription);
router.delete('/:id', protect, ControlSubscription.deleteSubscription);

export default router;
