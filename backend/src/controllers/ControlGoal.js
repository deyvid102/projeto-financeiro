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

export const updateBalance = async (req, res) => {
  try {
    const { amount, type, name, categoryGoal, targetAmount, color, icon, deadline } = req.body;
    
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!goal) {
      return res.status(404).json({ message: 'Caixinha não encontrada' });
    }

    // --- LÓGICA FINANCEIRA (Apenas se houver movimentação) ---
    // Verificamos se amount existe e é um número válido antes de calcular
    if (amount !== undefined && amount !== null && amount !== "") {
      const value = Math.abs(Number(amount));
      
      if (!isNaN(value) && value > 0) {
        if (type === 'deposit' || type === 'entrada') {
          goal.currentAmount += value;
        } else if (type === 'withdraw' || type === 'saida') {
          if (goal.currentAmount < value) {
            return res.status(400).json({ message: 'Saldo insuficiente na caixinha' });
          }
          goal.currentAmount -= value;
        }
      }
    }

    // --- LÓGICA DE EDIÇÃO (Campos de texto e visual) ---
    if (name !== undefined) goal.name = name;
    if (categoryGoal !== undefined) goal.categoryGoal = categoryGoal;
    if (color !== undefined) goal.color = color;
    if (icon !== undefined) goal.icon = icon;
    if (deadline !== undefined) goal.deadline = deadline;

    // Atualização da Meta (Garante que seja número)
    if (targetAmount !== undefined && targetAmount !== "") {
      const numTarget = Number(targetAmount);
      if (!isNaN(numTarget)) goal.targetAmount = numTarget;
    }

    // Recalcula o status automaticamente
    goal.status = goal.currentAmount >= goal.targetAmount ? 'concluido' : 'ativo';

    await goal.save();
    res.json(goal);
  } catch (err) {
    // Importante: Logar o erro no terminal do seu servidor para você ver o que quebrou
    console.error("ERRO NO BACKEND:", err); 
    res.status(500).json({ message: 'Erro interno ao atualizar caixinha', error: err.message });
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