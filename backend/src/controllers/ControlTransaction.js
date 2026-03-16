import ModelTransaction from '../models/ModelTransaction.js';
import ModelGoal from '../models/ModelGoal.js'; // Importe o model de metas

// @desc    Criar uma nova transação
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
      date,
      goal: goal || null // Aqui deve receber o ID da caixinha
    });

    const createdTransaction = await transaction.save();

    // LÓGICA DE SOMA:
    if (goal) {
      const targetGoal = await ModelGoal.findById(goal);
      if (targetGoal) {
        // Se for 'saida' (você tirou do saldo para GUARDAR), soma na caixinha
        if (type === 'saida') {
          targetGoal.currentAmount += Number(amount);
        } 
        // Se for 'entrada' (você RESGATOU para o saldo), subtrai da caixinha
        else if (type === 'entrada') {
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

// @desc    Buscar todas as transações do usuário logado
export const getTransactions = async (req, res) => {
  try {
    const transactions = await ModelTransaction.find({ user: req.user._id }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: `Erro ao buscar transações: ${error.message}` });
  }
};

// @desc    Atualizar uma transação
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await ModelTransaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transação não encontrada.' });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Acesso negado.' });
    }

    const dataToUpdate = {
      title: req.body.title || transaction.title,
      amount: req.body.amount ? Number(req.body.amount) : transaction.amount,
      type: req.body.type || transaction.type,
      category: req.body.category || transaction.category,
      date: req.body.date || transaction.date
    };

    const updated = await ModelTransaction.findByIdAndUpdate(
      id,
      { $set: dataToUpdate },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    console.error("ERRO NO BACKEND:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Deletar uma transação
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await ModelTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transação não encontrada.' });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    // Se a transação que está sendo deletada era de uma caixinha, 
    // idealmente você deveria estornar o valor da caixinha aqui.
    if (transaction.goal) {
      const targetGoal = await ModelGoal.findById(transaction.goal);
      if (targetGoal) {
        if (transaction.type === 'saida') {
          targetGoal.currentAmount -= transaction.amount;
        } else {
          targetGoal.currentAmount += transaction.amount;
        }
        await targetGoal.save();
      }
    }

    await transaction.deleteOne();
    res.json({ message: 'Transação removida com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: `Erro ao deletar transação: ${error.message}` });
  }
};