import Goal from '../models/ModelGoal.js';

// @desc    Listar todas as caixinhas do usuário
export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(goals || []);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar caixinhas' });
  }
};

// @desc    Criar nova caixinha (Meta)
export const createGoal = async (req, res) => {
  try {
    const { name, targetAmount, currentAmount, categoryGoal, deadline, color, icon } = req.body;

    const newGoal = new Goal({
      user: req.user._id,
      name,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      categoryGoal: categoryGoal || 'outros',
      deadline,
      color: color || '#06b6d4',
      icon: icon || 'PiggyBank'
    });
    
    const savedGoal = await newGoal.save();
    res.status(201).json(savedGoal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Atualizar saldo e dados da caixinha
// VOLTEI O NOME PARA updateBalance PARA CASAR COM SUAS ROTAS
export const updateBalance = async (req, res) => {
  try {
    const { amount, type, name, categoryGoal, targetAmount, color, icon, deadline } = req.body;
    
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!goal) {
      return res.status(404).json({ message: 'Caixinha não encontrada' });
    }

    // Lógica de Movimentação Financeira
    if (amount) {
      const value = Math.abs(Number(amount));
      if (type === 'deposit') {
        goal.currentAmount += value;
      } else if (type === 'withdraw') {
        if (goal.currentAmount < value) {
          return res.status(400).json({ message: 'Saldo insuficiente' });
        }
        goal.currentAmount -= value;
      }
    }

    // Lógica de Atualização de Campos (Cor, Nome, etc)
    if (name) goal.name = name;
    if (categoryGoal) goal.categoryGoal = categoryGoal;
    if (targetAmount) goal.targetAmount = Number(targetAmount);
    if (color) goal.color = color;
    if (icon) goal.icon = icon;
    if (deadline) goal.deadline = deadline;

    // Recalcula o status
    goal.status = goal.currentAmount >= goal.targetAmount ? 'concluido' : 'ativo';

    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar caixinha' });
  }
};

// @desc    Deletar caixinha
export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Não encontrado' });
    res.json({ message: 'Removida com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao deletar' });
  }
};