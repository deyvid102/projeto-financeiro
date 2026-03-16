import ModelInvestment from '../models/ModelInvestment.js';
import Transaction from '../models/ModelTransaction.js';

// 1. Criar Investimento
export const createInvestment = async (req, res) => {
  try {
    const { name, type, amountInvested, expectedProfitability, startDate, endDate, addAsTransaction } = req.body;
    
    const newInvestment = await ModelInvestment.create({
      user: req.user.id,
      name,
      type,
      amountInvested,
      currentValue: amountInvested, // Inicializa com o valor investido
      expectedProfitability,
      startDate,
      endDate,
      status: 'em andamento'
    });

    // Se marcou o checkbox no Modal, gera a SAÍDA com título padronizado
    if (addAsTransaction) {
      await Transaction.create({
        user: req.user.id,
        title: `Investimento: ${name}`, 
        amount: amountInvested,
        type: 'saida',
        category: 'Investimento',
        date: startDate || new Date()
      });
    }
    
    res.status(201).json(newInvestment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Listar Investimentos
export const getInvestments = async (req, res) => {
  try {
    const investments = await ModelInvestment.find({ user: req.user.id }).sort({ startDate: -1 });
    res.json(investments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Atualizar (PUT)
export const updateInvestmentValue = async (req, res) => {
  try {
    const investment = await ModelInvestment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(investment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Deletar
export const deleteInvestment = async (req, res) => {
  try {
    await ModelInvestment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Liquidar (Finalizar)
export const liquidateInvestment = async (req, res) => {
  try {
    const { addAsIncome } = req.body;
    const investment = await ModelInvestment.findById(req.params.id);
    
    if (!investment) return res.status(404).json({ message: 'Investimento não encontrado' });

    investment.status = 'finalizado';
    await investment.save();

    // Se marcou para registrar entrada no resgate, gera a ENTRADA com título padronizado
    if (addAsIncome) {
      const finalValue = investment.amountInvested * (1 + (investment.expectedProfitability / 100));
      
      await Transaction.create({
        user: req.user.id,
        title: `Investimento: ${investment.name}`, 
        amount: parseFloat(finalValue.toFixed(2)),
        type: 'entrada',
        category: 'Investimento',
        date: new Date()
      });
    }
    
    res.json(investment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};