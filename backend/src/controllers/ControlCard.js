import ModelCard from '../models/ModelCard.js';
import ModelRecurrence from '../models/ModelRecurrence.js';
import ModelTransaction from '../models/ModelTransaction.js';

// ─────────────────────────────────────────────────────────────────
// @desc   Listar todos os cartões ativos do usuário
// @route  GET /api/cards
// ─────────────────────────────────────────────────────────────────
export const getCards = async (req, res) => {
  try {
    const cards = await ModelCard.find({ user: req.user._id, isActive: true }).sort({ createdAt: -1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar cartões.', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc   Criar novo cartão
// @route  POST /api/cards
// ─────────────────────────────────────────────────────────────────
export const createCard = async (req, res) => {
  try {
    const {
      name, type, lastFourDigits, flag, color,
      // Crédito
      creditLimit, closingDay, dueDay,
      // Vale Alimentação
      vaRechargeDay, vaRechargeAmount,
    } = req.body;

    // Monta o documento de acordo com o tipo
    const cardData = {
      user: req.user._id,
      name,
      type,
      lastFourDigits,
      flag,
      color,
    };

    if (type === 'credito') {
      Object.assign(cardData, { creditLimit, closingDay, dueDay });
    } else if (type === 'vale_alimentacao') {
      Object.assign(cardData, { vaRechargeDay, vaRechargeAmount });
    }

    const card = await ModelCard.create(cardData);

    // ── Para VA: criar automaticamente a recorrência de recarga mensal ──
    if (type === 'vale_alimentacao') {
      await ModelRecurrence.create({
        user: req.user._id,
        title: `Recarga ${name}`,
        amount: vaRechargeAmount,
        type: 'entrada',
        category: 'vale_alimentacao',
        frequency: 'monthly',
        dayOfMonth: [vaRechargeDay],
        isInstallment: false,
        cardId: card._id,
        isVaRecharge: true,
        isActive: true,
        status: 'active',
      });
    }

    res.status(201).json(card);
  } catch (err) {
    const status = err.message.includes('requer') ? 400 : 500;
    res.status(status).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc   Atualizar dados do cartão
// @route  PUT /api/cards/:id
// ─────────────────────────────────────────────────────────────────
export const updateCard = async (req, res) => {
  try {
    const card = await ModelCard.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) return res.status(404).json({ message: 'Cartão não encontrado.' });

    const allowedFields = ['name', 'lastFourDigits', 'flag', 'color', 'creditLimit', 'closingDay', 'dueDay', 'vaRechargeDay', 'vaRechargeAmount'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) card[field] = req.body[field];
    });

    // Se alterou o valor da recarga do VA, atualiza a recorrência vinculada
    if (card.type === 'vale_alimentacao' && req.body.vaRechargeAmount !== undefined) {
      await ModelRecurrence.findOneAndUpdate(
        { cardId: card._id, isVaRecharge: true },
        { amount: req.body.vaRechargeAmount, dayOfMonth: [req.body.vaRechargeDay || card.vaRechargeDay] }
      );
    }

    const updated = await card.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc   Desativar cartão (soft delete)
// @route  DELETE /api/cards/:id
// ─────────────────────────────────────────────────────────────────
export const deleteCard = async (req, res) => {
  try {
    const card = await ModelCard.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) return res.status(404).json({ message: 'Cartão não encontrado.' });

    // Impede exclusão de crédito com limite em uso
    if (card.type === 'credito' && card.usedLimit > 0) {
      return res.status(400).json({
        message: `Cartão possui R$ ${card.usedLimit.toFixed(2)} de limite comprometido. Quite as parcelas antes de remover.`,
      });
    }

    card.isActive = false;
    await card.save();

    // Desativa todas as recorrências vinculadas ao cartão
    await ModelRecurrence.updateMany(
      { cardId: req.params.id, user: req.user._id },
      { isActive: false, status: 'paused' }
    );

    res.json({ message: 'Cartão desativado com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc   Pagar fatura do cartão de crédito
//         Cria uma transação de SAÍDA da conta corrente e libera o limite
// @route  PATCH /api/cards/:id/pay-bill
// ─────────────────────────────────────────────────────────────────
export const payBill = async (req, res) => {
  try {
    const { amount } = req.body;
    const card = await ModelCard.findOne({ _id: req.params.id, user: req.user._id, type: 'credito' });

    if (!card) return res.status(404).json({ message: 'Cartão de crédito não encontrado.' });
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Informe um valor de pagamento válido.' });
    if (card.usedLimit === 0) return res.status(400).json({ message: 'Não há fatura em aberto para este cartão.' });

    // Não permite pagar mais do que o saldo devedor
    const paymentAmount = parseFloat(Math.min(amount, card.usedLimit).toFixed(2));

    // Registra o pagamento como saída da conta corrente
    const transaction = await ModelTransaction.create({
      user: req.user._id,
      title: `Pagamento Fatura — ${card.name}`,
      amount: paymentAmount,
      type: 'saida',
      category: 'fatura_cartao',
      date: new Date(),
      card: card._id,
      transactionOrigin: 'bill_payment',
      isRecurring: false,
    });

    // Libera o limite equivalente ao pagamento
    card.usedLimit = parseFloat(Math.max(0, card.usedLimit - paymentAmount).toFixed(2));
    await card.save();

    res.json({
      message: `Fatura paga: R$ ${paymentAmount.toFixed(2)}. Limite liberado.`,
      transaction,
      updatedCard: card,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc   Resumo da fatura atual e próxima do cartão de crédito
// @route  GET /api/cards/:id/bill-summary
// ─────────────────────────────────────────────────────────────────
export const getBillSummary = async (req, res) => {
  try {
    const card = await ModelCard.findOne({ _id: req.params.id, user: req.user._id, type: 'credito' });
    if (!card) return res.status(404).json({ message: 'Cartão de crédito não encontrado.' });

    const today = new Date();
    const d = today.getDate();

    // ── Determina o período da fatura ATUAL ──
    // Se ainda não fechou (hoje < closingDay): período é do fechamento do mês passado até o fechamento deste mês
    // Se já fechou (hoje >= closingDay): período é do fechamento deste mês até o próximo fechamento
    let periodStart, periodEnd;

    if (d < card.closingDay) {
      periodStart = new Date(today.getFullYear(), today.getMonth() - 1, card.closingDay + 1);
      periodEnd   = new Date(today.getFullYear(), today.getMonth(),     card.closingDay);
    } else {
      periodStart = new Date(today.getFullYear(), today.getMonth(),     card.closingDay + 1);
      periodEnd   = new Date(today.getFullYear(), today.getMonth() + 1, card.closingDay);
    }

    // Vencimento: dueDay no mês após o fechamento
    const dueDate = new Date(periodEnd);
    dueDate.setDate(card.dueDay);
    if (dueDate <= periodEnd) dueDate.setMonth(dueDate.getMonth() + 1);

    // Busca as transações geradas pelo fechamento neste período
    const billTransactions = await ModelTransaction.find({
      user:              req.user._id,
      card:              card._id,
      transactionOrigin: 'card_bill',
      date:              { $gte: periodStart, $lte: periodEnd },
    }).sort({ date: -1 });

    const currentBillTotal = billTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Recorrências ativas vinculadas a este cartão (parcelas futuras)
    const activeInstallments = await ModelRecurrence.find({
      user:     req.user._id,
      cardId:   card._id,
      isActive: true,
      status:   'active',
    });

    const futureTotalCommitted = activeInstallments.reduce((sum, r) => {
      const remaining = r.isInstallment ? (r.totalInstallments - r.currentInstallment + 1) : 1;
      return sum + r.amount * remaining;
    }, 0);

    res.json({
      card: {
        name:           card.name,
        creditLimit:    card.creditLimit,
        usedLimit:      card.usedLimit,
        availableLimit: card.availableLimit,
        closingDay:     card.closingDay,
        dueDay:         card.dueDay,
      },
      currentBill: {
        periodStart,
        periodEnd,
        dueDate,
        total:        parseFloat(currentBillTotal.toFixed(2)),
        transactions: billTransactions,
      },
      futureInstallments: {
        activeCount:     activeInstallments.length,
        totalCommitted:  parseFloat(futureTotalCommitted.toFixed(2)),
        installments:    activeInstallments,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc   Extrato do VA (saldo + transações)
// @route  GET /api/cards/:id/va-statement
// ─────────────────────────────────────────────────────────────────
export const getVaStatement = async (req, res) => {
  try {
    const card = await ModelCard.findOne({ _id: req.params.id, user: req.user._id, type: 'vale_alimentacao' });
    if (!card) return res.status(404).json({ message: 'Cartão VA não encontrado.' });

    const transactions = await ModelTransaction.find({
      user: req.user._id,
      card: card._id,
    }).sort({ date: -1 }).limit(50);

    res.json({
      card: {
        name:             card.name,
        vaBalance:        card.vaBalance,
        vaRechargeDay:    card.vaRechargeDay,
        vaRechargeAmount: card.vaRechargeAmount,
      },
      transactions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
