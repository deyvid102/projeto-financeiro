import ModelTransaction from '../models/ModelTransaction.js';
import ModelGoal from '../models/ModelGoal.js';

// @desc    Criar uma nova transação manual (Única)
// @route   POST /api/transactions
export const createTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, date, goal } = req.body;

    const transaction = new ModelTransaction({
      user: req.user._id,
      title,
      amount: Number(amount),
      type,
      category,
      date: date || new Date(),
      goal: goal || null
    });

    const createdTransaction = await transaction.save();

    // Lógica de Metas (Caixinhas)
    if (goal) {
      const targetGoal = await ModelGoal.findById(goal);
      if (targetGoal) {
        // Se eu tiro dinheiro para uma meta (saída do saldo), a meta aumenta
        if (type === 'saida') {
          targetGoal.currentAmount += Number(amount);
        } else if (type === 'entrada') {
          // Se eu retiro da meta (entrada no saldo), a meta diminui
          targetGoal.currentAmount -= Number(amount);
        }
        await targetGoal.save();
      }
    }

    res.status(201).json(createdTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Buscar histórico de transações do usuário
export const getTransactions = async (req, res) => {
  try {
    // Busca transações e popula os dados da meta se houver
    const transactions = await ModelTransaction.find({ user: req.user._id })
      .sort({ date: -1 });
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: `Erro ao buscar transações: ${error.message}` });
  }
};

// @desc    Atualizar uma transação existente
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await ModelTransaction.findById(id);

    if (!transaction) return res.status(404).json({ message: 'Transação não encontrada.' });
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Acesso negado.' });
    }

    const updated = await ModelTransaction.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Deletar uma transação (com estorno de metas)
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await ModelTransaction.findById(req.params.id);

    if (!transaction) return res.status(404).json({ message: 'Transação não encontrada.' });
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    // Estorno de metas caso a transação pertença a uma
    if (transaction.goal) {
      const targetGoal = await ModelGoal.findById(transaction.goal);
      if (targetGoal) {
        // Inverte a lógica da criação para estornar o valor
        transaction.type === 'saida' 
          ? targetGoal.currentAmount -= transaction.amount 
          : targetGoal.currentAmount += transaction.amount;
        await targetGoal.save();
      }
    }

    await transaction.deleteOne();
    res.json({ message: 'Transação removida com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: `Erro ao deletar: ${error.message}` });
  }
};