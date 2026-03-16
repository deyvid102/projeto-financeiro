import ModelRecurrence from '../models/ModelRecurrence.js';
import ModelTransaction from '../models/ModelTransaction.js';

// @desc    Criar nova regra de recorrência + Gerar 1ª transação inteligente
// @route   POST /api/recurrences
export const createRecurrence = async (req, res) => {
  try {
    const data = { ...req.body, user: req.user._id };
    
    // 1. Criar a Regra
    const recurrence = await ModelRecurrence.create(data);

    // 2. Cálculo da data inteligente (conforme fizemos antes)
    const today = new Date();
    let scheduledDate = new Date();
    const targetDay = (Array.isArray(recurrence.dayOfMonth) && recurrence.dayOfMonth.length > 0)
      ? recurrence.dayOfMonth[0] : today.getDate();
    scheduledDate.setDate(targetDay);

    if (scheduledDate.getDate() < today.getDate()) {
      scheduledDate.setMonth(scheduledDate.getMonth() + 1);
    }

    // 3. Gerar a primeira transação com Categoria Dinâmica e Meta (Caixinha)
    await ModelTransaction.create({
      user: req.user._id,
      title: `${recurrence.title} ${recurrence.isInstallment ? '(1/' + recurrence.totalInstallments + ')' : ''}`,
      amount: recurrence.amount,
      type: recurrence.type,
      category: recurrence.category, // AGORA DINÂMICO
      goal: recurrence.goal || null, // VINCULA À CAIXINHA SE EXISTIR
      date: scheduledDate,
      recurrenceId: recurrence._id,
      isRecurring: true,
      installmentNumber: recurrence.isInstallment ? 1 : null
    });

    res.status(201).json(recurrence);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Listar todas as regras de recorrência ativas do usuário
// @route   GET /api/recurrences
export const getRecurrences = async (req, res) => {
  try {
    const recurrences = await ModelRecurrence.find({ 
      user: req.user._id, 
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.json(recurrences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Editar uma regra de recorrência
// @route   PUT /api/recurrences/:id
export const updateRecurrence = async (req, res) => {
  try {
    const recurrence = await ModelRecurrence.findById(req.params.id);

    if (!recurrence || recurrence.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Regra não encontrada' });
    }

    const updatedRecurrence = await ModelRecurrence.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedRecurrence);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Deletar a regra
// @route   DELETE /api/recurrences/:id
export const deleteRecurrence = async (req, res) => {
  try {
    const recurrence = await ModelRecurrence.findById(req.params.id);

    if (!recurrence || recurrence.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Regra não encontrada' });
    }

    await recurrence.deleteOne();
    res.json({ message: 'Recorrência interrompida. O histórico foi preservado.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};