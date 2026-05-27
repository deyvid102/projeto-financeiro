import express from 'express';
import ControlPlans from '../controllers/ControlPlans.js';

const router = express.Router();

router.get('/', ControlPlans.getPlans);
router.get('/:key', ControlPlans.getPlanByKey);

export default router;
