import ModelInvestment from '../models/ModelInvestment.js';
import Transaction from '../models/ModelTransaction.js';
import axios from 'axios';

// --- FUNÇÃO AUXILIAR COM CACHE E BATCHING ---
const fetchMarketPrices = async (investments) => {
  const now = new Date();
  const CACHE_TIME = 6 * 60 * 60 * 1000; // 6 horas

  // 1. Separar ativos que precisam de atualização externa e estão com cache vencido
  const needsUpdate = investments.filter(inv => {
    const type = inv.type?.toLowerCase();
    const isMarketAsset = ['criptomoedas', 'acoes', 'fiis'].includes(type);
    const isExpired = !inv.lastUpdate || (now - new Date(inv.lastUpdate)) > CACHE_TIME;
    return isMarketAsset && inv.ticker && isExpired;
  });

  const pricesMap = {};

  // 2. Se houver ativos vencidos, busca nas APIs em lote
  if (needsUpdate.length > 0) {
    try {
      // BATCH CRIPTO (CoinGecko)
      const cryptoAssets = needsUpdate.filter(inv => inv.type?.toLowerCase() === 'criptomoedas');
      if (cryptoAssets.length > 0) {
        const ids = cryptoAssets.map(inv => {
          const t = inv.ticker.toLowerCase();
          return t === 'btc' ? 'bitcoin' : t === 'eth' ? 'ethereum' : t;
        }).join(',');
        const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl`);
        Object.keys(data).forEach(id => { pricesMap[id] = data[id].brl; });
      }

      // BATCH AÇÕES/FIIS (Brapi)
      const stockAssets = needsUpdate.filter(inv => ['acoes', 'fiis'].includes(inv.type?.toLowerCase()));
      if (stockAssets.length > 0) {
        const tickers = stockAssets.map(inv => inv.ticker.toUpperCase()).join(',');
        const { data } = await axios.get(`https://brapi.dev/api/quote/${tickers}`);
        data.results?.forEach(res => { pricesMap[res.symbol.toUpperCase()] = res.regularMarketPrice; });
      }

      // SALVAR NO BANCO (Atualiza o cache para a próxima vez)
      await Promise.all(needsUpdate.map(async (inv) => {
        const type = inv.type?.toLowerCase();
        const tickerKey = type === 'criptomoedas' 
          ? (inv.ticker.toLowerCase() === 'btc' ? 'bitcoin' : inv.ticker.toLowerCase() === 'eth' ? 'ethereum' : inv.ticker.toLowerCase())
          : inv.ticker.toUpperCase();

        if (pricesMap[tickerKey]) {
          inv.lastPrice = pricesMap[tickerKey];
          inv.lastUpdate = now;
          await inv.save();
        }
      }));
    } catch (err) {
      console.error("Erro ao atualizar APIs (usando valores antigos):", err.message);
    }
  }

  // 3. Processamento Final para o Front-end
  return investments.map((inv) => {
    let currentUnitValue = inv.lastPrice || inv.purchasePrice || (inv.amountInvested / (inv.quantity || 1));
    const type = inv.type?.toLowerCase();

    // Renda Fixa (Cálculo matemático local, sem API)
    if (type === 'renda fixa' && inv.startDate && inv.endDate) {
      const start = new Date(inv.startDate);
      const end = new Date(inv.endDate);
      const progressFactor = Math.max(0, Math.min((now - start) / (end - start), 1));
      const totalProfitRate = Number(inv.expectedProfitability || 0) / 100;
      const accruedProfitRate = totalProfitRate * progressFactor;
      currentUnitValue = (inv.amountInvested * (1 + accruedProfitRate)) / (inv.quantity || 1);
    }

    const obj = inv.toObject({ virtuals: true });
    obj.currentUnitValue = parseFloat(Number(currentUnitValue).toFixed(8));
    obj.currentTotalValue = parseFloat((currentUnitValue * (inv.quantity || 0)).toFixed(2));
    obj.totalProfit = parseFloat((obj.currentTotalValue - inv.amountInvested).toFixed(2));
    obj.profitPercentage = inv.amountInvested > 0 
      ? parseFloat(((obj.totalProfit / inv.amountInvested) * 100).toFixed(2)) 
      : 0;
    
    return obj;
  });
};

// --- CONTROLLERS ---

export const createInvestment = async (req, res) => {
  try {
    let { 
      name, ticker, type, amountInvested, quantity, 
      expectedProfitability, startDate, endDate, addAsTransaction 
    } = req.body;
    
    const investmentAmount = Number(amountInvested);
    let investmentQuantity = Number(quantity);
    const typeLower = type?.toLowerCase();

    // Busca preço inicial apenas se não houver quantidade informada
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
        if (marketPriceNow > 0) investmentQuantity = investmentAmount / marketPriceNow;
      } catch (e) {
        console.error("Erro na cotação inicial:", e.message);
      }
    }

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
      status: 'em andamento',
      lastPrice: investmentAmount / investmentQuantity, // Inicia o cache com o preço de compra
      lastUpdate: new Date()
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