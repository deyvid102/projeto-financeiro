import ModelRecurrence from '../models/ModelRecurrence.js';
import ModelTransaction from '../models/ModelTransaction.js';
import ModelGoal from '../models/ModelGoal.js';

// @desc    Criar regra de recorrência e gerar transação APENAS se hoje for o dia programado
// @route   POST /api/recurrences
export const createRecurrence = async (req, res) => {
  try {
    const data = { ...req.body, user: req.user._id };
    const today = new Date();
    const currentDayOfMonth = today.getDate();
    const currentDayOfWeek = today.getDay(); 
    const currentMonth = today.getMonth() + 1; 

    // 1. Criar a regra de recorrência no banco
    let recurrence = await ModelRecurrence.create(data);

    // 2. VERIFICAÇÃO: Hoje é um dos dias programados?
    let shouldCreateTransactionNow = false;

    if (recurrence.frequency === 'monthly') {
      if (recurrence.dayOfMonth.includes(currentDayOfMonth)) shouldCreateTransactionNow = true;
    } else if (recurrence.frequency === 'weekly') {
      if (recurrence.dayOfWeek.includes(currentDayOfWeek)) shouldCreateTransactionNow = true;
    } else if (recurrence.frequency === 'yearly') {
      if (recurrence.monthOfYear.includes(currentMonth) && recurrence.dayOfMonth.includes(currentDayOfMonth)) {
        shouldCreateTransactionNow = true;
      }
    }

    // 3. Se hoje for o dia, gera a transação e atualiza a parcela
    if (shouldCreateTransactionNow && recurrence.isActive) {
      const transactionData = {
        user: req.user._id,
        amount: recurrence.amount,
        date: new Date(),
        recurrenceId: recurrence._id,
        isRecurring: true,
        installmentNumber: recurrence.isInstallment ? recurrence.currentInstallment : null
      };

      if (recurrence.goalId) {
        const goal = await ModelGoal.findById(recurrence.goalId);
        if (goal) {
          // Lógica de Caixinha
          await ModelTransaction.create({
            ...transactionData,
            title: `Depósito: ${goal.name}`,
            type: 'saida',
            category: 'caixinha',
            goal: goal._id,
          });

          await ModelGoal.findByIdAndUpdate(goal._id, {
            $inc: { currentAmount: recurrence.amount }
          });
        }
      } else {
        // Transação Normal
        await ModelTransaction.create({
          ...transactionData,
          title: recurrence.title,
          type: recurrence.type,
          category: recurrence.category,
        });
      }

      // 4. LÓGICA DE PARCELAMENTO: Incrementar ou Finalizar
      if (recurrence.isInstallment) {
        if (recurrence.currentInstallment >= recurrence.totalInstallments) {
          // Se era a última parcela, desativa a regra
          recurrence = await ModelRecurrence.findByIdAndUpdate(
            recurrence._id,
            { 
              $inc: { currentInstallment: 1 }, 
              isActive: false, 
              status: 'completed' 
            },
            { new: true }
          );
        } else {
          // Se não, apenas sobe o contador para a próxima
          recurrence = await ModelRecurrence.findByIdAndUpdate(
            recurrence._id,
            { $inc: { currentInstallment: 1 } },
            { new: true }
          );
        }
      }
    }

    res.status(201).json({
      message: shouldCreateTransactionNow 
        ? "Regra criada e transação de hoje gerada!" 
        : "Regra agendada! Nenhuma transação necessária para hoje.",
      recurrence
    });

  } catch (error) {
    console.error("❌ Erro ao criar:", error);
    res.status(500).json({ message: "Erro ao criar recorrência", error: error.message });
  }
};

// @desc    Listar todas as recorrências (apenas as ativas por padrão ou todas)
export const getRecurrences = async (req, res) => {
  try {
    const recurrences = await ModelRecurrence.find({ user: req.user._id })
      .populate({
        path: 'goalId',
        select: 'name categoryGoal currentAmount',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json(recurrences || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Atualizar Regra
export const updateRecurrence = async (req, res) => {
  try {
    const updated = await ModelRecurrence.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Não encontrado" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Deletar Regra
export const deleteRecurrence = async (req, res) => {
  try {
    const deleted = await ModelRecurrence.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Não encontrado" });
    res.json({ message: 'Recorrência removida' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};