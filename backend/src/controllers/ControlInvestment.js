import ModelInvestment from '../models/ModelInvestment.js';
import Transaction from '../models/ModelTransaction.js';
import axios from 'axios';

// --- FUNÇÃO AUXILIAR DE MERCADO ATUAL ---
const fetchMarketPrices = async (investments) => {
  const now = new Date();

  return await Promise.all(investments.map(async (inv) => {
    let currentUnitValue = inv.purchasePrice || (inv.amountInvested / (inv.quantity || 1));
    const ticker = inv.ticker?.trim();
    const type = inv.type?.toLowerCase();

    try {
      // 1. CRIPTOMOEDAS
      if (type === 'criptomoedas' && ticker) {
        const coinId = ticker.toLowerCase() === 'btc' ? 'bitcoin' : 
                       ticker.toLowerCase() === 'eth' ? 'ethereum' : ticker.toLowerCase();
        
        const { data } = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=brl`
        );
        if (data[coinId]) {
          currentUnitValue = data[coinId].brl;
        }
      } 
      // 2. AÇÕES e FIIS
      else if ((type === 'acoes' || type === 'fiis') && ticker) {
        const { data } = await axios.get(`https://brapi.dev/api/quote/${ticker.toUpperCase()}`);
        if (data.results?.[0]) {
          currentUnitValue = data.results[0].regularMarketPrice;
        }
      }
      // 3. RENDA FIXA (Cálculo de Progressão Linear Exata)
      else if (type === 'renda fixa' && inv.startDate && inv.endDate) {
        const start = new Date(inv.startDate);
        const end = new Date(inv.endDate);
        
        const totalDuration = end.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();

        if (totalDuration > 0) {
          // Calcula o fator de progresso (0 a 1)
          const progressFactor = Math.max(0, Math.min(elapsed / totalDuration, 1));
          
          // Rentabilidade total contratada (Ex: 20)
          const totalProfitRate = Number(inv.expectedProfitability || 0) / 100;
          
          // Lucro acumulado até hoje (Ex: se passou 50% do tempo, ganha 50% dos 20%)
          const accruedProfitRate = totalProfitRate * progressFactor;
          
          // Valor Total Atual = Investido + (Investido * Taxa Acumulada)
          const currentTotalValueCalculated = inv.amountInvested * (1 + accruedProfitRate);
          
          // Define o valor unitário baseado nesse crescimento
          currentUnitValue = currentTotalValueCalculated / (inv.quantity || 1);
        }
      }
    } catch (err) {
      console.error(`Falha ao atualizar ticker ${ticker}:`, err.message);
    }

    const obj = inv.toObject({ virtuals: true });
    
    // RESULTADOS FINAIS
    obj.currentUnitValue = parseFloat(Number(currentUnitValue).toFixed(8));
    obj.currentTotalValue = parseFloat((currentUnitValue * (inv.quantity || 0)).toFixed(2));
    obj.totalProfit = parseFloat((obj.currentTotalValue - inv.amountInvested).toFixed(2));
    
    obj.profitPercentage = inv.amountInvested > 0 
      ? parseFloat(((obj.totalProfit / inv.amountInvested) * 100).toFixed(2)) 
      : 0;
    
    return obj;
  }));
};

// 1. Criar Investimento
export const createInvestment = async (req, res) => {
  try {
    let { 
      name, ticker, type, amountInvested, quantity, 
      expectedProfitability, startDate, endDate, addAsTransaction 
    } = req.body;
    
    const investmentAmount = Number(amountInvested);
    let investmentQuantity = Number(quantity);
    const typeLower = type?.toLowerCase();

    // LÓGICA DE AUTO-CÁLCULO DE COTAS (Cripto, Ações e FIIs)
    if ((!investmentQuantity || investmentQuantity <= 0) && ticker) {
      try {
        let marketPriceNow = 0;

        if (typeLower === 'criptomoedas') {
          const coinId = ticker.toLowerCase() === 'btc' ? 'bitcoin' : 
                         ticker.toLowerCase() === 'eth' ? 'ethereum' : ticker.toLowerCase();
          const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=brl`);
          marketPriceNow = data[coinId]?.brl;
        } 
        else if (typeLower === 'acoes' || typeLower === 'fiis') {
          const { data } = await axios.get(`https://brapi.dev/api/quote/${ticker.toUpperCase()}`);
          marketPriceNow = data.results?.[0]?.regularMarketPrice;
        }

        if (marketPriceNow > 0) {
          investmentQuantity = investmentAmount / marketPriceNow;
        }
      } catch (e) {
        console.error("Erro ao buscar cotação inicial:", e.message);
      }
    }

    // Fallback padrão
    if (!investmentQuantity || investmentQuantity <= 0) investmentQuantity = 1;

    const newInvestment = await ModelInvestment.create({
      user: req.user.id,
      name,
      ticker: ticker?.toUpperCase(),
      type,
      amountInvested: investmentAmount,
      quantity: investmentQuantity,
      purchasePrice: investmentAmount / investmentQuantity,
      expectedProfitability: Number(expectedProfitability) || 0,
      startDate: startDate || new Date(),
      endDate,
      status: 'em andamento'
    });

    if (addAsTransaction) {
      await Transaction.create({
        user: req.user.id,
        title: `Aporte: ${ticker || name}`, 
        amount: investmentAmount,
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

// ... Restante das funções (getInvestments, update, delete, liquidate) permanecem as mesmas
export const getInvestments = async (req, res) => {
  try {
    const allInvestments = await ModelInvestment.find({ user: req.user.id }).sort({ startDate: -1 });
    const activeOnes = allInvestments.filter(inv => inv.status === 'em andamento');
    const finishedOnes = allInvestments.filter(inv => inv.status !== 'em andamento');
    const liveActiveInvestments = await fetchMarketPrices(activeOnes);
    const formattedFinished = finishedOnes.map(inv => inv.toObject({ virtuals: true }));
    res.json([...liveActiveInvestments, ...formattedFinished]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateInvestmentValue = async (req, res) => {
  try {
    const investment = await ModelInvestment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(investment);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const deleteInvestment = async (req, res) => {
  try {
    await ModelInvestment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ativo removido com sucesso' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const liquidateInvestment = async (req, res) => {
  try {
    const { addAsIncome, sellPrice } = req.body;
    const investment = await ModelInvestment.findById(req.params.id);
    if (!investment) return res.status(404).json({ message: 'Investimento não encontrado' });

    const [calculatedInv] = await fetchMarketPrices([investment]);
    const finalValue = sellPrice || calculatedInv.currentTotalValue;

    investment.status = 'sacado';
    investment.sellPrice = finalValue; 
    await investment.save();

    if (addAsIncome) {
      await Transaction.create({
        user: req.user.id,
        title: `Resgate: ${investment.ticker || investment.name}`, 
        amount: parseFloat(Number(finalValue).toFixed(2)),
        type: 'entrada',
        category: 'Investimento',
        date: new Date()
      });
    }
    res.json(investment);
  } catch (error) { res.status(500).json({ message: error.message }); }
};