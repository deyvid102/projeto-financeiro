import ModelTransaction from '../models/ModelTransaction.js';

// @desc    Criar uma nova transação
// @route   POST /api/transactions
export const createTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, date, isPaid } = req.body;

    const transaction = new ModelTransaction({
      user: req.user._id,
      title,
      amount: Number(amount), // Garante que é número
      type,
      category,
      date,
      isPaid
    });

    const createdTransaction = await transaction.save();
    res.status(201).json(createdTransaction);
  } catch (error) {
    res.status(500).json({ message: `Erro ao criar transação: ${error.message}` });
  }
};

// @desc    Buscar todas as transações do usuário logado
// @route   GET /api/transactions
export const getTransactions = async (req, res) => {
  try {
    const transactions = await ModelTransaction.find({ user: req.user._id }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: `Erro ao buscar transações: ${error.message}` });
  }
};

// @desc    Atualizar uma transação (ESSA ESTAVA FALTANDO!)
// @route   PUT /api/transactions/:id
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Busca a transação original
    const transaction = await ModelTransaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transação não encontrada.' });
    }

    // Verifica se o usuário é o dono
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Acesso negado.' });
    }

    // Tratamento manual para evitar quebra de tipo
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
// @route   DELETE /api/transactions/:id
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await ModelTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transação não encontrada.' });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    await transaction.deleteOne();
    res.json({ message: 'Transação removida com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: `Erro ao deletar transação: ${error.message}` });
  }
};