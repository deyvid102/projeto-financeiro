import Goal from '../models/ModelGoal.js';

// Listar todas as caixinhas
export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar caixinhas' });
  }
};

// Criar nova caixinha
export const createGoal = async (req, res) => {
  try {
    const newGoal = new Goal({
      ...req.body,
      user: req.user.id
    });
    const savedGoal = await newGoal.save();
    res.status(201).json(savedGoal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Atualizar saldo
export const updateBalance = async (req, res) => {
  const { amount, type } = req.body;
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ message: 'Caixinha não encontrada' });

    if (type === 'deposit') {
      goal.currentAmount += Number(amount);
    } else if (type === 'withdraw') {
      if (goal.currentAmount < amount) {
        return res.status(400).json({ message: 'Saldo insuficiente na caixinha' });
      }
      goal.currentAmount -= Number(amount);
    }

    if (goal.currentAmount >= goal.targetAmount) goal.status = 'concluido';
    else goal.status = 'ativo';

    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar saldo' });
  }
};

// Deletar
export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ message: 'Caixinha não encontrada' });
    res.json({ message: 'Caixinha removida com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao deletar caixinha' });
  }
};