import ModelInvestment from '../models/ModelInvestment.js';

// @desc    Registrar um novo investimento
// @route   POST /api/investments
export const createInvestment = async (req, res) => {
  try {
    const { name, type, amountInvested, currentValue, purchaseDate, maturityDate } = req.body;

    const investment = new ModelInvestment({
      user: req.user._id, // ID vindo do middleware de proteção
      name,
      type,
      amountInvested,
      currentValue: currentValue || amountInvested, // Se não passar valor atual, assume o investido
      purchaseDate,
      maturityDate,
    });

    const createdInvestment = await investment.save();
    res.status(201).json(createdInvestment);
  } catch (error) {
    res.status(500).json({ message: `Erro ao registrar investimento: ${error.message}` });
  }
};

// @desc    Listar todos os investimentos do usuário
// @route   GET /api/investments
export const getInvestments = async (req, res) => {
  try {
    const investments = await ModelInvestment.find({ user: req.user._id }).sort({ purchaseDate: -1 });
    
    // Cálculo básico de resumo para enviar junto (opcional)
    const totalInvested = investments.reduce((acc, item) => acc + item.amountInvested, 0);
    const totalCurrent = investments.reduce((acc, item) => acc + item.currentValue, 0);

    res.json({
      investments,
      summary: {
        totalInvested,
        totalCurrent,
        profit: totalCurrent - totalInvested
      }
    });
  } catch (error) {
    res.status(500).json({ message: `Erro ao buscar investimentos: ${error.message}` });
  }
};

// @desc    Atualizar o valor atual de um investimento (Mark-to-market)
// @route   PUT /api/investments/:id
export const updateInvestmentValue = async (req, res) => {
  try {
    const { currentValue } = req.body;
    const investment = await ModelInvestment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({ message: 'Investimento não encontrado.' });
    }

    if (investment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    investment.currentValue = currentValue;
    const updatedInvestment = await investment.save();

    res.json(updatedInvestment);
  } catch (error) {
    res.status(500).json({ message: `Erro ao atualizar investimento: ${error.message}` });
  }
};

// @desc    Remover um investimento
// @route   DELETE /api/investments/:id
export const deleteInvestment = async (req, res) => {
  try {
    const investment = await ModelInvestment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({ message: 'Investimento não encontrado.' });
    }

    if (investment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    await investment.deleteOne();
    res.json({ message: 'Investimento removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: `Erro ao deletar investimento: ${error.message}` });
  }
};