import Goal from '../models/ModelGoal.js';

// @desc    Listar todas as caixinhas do usuário
export const getGoals = async (req, res) => {
  try {
    console.log(`🔍 [GET /goals] Buscando metas para o User ID: ${req.user._id}`);

    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    console.log(`🎯 [GET /goals] Total encontrado no banco: ${goals.length}`);

    res.status(200).json(goals || []);
  } catch (err) {
    console.error("❌ Erro ao buscar caixinhas:", err);
    res.status(500).json({ message: 'Erro ao buscar caixinhas' });
  }
};

// @desc    Criar nova caixinha (Meta)
export const createGoal = async (req, res) => {
  try {
    const { name, targetAmount, currentAmount, categoryGoal, deadline } = req.body;

    console.log(`➕ [POST /goals] Criando meta "${name}" para o User ID: ${req.user._id}`);

    const newGoal = new Goal({
      user: req.user._id,
      name,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      categoryGoal: categoryGoal || 'outros', // Ajustado para o enum minúsculo
      deadline
    });
    
    const savedGoal = await newGoal.save();
    res.status(201).json(savedGoal);
  } catch (err) {
    console.error("❌ Erro ao criar caixinha:", err);
    res.status(400).json({ message: err.message });
  }
};

// @desc    Atualizar saldo manualmente (Depósito/Saque)
export const updateBalance = async (req, res) => {
  const { amount, type } = req.body;
  
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!goal) {
      console.warn(`⚠️ [PATCH /balance] Meta ${req.params.id} não encontrada para o user ${req.user._id}`);
      return res.status(404).json({ message: 'Caixinha não encontrada' });
    }

    const value = Math.abs(Number(amount));

    if (type === 'deposit') {
      goal.currentAmount += value;
    } else if (type === 'withdraw') {
      if (goal.currentAmount < value) {
        return res.status(400).json({ message: 'Saldo insuficiente na caixinha' });
      }
      goal.currentAmount -= value;
    }

    if (goal.status !== undefined) {
      goal.status = goal.currentAmount >= goal.targetAmount ? 'concluido' : 'ativo';
    }

    await goal.save();
    res.json(goal);
  } catch (err) {
    console.error("❌ Erro ao atualizar saldo:", err);
    res.status(500).json({ message: 'Erro ao atualizar saldo' });
  }
};

// @desc    Deletar caixinha
export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    
    if (!goal) {
      return res.status(404).json({ message: 'Caixinha não encontrada ou sem permissão' });
    }
    
    res.json({ message: 'Caixinha removida com sucesso' });
  } catch (err) {
    console.error("❌ Erro ao deletar caixinha:", err);
    res.status(500).json({ message: 'Erro ao deletar caixinha' });
  }
};