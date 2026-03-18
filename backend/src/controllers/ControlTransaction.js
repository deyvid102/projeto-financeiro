import ModelTransaction from '../models/ModelTransaction.js';
import ModelGoal from '../models/ModelGoal.js';

// @desc    Criar uma nova transação manual (Única)
// @route   POST /api/transactions
export const createTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, date, goal } = req.body;

    // 1. Criar a transação
    const transaction = new ModelTransaction({
      user: req.user._id,
      title,
      amount: Number(amount),
      type,
      category: goal ? 'caixinha' : category, // Padronizado minúsculo
      date: date || new Date(),
      goal: goal || null
    });

    const createdTransaction = await transaction.save();

    // 2. Lógica de Metas (Caixinhas) - Sincronizada com o Saldo
    if (goal) {
      const targetGoal = await ModelGoal.findById(goal);
      if (targetGoal) {
        // Se sai dinheiro da conta (saída), ele ENTRA na caixinha (soma)
        if (type === 'saida') {
          await ModelGoal.findByIdAndUpdate(goal, {
            $inc: { currentAmount: Number(amount) }
          });
        } 
        // Se entra dinheiro na conta vindo da caixinha (entrada), ele SAI da caixinha (subtrai)
        else if (type === 'entrada') {
          await ModelGoal.findByIdAndUpdate(goal, {
            $inc: { currentAmount: -Number(amount) }
          });
        }
      }
    }

    res.status(201).json(createdTransaction);
  } catch (error) {
    console.error("❌ Erro ao criar transação:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Buscar histórico de transações (Popula Meta para o Front)
export const getTransactions = async (req, res) => {
  try {
    const transactions = await ModelTransaction.find({ user: req.user._id })
      .populate({
        path: 'goal',
        select: 'name categoryGoal', 
        options: { strictPopulate: false }
      })
      .sort({ date: -1 })
      .lean();
    
    res.json(transactions || []);
  } catch (error) {
    res.status(500).json({ message: `Erro ao buscar: ${error.message}` });
  }
};

// @desc    Atualizar uma transação (Com trava de segurança)
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await ModelTransaction.findById(id);

    if (!transaction) return res.status(404).json({ message: 'Transação não encontrada.' });
    
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Acesso negado.' });
    }

    // Nota: A lógica de recálculo de metas na edição pode ser complexa.
    // O ideal, se editar valor/tipo, seria reverter o valor antigo da meta e aplicar o novo.
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

// @desc    Deletar uma transação (Com ESTORNO automático da meta)
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await ModelTransaction.findById(req.params.id);

    if (!transaction) return res.status(404).json({ message: 'Transação não encontrada.' });
    
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    // Estorno de metas: Se deletar a transação, desfazemos a alteração no valor da caixinha
    if (transaction.goal) {
      const amountToRevert = transaction.type === 'saida' 
        ? -transaction.amount // Se era saída da conta (soma na meta), agora subtrai da meta
        : transaction.amount;  // Se era entrada na conta (saque da meta), agora devolve pra meta

      await ModelGoal.findByIdAndUpdate(transaction.goal, {
        $inc: { currentAmount: amountToRevert }
      });
    }

    await transaction.deleteOne();
    res.json({ message: 'Transação removida e valor da meta estornado.' });
  } catch (error) {
    res.status(500).json({ message: `Erro ao deletar: ${error.message}` });
  }
};