import { listPlans, getPlan } from '../services/planService.js';

export const getPlans = async (req, res) => {
  try {
    const plans = listPlans();
    return res.json(plans);
  } catch (err) {
    console.error('Erro getPlans:', err);
    return res.status(500).json({ message: 'Erro ao obter planos.' });
  }
};

export const getPlanByKey = async (req, res) => {
  try {
    const plan = getPlan(req.params.key?.toUpperCase());
    if (!plan) return res.status(404).json({ message: 'Plano não encontrado' });
    return res.json(plan);
  } catch (err) {
    console.error('Erro getPlanByKey:', err);
    return res.status(500).json({ message: 'Erro ao obter plano.' });
  }
};

export default { getPlans, getPlanByKey };
