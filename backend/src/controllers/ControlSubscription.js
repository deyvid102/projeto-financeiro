import Subscription from '../models/ModelSubscription.js';
import ModelUser from '../models/ModelUser.js';

// Preço fixo das ofertas (em reais). Armazenamos como number (ex: 29.90)
const PLAN_PRICES = {
  STARTER: 0.0,
  PRO: 29.9,
  MAX: 59.9,
};

export const createSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const { plan, dueDate } = req.body;

    if (!plan || !['STARTER', 'PRO', 'MAX'].includes(plan)) {
      return res.status(400).json({ message: 'Plano inválido.' });
    }

    const price = PLAN_PRICES[plan];
    const subscription = await Subscription.create({
      user: userId,
      plan,
      price,
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      status: price === 0 ? 'paid' : 'pending',
      paymentHistory: price === 0 ? [{ amount: 0.0, method: 'free', note: 'Starter gratuito' }] : [],
    });

    return res.status(201).json(subscription);
  } catch (err) {
    console.error('Erro criando subscription:', err);
    return res.status(500).json({ message: 'Erro ao criar assinatura.' });
  }
};

export const listUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user._id;
    const subs = await Subscription.find({ user: userId }).sort({ createdAt: -1 });
    return res.json(subs);
  } catch (err) {
    console.error('Erro listando subscriptions:', err);
    return res.status(500).json({ message: 'Erro ao listar assinaturas.' });
  }
};

export const getSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id).populate('user', 'name email');
    if (!sub) return res.status(404).json({ message: 'Assinatura não encontrada' });
    // Segurança: usuário só pode acessar suas próprias assinaturas a não ser que seja admin (não implementado)
    if (sub.user._id.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Acesso negado' });
    return res.json(sub);
  } catch (err) {
    console.error('Erro obtendo subscription:', err);
    return res.status(500).json({ message: 'Erro ao obter assinatura.' });
  }
};

export const paySubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, transactionId, note } = req.body;

    const sub = await Subscription.findById(id);
    if (!sub) return res.status(404).json({ message: 'Assinatura não encontrada' });
    if (sub.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Acesso negado' });

    // Adiciona entrada no histórico
    sub.paymentHistory.push({ date: new Date(), amount: amount ?? sub.price, method, transactionId, note });
    sub.status = 'paid';
    // define próximo vencimento (exemplo: +1 mês)
    const nextDue = new Date(sub.dueDate);
    nextDue.setMonth(nextDue.getMonth() + 1);
    sub.dueDate = nextDue;

    await sub.save();
    return res.json(sub);
  } catch (err) {
    console.error('Erro pagando subscription:', err);
    return res.status(500).json({ message: 'Erro ao processar pagamento.' });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const sub = await Subscription.findById(id);
    if (!sub) return res.status(404).json({ message: 'Assinatura não encontrada' });
    if (sub.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Acesso negado' });

    Object.assign(sub, updates);
    await sub.save();
    return res.json(sub);
  } catch (err) {
    console.error('Erro atualizando subscription:', err);
    return res.status(500).json({ message: 'Erro ao atualizar assinatura.' });
  }
};

export const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await Subscription.findById(id);
    if (!sub) return res.status(404).json({ message: 'Assinatura não encontrada' });
    if (sub.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Acesso negado' });
    await sub.remove();
    return res.json({ message: 'Assinatura removida' });
  } catch (err) {
    console.error('Erro removendo subscription:', err);
    return res.status(500).json({ message: 'Erro ao remover assinatura.' });
  }
};

export const subscribe = async (req, res) => {
  try {
    const userId = req.user._id;
    const { planKey } = req.body;

    if (!planKey || !['STARTER', 'PRO', 'MAX'].includes(planKey)) {
      return res.status(400).json({ message: 'Plano inválido.' });
    }

    const price = PLAN_PRICES[planKey];
    
    // Busca se o usuário já possui uma assinatura para atualizar ou cria uma nova
    let subscription = await Subscription.findOne({ user: userId });

    if (subscription) {
      subscription.plan = planKey;
      subscription.price = price;
      // Se mudar para o plano Starter (grátis), já marcamos como pago
      subscription.status = price === 0 ? 'paid' : 'pending';
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        user: userId,
        plan: planKey,
        price,
        status: price === 0 ? 'paid' : 'pending',
        dueDate: new Date(),
        paymentHistory: price === 0 ? [{ amount: 0.0, method: 'free', note: 'Assinatura inicial' }] : [],
      });
    }

    // Atualiza o plano diretamente no modelo do Usuário para refletir no JWT/Middleware
    await ModelUser.findByIdAndUpdate(userId, { plan: planKey });

    return res.status(200).json(subscription);
  } catch (err) {
    console.error('Erro ao processar assinatura:', err);
    return res.status(500).json({ message: 'Erro ao processar alteração de plano.' });
  }
};

export default {
  createSubscription,
  listUserSubscriptions,
  getSubscription,
  paySubscription,
  updateSubscription,
  deleteSubscription,
  subscribe,
};
