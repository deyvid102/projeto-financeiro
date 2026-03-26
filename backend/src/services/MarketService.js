import MarketPrice from '../models/ModelMarketPrice.js';
import axios from 'axios';

export const syncMarketPrices = async (tickers, type) => {
  const CACHE_TIME = 30 * 60 * 1000; // 30 minutos
  const now = new Date();
  
  // 1. Verificar quais tickers na tabela estão expirados ou não existem
  const existingPrices = await MarketPrice.find({ ticker: { $in: tickers } });
  
  const expiredTickers = tickers.filter(t => {
    const found = existingPrices.find(p => p.ticker === t);
    return !found || (now - new Date(found.lastUpdate)) > CACHE_TIME;
  });

  if (expiredTickers.length > 0) {
    try {
      // Lógica de BATCH (CoinGecko para cripto, Brapi para ações)
      // Após buscar nas APIs, use findOneAndUpdate com upsert: true
      // para atualizar a tabela MarketPrice.
      console.log(`Atualizando tickers: ${expiredTickers}`);
    } catch (err) {
      console.error("Erro na sincronização:", err.message);
    }
  }
};