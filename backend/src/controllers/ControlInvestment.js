import ModelInvestment from '../models/ModelInvestment.js';
import Transaction from '../models/ModelTransaction.js';
import MarketPrice from '../models/ModelMarketPrice.js';
import axios from 'axios';

// --- FUNÇÃO AUXILIAR DE SINCRONIZAÇÃO (CACHE CENTRALIZADO) ---
// Esta função é interna e lida com a lógica de bater nas APIs e salvar no banco
const syncMarketPrices = async (tickers, investments) => {
  const now = new Date();
  const CACHE_TIME = 30 * 60 * 1000; // 30 minutos

  const existingPrices = await MarketPrice.find({ ticker: { $in: tickers } });
  
  const tickersToUpdate = tickers.filter(t => {
    const found = existingPrices.find(p => p.ticker === t);
    return !found || (now - new Date(found.lastUpdate)) > CACHE_TIME;
  });

  if (tickersToUpdate.length > 0) {
    try {
      const pricesMap = {};
      
      const cryptoTickers = tickersToUpdate.filter(t => 
        investments.find(inv => inv.ticker === t && inv.type?.toLowerCase() === 'criptomoedas')
      );
      const stockTickers = tickersToUpdate.filter(t => !cryptoTickers.includes(t));

      // BATCH CRIPTO (CoinGecko)
      if (cryptoTickers.length > 0) {
        const ids = cryptoTickers.map(t => {
          const lower = t.toLowerCase();
          return lower === 'btc' ? 'bitcoin' : lower === 'eth' ? 'ethereum' : lower;
        }).join(',');
        
        const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl`);
        
        Object.keys(data).forEach(id => {
          const tickerOriginal = id === 'bitcoin' ? 'BTC' : id === 'ethereum' ? 'ETH' : id.toUpperCase();
          pricesMap[tickerOriginal] = data[id].brl;
        });
      }

      // BATCH AÇÕES/FIIS (Brapi)
      if (stockTickers.length > 0) {
        const tickersString = stockTickers.join(',');
        const { data } = await axios.get(`https://brapi.dev/api/quote/${tickersString}`);
        data.results?.forEach(res => { 
          pricesMap[res.symbol.toUpperCase()] = res.regularMarketPrice; 
        });
      }

      const updatePromises = Object.keys(pricesMap).map(ticker => 
        MarketPrice.findOneAndUpdate(
          { ticker },
          { price: pricesMap[ticker], lastUpdate: now },
          { upsert: true, new: true }
        )
      );
      
      await Promise.all(updatePromises);
    } catch (err) {
      console.error("Erro ao sincronizar preços de mercado:", err.message);
    }
  }
};

// --- CONTROLLERS ---

// Busca preço individual para o frontend
export const getTickerPrice = async (req, res) => {
  try {
    const { ticker, type } = req.query;
    if (!ticker) return res.status(400).json({ message: "Ticker é obrigatório" });
    
    const tickerUpper = ticker.toUpperCase();
    await syncMarketPrices([tickerUpper], [{ ticker: tickerUpper, type }]);
    
    const priceData = await MarketPrice.findOne({ ticker: tickerUpper });
    res.json({ price: priceData?.price || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createInvestment = async (req, res) => {
  try {
    let { 
      name, ticker, type, amountInvested, quantity, 
      expectedProfitability, startDate, endDate, addAsTransaction 
    } = req.body;
    
    const investmentAmount = Number(amountInvested);
    let investmentQuantity = Number(quantity);
    const tickerUpper = ticker?.toUpperCase();

    if ((!investmentQuantity || investmentQuantity <= 0) && tickerUpper) {
      try {
        await syncMarketPrices([tickerUpper], [{ ticker: tickerUpper, type }]);
        const priceData = await MarketPrice.findOne({ ticker: tickerUpper });

        if (priceData && priceData.price > 0) {
          investmentQuantity = investmentAmount / priceData.price;
        }
      } catch (e) {
        console.error("Erro no cálculo automático de quantidade:", e.message);
      }
    }

    if (!investmentQuantity || investmentQuantity <= 0) investmentQuantity = 1;

    const newInvestment = await ModelInvestment.create({
      user: req.user.id,
      name,
      ticker: tickerUpper,
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
        title: `Aporte: ${tickerUpper || name}`, 
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

    const tickers = [...new Set(activeOnes
      .filter(inv => ['acoes', 'fiis', 'criptomoedas'].includes(inv.type?.toLowerCase()))
      .map(inv => inv.ticker)
    )].filter(Boolean);

    if (tickers.length > 0) {
      await syncMarketPrices(tickers, activeOnes);
    }

    const marketPrices = await MarketPrice.find({ ticker: { $in: tickers } });
    const priceMap = {};
    marketPrices.forEach(p => { priceMap[p.ticker] = p.price; });

    const now = new Date();
    const liveActiveInvestments = activeOnes.map(inv => {
      let currentUnitValue = priceMap[inv.ticker] || inv.purchasePrice || (inv.amountInvested / (inv.quantity || 1));
      const type = inv.type?.toLowerCase();

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
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const deleteInvestment = async (req, res) => {
  try {
    await ModelInvestment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ativo removido com sucesso' });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const liquidateInvestment = async (req, res) => {
  try {
    const { addAsIncome, sellPrice } = req.body;
    const investment = await ModelInvestment.findById(req.params.id);
    if (!investment) return res.status(404).json({ message: 'Investimento não encontrado' });

    let finalValue = sellPrice;

    if (!finalValue) {
      const type = investment.type?.toLowerCase();
      let currentUnitValue = investment.purchasePrice || (investment.amountInvested / (investment.quantity || 1));
      const now = new Date();

      if (['acoes', 'fiis', 'criptomoedas'].includes(type) && investment.ticker) {
        await syncMarketPrices([investment.ticker], [investment]);
        const marketData = await MarketPrice.findOne({ ticker: investment.ticker });
        if (marketData && marketData.price) currentUnitValue = marketData.price;
      } else if (type === 'renda fixa' && investment.startDate && investment.endDate) {
        const start = new Date(investment.startDate);
        const end = new Date(investment.endDate);
        const progressFactor = Math.max(0, Math.min((now - start) / (end - start), 1));
        const totalProfitRate = Number(investment.expectedProfitability || 0) / 100;
        const accruedProfitRate = totalProfitRate * progressFactor;
        currentUnitValue = (investment.amountInvested * (1 + accruedProfitRate)) / (investment.quantity || 1);
      }
      
      finalValue = parseFloat((currentUnitValue * (investment.quantity || 0)).toFixed(2));
    }

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
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};