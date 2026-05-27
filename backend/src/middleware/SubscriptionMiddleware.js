import Subscription from '../models/ModelSubscription.js';
import ModelTransaction from '../models/ModelTransaction.js';
import ModelGoal from '../models/ModelGoal.js';
import { isPlanAtLeast } from '../services/planService.js';

// Attach the latest subscription for the user to req.subscription
export const attachSubscription = async (req, res, next) => {
  try {
    const sub = await Subscription.findOne({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    req.subscription = sub || null;
    next();
  } catch (err) {
    console.error('Erro attachSubscription:', err);
    next();
  }
};

// Enforce transaction limit for STARTER plan
export const enforceTransactionLimit = async (req, res, next) => {
  try {
    const sub = req.subscription;
    if (!sub || sub.plan === 'STARTER') {
      // Count transactions in current month
      const start = new Date();
      start.setDate(1);
      start.setHours(0,0,0,0);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);

      const count = await ModelTransaction.countDocuments({ user: req.user._id, createdAt: { $gte: start, $lt: end } });
      if (count >= 50) return res.status(403).json({ message: 'Limite de 50 transações/mês atingido para o plano Starter.' });
    }
    next();
  } catch (err) {
    console.error('Erro enforceTransactionLimit:', err);
    next(err);
  }
};

// Enforce goals (caixinhas) limit for STARTER plan
export const enforceGoalsLimit = async (req, res, next) => {
  try {
    const sub = req.subscription;
    if (!sub || sub.plan === 'STARTER') {
      const count = await ModelGoal.countDocuments({ user: req.user._id });
      if (count >= 3) return res.status(403).json({ message: 'Limite de 3 caixinhas atingido para o plano Starter.' });
    }
    next();
  } catch (err) {
    console.error('Erro enforceGoalsLimit:', err);
    next(err);
  }
};

export const enforceMinimumPlan = (requiredPlan) => async (req, res, next) => {
  try {
    const sub = req.subscription;
    if (!sub || !isPlanAtLeast(sub.plan, requiredPlan)) {
      return res.status(403).json({
        message: `Este recurso exige o plano ${requiredPlan}. Atualize seu plano para acessar esta funcionalidade.`,
      });
    }
    next();
  } catch (err) {
    console.error('Erro enforceMinimumPlan:', err);
    next(err);
  }
};

export default {
  attachSubscription,
  enforceTransactionLimit,
  enforceGoalsLimit,
  enforceMinimumPlan,
};
