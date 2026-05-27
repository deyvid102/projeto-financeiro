import Subscription from '../models/ModelSubscription.js';
import ModelUser from '../models/ModelUser.js';

export async function processSubscriptions() {
  try {
    const now = new Date();
    // 1) Marca assinaturas pendentes vencidas como 'overdue'
    const overdue = await Subscription.updateMany(
      { status: 'pending', dueDate: { $lt: now } },
      { $set: { status: 'overdue' } }
    );

    // 2) Cancela assinaturas overdue com mais de 30 dias
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cancelled = await Subscription.updateMany(
      { status: 'overdue', updatedAt: { $lt: cutoff } },
      { $set: { status: 'cancelled' } }
    );

    // Optionally: notify users (out of scope here)
    console.log('[CRON] Subscriptions processed:', { overdue: overdue.modifiedCount, cancelled: cancelled.modifiedCount });
  } catch (err) {
    console.error('[CRON] Erro em processSubscriptions:', err.message);
  }
}

export default processSubscriptions;
