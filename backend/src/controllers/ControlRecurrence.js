import ModelRecurrence from '../models/ModelRecurrence.js';
import ModelTransaction from '../models/ModelTransaction.js';
import ModelGoal from '../models/ModelGoal.js';
import ModelCard from '../models/ModelCard.js';

// ─────────────────────────────────────────────────────────────────
// @desc   Criar regra de recorrência
//         Para cartão de CRÉDITO:
//           - Parcelamento obrigatório
//           - Valida limite disponível
//           - Define dayOfMonth = [card.closingDay] automaticamente
//           - Compromete o limite total imediatamente
//         Para VA recharge: uso interno (criado pelo ControlCard)
// @route  POST /api/recurrences
// ─────────────────────────────────────────────────────────────────
export const createRecurrence = async (req, res) => {
  try {
    const data = { ...req.body, user: req.user._id };

    // ── Validação e regras especiais para CARTÃO DE CRÉDITO ──
    if (data.cardId) {
      const card = await ModelCard.findOne({ _id: data.cardId, user: req.user._id, isActive: true });
      if (!card) return res.status(404).json({ message: 'Cartão não encontrado.' });

      if (card.type === 'credito') {
        // 1. Parcelamento é obrigatório para crédito
        if (!data.isInstallment || !data.totalInstallments || data.totalInstallments < 1) {
          return res.status(400).json({
            message: 'Compras no crédito exigem parcelamento. Informe isInstallment=true e totalInstallments.',
          });
        }

        const totalCreditAmount = parseFloat((data.amount * data.totalInstallments).toFixed(2));

        // 2. Verifica se a compra cabe no limite disponível
        const available = card.creditLimit - card.usedLimit;
        if (totalCreditAmount > available) {
          return res.status(400).json({
            message: `Limite insuficiente. Disponível: R$ ${available.toFixed(2)} | Necessário: R$ ${totalCreditAmount.toFixed(2)} (${data.totalInstallments}x R$ ${data.amount.toFixed(2)}).`,
          });
        }

        // 3. Define o dia de disparo como o dia de fechamento do cartão
        data.frequency = 'monthly';
        data.dayOfMonth = [card.closingDay];
        data.type = 'saida'; // compra no crédito sempre é saída
        data.totalCreditAmount = totalCreditAmount;

        // 4. Compromete o limite total imediatamente
        card.usedLimit = parseFloat((card.usedLimit + totalCreditAmount).toFixed(2));
        await card.save();
      }

      if (card.type === 'vale_alimentacao') {
        return res.status(400).json({
          message: 'Recorrências do VA são gerenciadas automaticamente pelo sistema.',
        });
      }

      if (card.type === 'debito') {
        // Débito apenas referencia o cartão, sem lógica de limite
        data.type = data.type || 'saida';
      }
    }

    // ── Cria a regra de recorrência ──
    let recurrence = await ModelRecurrence.create(data);

    // ── Verifica se hoje é um dia programado para gerar transação imediata ──
    const { shouldFire, today } = _checkIfFiresToday(recurrence);

    if (shouldFire && recurrence.isActive) {
      recurrence = await _processRecurrenceFiring(recurrence, today, req.user._id);
    }

    res.status(201).json({
      message: shouldFire
        ? 'Regra criada e transação de hoje gerada!'
        : 'Regra agendada! Nenhuma transação necessária para hoje.',
      recurrence,
    });
  } catch (error) {
    console.error('❌ Erro ao criar recorrência:', error);
    res.status(500).json({ message: 'Erro ao criar recorrência.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc   Listar todas as recorrências do usuário
// @route  GET /api/recurrences
// ─────────────────────────────────────────────────────────────────
export const getRecurrences = async (req, res) => {
  try {
    const recurrences = await ModelRecurrence.find({ user: req.user._id })
      .populate({ path: 'goalId', select: 'name categoryGoal currentAmount', options: { strictPopulate: false } })
      .populate({ path: 'cardId', select: 'name type flag color lastFourDigits creditLimit usedLimit closingDay dueDay', options: { strictPopulate: false } })
      .sort({ createdAt: -1 })
      .lean();

    res.json(recurrences || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc   Atualizar regra de recorrência
//         Recorrências de crédito ou VA não podem ter amount/parcelas editadas
//         após criação (afetaria limite/saldo já comprometido)
// @route  PUT /api/recurrences/:id
// ─────────────────────────────────────────────────────────────────
export const updateRecurrence = async (req, res) => {
  try {
    const recurrence = await ModelRecurrence.findOne({ _id: req.params.id, user: req.user._id });
    if (!recurrence) return res.status(404).json({ message: 'Recorrência não encontrada.' });

    // Proteção: campos críticos de crédito não podem ser alterados depois de criados
    if (recurrence.cardId) {
      const card = await ModelCard.findById(recurrence.cardId);
      if (card?.type === 'credito') {
        const blockedFields = ['amount', 'totalInstallments', 'cardId'];
        const attemptedBlocked = blockedFields.filter((f) => req.body[f] !== undefined);
        if (attemptedBlocked.length > 0) {
          return res.status(400).json({
            message: `Os campos [${attemptedBlocked.join(', ')}] não podem ser alterados em compras de crédito. Delete e recrie a compra se necessário.`,
          });
        }
      }

      // VA recharge: só permite editar via ControlCard (updateCard)
      if (recurrence.isVaRecharge) {
        return res.status(400).json({
          message: 'A recorrência de recarga do VA é gerenciada automaticamente. Edite o cartão para alterar os valores.',
        });
      }
    }

    const updated = await ModelRecurrence.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc   Deletar regra de recorrência
//         Para crédito: reverte o limite das parcelas restantes
// @route  DELETE /api/recurrences/:id
// ─────────────────────────────────────────────────────────────────
export const deleteRecurrence = async (req, res) => {
  try {
    const recurrence = await ModelRecurrence.findOne({ _id: req.params.id, user: req.user._id });
    if (!recurrence) return res.status(404).json({ message: 'Recorrência não encontrada.' });

    // Para crédito ativo: reverte o limite das parcelas que ainda não foram geradas
    if (recurrence.cardId && recurrence.isInstallment && recurrence.isActive) {
      const card = await ModelCard.findById(recurrence.cardId);
      if (card?.type === 'credito') {
        const remainingInstallments = recurrence.totalInstallments - recurrence.currentInstallment + 1;
        const amountToFree = parseFloat((recurrence.amount * remainingInstallments).toFixed(2));
        card.usedLimit = parseFloat(Math.max(0, card.usedLimit - amountToFree).toFixed(2));
        await card.save();
      }
    }

    await recurrence.deleteOne();
    res.json({ message: 'Recorrência removida.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// @desc   Processar recorrências do dia (chamado por cron/scheduler)
//         Deve ser chamado uma vez por dia (ex: às 06:00)
// @route  POST /api/recurrences/process-today  (proteger com chave interna)
// ─────────────────────────────────────────────────────────────────
export const processTodayRecurrences = async (req, res) => {
  try {
    const allActive = await ModelRecurrence.find({ isActive: true, status: 'active' });
    const today = new Date();
    const results = { processed: 0, skipped: 0, errors: [] };

    for (const recurrence of allActive) {
      const { shouldFire } = _checkIfFiresToday(recurrence, today);
      if (!shouldFire) { results.skipped++; continue; }

      try {
        await _processRecurrenceFiring(recurrence, today, recurrence.user);
        results.processed++;
      } catch (err) {
        results.errors.push({ recurrenceId: recurrence._id, error: err.message });
      }
    }

    res.json({ message: 'Processamento concluído.', ...results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// FUNÇÕES AUXILIARES (privadas)
// ─────────────────────────────────────────────────────────────────

/**
 * Verifica se a recorrência deve disparar hoje.
 */
function _checkIfFiresToday(recurrence, date = new Date()) {
  const dayOfMonth  = date.getDate();
  const dayOfWeek   = date.getDay();
  const monthOfYear = date.getMonth() + 1;
  let shouldFire = false;

  if (recurrence.frequency === 'monthly') {
    if (recurrence.dayOfMonth.includes(dayOfMonth)) shouldFire = true;
  } else if (recurrence.frequency === 'weekly') {
    if (recurrence.dayOfWeek.includes(dayOfWeek)) shouldFire = true;
  } else if (recurrence.frequency === 'yearly') {
    if (recurrence.monthOfYear.includes(monthOfYear) && recurrence.dayOfMonth.includes(dayOfMonth)) {
      shouldFire = true;
    }
  }

  return { shouldFire, today: date };
}

/**
 * Processa o disparo de uma recorrência:
 * - Cria a transação adequada (normal, meta, crédito, VA recharge)
 * - Atualiza contadores de parcelas e status
 */
async function _processRecurrenceFiring(recurrence, today, userId) {
  const baseTransactionData = {
    user:             userId,
    amount:           recurrence.amount,
    date:             today,
    recurrenceId:     recurrence._id,
    isRecurring:      true,
    installmentNumber: recurrence.isInstallment ? recurrence.currentInstallment : null,
  };

  // ── Recarga de Vale Alimentação ──
  if (recurrence.isVaRecharge && recurrence.cardId) {
    const card = await ModelCard.findById(recurrence.cardId);
    if (card && card.isActive) {
      card.vaBalance = parseFloat((card.vaBalance + recurrence.amount).toFixed(2));
      await card.save();

      await ModelTransaction.create({
        ...baseTransactionData,
        title:             `Recarga VA — ${card.name}`,
        type:              'entrada',
        category:          'vale_alimentacao',
        card:              card._id,
        transactionOrigin: 'va_recharge',
      });
    }
  }

  // ── Compra parcelada no CRÉDITO ──
  else if (recurrence.cardId && !recurrence.isVaRecharge) {
    const card = await ModelCard.findById(recurrence.cardId);
    if (card && card.isActive) {
      const installmentLabel = recurrence.isInstallment
        ? ` (${recurrence.currentInstallment}/${recurrence.totalInstallments})`
        : '';

      await ModelTransaction.create({
        ...baseTransactionData,
        title:             `${recurrence.title}${installmentLabel}`,
        type:              'saida',
        category:          recurrence.category,
        card:              card._id,
        transactionOrigin: 'card_bill',
      });
    }
  }

  // ── Contribuição para Meta (Caixinha) ──
  else if (recurrence.goalId) {
    const goal = await ModelGoal.findById(recurrence.goalId);
    if (goal) {
      await ModelTransaction.create({
        ...baseTransactionData,
        title:             `Depósito: ${goal.name}`,
        type:              'saida',
        category:          'caixinha',
        goal:              goal._id,
        transactionOrigin: 'recurrence',
      });

      await ModelGoal.findByIdAndUpdate(goal._id, { $inc: { currentAmount: recurrence.amount } });
    }
  }

  // ── Recorrência comum ──
  else {
    await ModelTransaction.create({
      ...baseTransactionData,
      title:             recurrence.title,
      type:              recurrence.type,
      category:          recurrence.category,
      transactionOrigin: 'recurrence',
    });
  }

  // ── Atualiza contador de parcelas e status ──
  let updateOp;
  if (recurrence.isInstallment) {
    const isLastInstallment = recurrence.currentInstallment >= recurrence.totalInstallments;
    updateOp = isLastInstallment
      ? { $inc: { currentInstallment: 1 }, isActive: false, status: 'completed' }
      : { $inc: { currentInstallment: 1 } };
  }

  const updated = updateOp
    ? await ModelRecurrence.findByIdAndUpdate(recurrence._id, updateOp, { new: true })
    : recurrence;

  return updated;
}
