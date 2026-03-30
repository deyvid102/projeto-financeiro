import ModelTransaction from '../models/ModelTransaction.js';
import ModelGoal from '../models/ModelGoal.js';
import ModelCard from '../models/ModelCard.js';

// ─────────────────────────────────────────────────────────────────
// @desc   Criar transação manual
//         Suporta: sem cartão, débito, VA.
//         Cartão de CRÉDITO → somente via recorrência (POST /api/recurrences)
// @route  POST /api/transactions
// ─────────────────────────────────────────────────────────────────
export const createTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, date, goal, cardId } = req.body;
    const numAmount = Number(amount);

    // ── Validação: cartão de crédito não aceita transação manual ──
    if (cardId) {
      const card = await ModelCard.findOne({ _id: cardId, user: req.user._id, isActive: true });
      if (!card) return res.status(404).json({ message: 'Cartão não encontrado.' });

      if (card.type === 'credito') {
        return res.status(400).json({
          message: 'Compras no cartão de crédito devem ser registradas via recorrência parcelada (/api/recurrences). Isso garante o controle de limite e fechamento de fatura.',
        });
      }

      // ── Lógica: VALE ALIMENTAÇÃO ──
      if (card.type === 'vale_alimentacao') {
        if (type !== 'saida') {
          return res.status(400).json({ message: 'Transações no VA só podem ser do tipo saída (compra).' });
        }
        if (card.vaBalance < numAmount) {
          return res.status(400).json({
            message: `Saldo insuficiente no VA. Disponível: R$ ${card.vaBalance.toFixed(2)}.`,
          });
        }

        // Debita do saldo do VA
        card.vaBalance = parseFloat((card.vaBalance - numAmount).toFixed(2));
        await card.save();

        const transaction = await ModelTransaction.create({
          user: req.user._id,
          title,
          amount: numAmount,
          type: 'saida',
          category: 'vale_alimentacao',
          date: date || new Date(),
          card: card._id,
          transactionOrigin: 'va_purchase',
        });

        return res.status(201).json(transaction);
      }

      // ── Lógica: DÉBITO (apenas referencia o cartão, transação normal) ──
      if (card.type === 'debito') {
        const transaction = await ModelTransaction.create({
          user: req.user._id,
          title,
          amount: numAmount,
          type,
          category: goal ? 'caixinha' : category,
          date: date || new Date(),
          goal: goal || null,
          card: card._id,
          transactionOrigin: 'manual',
        });

        // Lógica de metas (igual ao fluxo sem cartão)
        if (goal) {
          await _handleGoalBalance(goal, type, numAmount);
        }

        return res.status(201).json(transaction);
      }
    }

    // ── Fluxo padrão: sem cartão ──
    const transaction = await ModelTransaction.create({
      user: req.user._id,
      title,
      amount: numAmount,
      type,
      category: goal ? 'caixinha' : category,
      date: date || new Date(),
      goal: goal || null,
      transactionOrigin: 'manual',
    });

    if (goal) {
      await _handleGoalBalance(goal, type, numAmount);
    }

    res.status(201).json(transaction);
  } catch (error) {
    console.error('❌ Erro ao criar transação:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc   Buscar histórico de transações (com populate de Meta e Cartão)
// @route  GET /api/transactions
// ─────────────────────────────────────────────────────────────────
export const getTransactions = async (req, res) => {
  try {
    const transactions = await ModelTransaction.find({ user: req.user._id })
      .populate({ path: 'goal', select: 'name categoryGoal', options: { strictPopulate: false } })
      .populate({ path: 'card', select: 'name type flag color lastFourDigits', options: { strictPopulate: false } })
      .sort({ date: -1 })
      .lean();

    res.json(transactions || []);
  } catch (error) {
    res.status(500).json({ message: `Erro ao buscar: ${error.message}` });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc   Atualizar uma transação
//         Não permite editar transações geradas automaticamente (card_bill, va_recharge)
// @route  PUT /api/transactions/:id
// ─────────────────────────────────────────────────────────────────
export const updateTransaction = async (req, res) => {
  try {
    const transaction = await ModelTransaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transação não encontrada.' });

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Acesso negado.' });
    }

    // Transações automáticas não podem ser editadas manualmente
    if (['card_bill', 'va_recharge'].includes(transaction.transactionOrigin)) {
      return res.status(400).json({
        message: 'Transações geradas automaticamente não podem ser editadas. Edite a recorrência vinculada.',
      });
    }

    const updated = await ModelTransaction.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc   Deletar transação (com estorno automático de meta e VA)
// @route  DELETE /api/transactions/:id
// ─────────────────────────────────────────────────────────────────
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await ModelTransaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transação não encontrada.' });

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    // ── Estorno de Meta ──
    if (transaction.goal) {
      const revert = transaction.type === 'saida' ? -transaction.amount : transaction.amount;
      await ModelGoal.findByIdAndUpdate(transaction.goal, { $inc: { currentAmount: revert } });
    }

    // ── Estorno de saldo do VA ──
    if (transaction.card && transaction.transactionOrigin === 'va_purchase') {
      // Devolve o valor ao saldo do VA
      await ModelCard.findByIdAndUpdate(transaction.card, {
        $inc: { vaBalance: transaction.amount },
      });
    }

    // ── Nota sobre card_bill: NÃO revertemos usedLimit aqui.
    //    O limite é liberado pelo pagamento da fatura (payBill).
    //    Deletar um card_bill é apenas para correção de dados — não afeta o limite.

    await transaction.deleteOne();
    res.json({ message: 'Transação removida com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: `Erro ao deletar: ${error.message}` });
  }
};

// ─────────────────────────────────────────────────────────────────
// Função auxiliar: ajusta o saldo da meta após uma transação
// ─────────────────────────────────────────────────────────────────
async function _handleGoalBalance(goalId, type, amount) {
  const increment = type === 'saida' ? amount : -amount;
  await ModelGoal.findByIdAndUpdate(goalId, { $inc: { currentAmount: increment } });
}
