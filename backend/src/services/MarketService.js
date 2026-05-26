import MarketPrice from '../models/ModelMarketPrice.js';
import axios from 'axios';

const normalizeTicker = (ticker) => ticker?.toString().trim().toUpperCase();

const logAxiosError = (source, err, url) => {
  console.error(`[MarketService] ${source} request failed:`, err.message);
  if (err.response) {
    console.error(`[MarketService] ${source} response status:`, err.response.status);
    console.error(`[MarketService] ${source} response data:`, err.response.data);
  }
  if (err.request) {
    console.error(`[MarketService] ${source} no response, request details:`, err.request?.path ?? url ?? err.config?.url);
  }
  if (err.config) {
    console.error(`[MarketService] ${source} request config:`, {
      url: err.config.url,
      method: err.config.method,
      params: err.config.params,
      headers: err.config.headers,
    });
  }
};

const mapCryptoId = (ticker) => {
  const lower = ticker.toLowerCase();
  if (lower === 'btc') return 'bitcoin';
  if (lower === 'eth') return 'ethereum';
  if (lower === 'bnb') return 'binancecoin';
  return lower;
};

const fetchBrapiPrices = async (tickers) => {
  if (tickers.length === 0) return {};
  const brapiToken = process.env.BRAPI_TOKEN?.trim();
  if (!brapiToken) {
    console.warn('[MarketService] BRAPI_TOKEN not configured; skipping Brapi lookup.');
    return {};
  }

  const tickersString = tickers.join(',');
  const url = `https://brapi.dev/api/quote/${encodeURIComponent(tickersString)}?token=${encodeURIComponent(brapiToken)}`;

  try {
    const { data } = await axios.get(url);
    const map = {};

    data.results?.forEach((res) => {
      const symbol = normalizeTicker(res.symbol);
      if (symbol && Number.isFinite(res.regularMarketPrice) && res.regularMarketPrice > 0) {
        const baseSymbol = symbol.replace(/\.SA$/, '');
        map[baseSymbol] = res.regularMarketPrice;
        map[symbol] = res.regularMarketPrice;
      }
    });

    return map;
  } catch (err) {
    logAxiosError('Brapi', err, url);
    return {};
  }
};

const fetchAlphaVantagePrices = async (tickers) => {
  if (tickers.length === 0) return {};
  const apiKey = process.env.ALPHA_VANTAGE_KEY?.trim();
  if (!apiKey) return {};

  const map = {};
  for (const rawTicker of tickers) {
    const ticker = normalizeTicker(rawTicker);
    if (!ticker) continue;
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${encodeURIComponent(apiKey)}`;
    try {
      const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const quote = data['Global Quote'];
      const price = quote?.['05. price'] ? Number(quote['05. price']) : null;
      if (Number.isFinite(price) && price > 0) {
        map[ticker] = price;
      }
    } catch (err) {
      logAxiosError('AlphaVantage', err, url);
    }
  }
  return map;
};

const fetchStooqPrices = async (tickers) => {
  if (tickers.length === 0) return {};

  const queryTickers = [...new Set(tickers.flatMap((t) => {
    const raw = normalizeTicker(t);
    const withSa = raw.endsWith('.SA') ? raw : `${raw}.SA`;
    return [raw, withSa];
  }))].join(',');

  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(queryTickers)}&f=sd2t2ohlcv&h&e=csv`;
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const lines = data.toString().split('\n').filter(Boolean);
    const map = {};

    lines.slice(1).forEach((line) => {
      const [symbol, date, time, open, high, low, close] = line.split(',');
      const normalizedSymbol = normalizeTicker(symbol);
      const price = Number(close);
      if (normalizedSymbol && close !== 'N/D' && Number.isFinite(price) && price > 0) {
        const baseSymbol = normalizedSymbol.replace(/\.SA$/, '');
        map[baseSymbol] = price;
        map[normalizedSymbol] = price;
      }
    });

    return map;
  } catch (err) {
    logAxiosError('Stooq', err, url);
    return {};
  }
};

const fetchYahooPrices = async (tickers) => {
  if (tickers.length === 0) return {};

  const queryTickers = [...new Set(tickers.flatMap((t) => {
    const raw = normalizeTicker(t);
    const withSa = raw.endsWith('.SA') ? raw : `${raw}.SA`;
    return [raw, withSa];
  }))].join(',');

  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(queryTickers)}`;
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      },
    });

    const map = {};
    data?.quoteResponse?.result?.forEach((item) => {
      const symbol = normalizeTicker(item.symbol);
      if (symbol && Number.isFinite(item.regularMarketPrice) && item.regularMarketPrice > 0) {
        const baseSymbol = symbol.replace(/\.SA$/, '');
        map[baseSymbol] = item.regularMarketPrice;
        map[symbol] = item.regularMarketPrice;
      }
    });

    return map;
  } catch (err) {
    logAxiosError('Yahoo', err, url);
    return {};
  }
};

export const syncMarketPrices = async (tickers, investments = []) => {
  const CACHE_TIME = 30 * 60 * 1000; // 30 minutos
  const now = new Date();
  const normalizedTickers = [...new Set(tickers.map(normalizeTicker).filter(Boolean))];

  if (normalizedTickers.length === 0) return;

  const existingPrices = await MarketPrice.find({ ticker: { $in: normalizedTickers } });
  const expiredTickers = normalizedTickers.filter((ticker) => {
    const found = existingPrices.find((p) => p.ticker === ticker);
    return !found || now - new Date(found.lastUpdate) > CACHE_TIME;
  });

  if (expiredTickers.length === 0) return;

  try {
    const pricesMap = {};
    const cryptoTickers = expiredTickers.filter((ticker) =>
      investments.some((inv) => normalizeTicker(inv.ticker) === ticker && inv.type?.toLowerCase() === 'criptomoedas')
    );
    const stockTickers = expiredTickers.filter((ticker) => !cryptoTickers.includes(ticker));

    if (cryptoTickers.length > 0) {
      const ids = cryptoTickers.map(mapCryptoId).join(',');
      const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=brl`);
      cryptoTickers.forEach((ticker) => {
        const id = mapCryptoId(ticker);
        const price = data[id]?.brl;
        if (Number.isFinite(price) && price > 0) pricesMap[ticker] = price;
      });
    }

    if (stockTickers.length > 0) {
      const brapiPrices = await fetchBrapiPrices(stockTickers);
      Object.assign(pricesMap, brapiPrices);

      const missingAfterBrapi = stockTickers.filter((ticker) => !pricesMap[ticker]);
      if (missingAfterBrapi.length > 0) {
        const brapiFallbackPrices = await fetchBrapiPrices(missingAfterBrapi.map((ticker) => `${ticker}.SA`));
        Object.assign(pricesMap, brapiFallbackPrices);
      }

      let stillMissing = stockTickers.filter((ticker) => !pricesMap[ticker]);
      if (stillMissing.length > 0) {
        const alphaPrices = await fetchAlphaVantagePrices(stillMissing);
        Object.assign(pricesMap, alphaPrices);
        stillMissing = stockTickers.filter((ticker) => !pricesMap[ticker]);
      }

      if (stillMissing.length > 0) {
        const stooqPrices = await fetchStooqPrices(stillMissing);
        Object.assign(pricesMap, stooqPrices);
        stillMissing = stockTickers.filter((ticker) => !pricesMap[ticker]);
      }

      if (stillMissing.length > 0) {
        const yahooPrices = await fetchYahooPrices(stillMissing);
        Object.assign(pricesMap, yahooPrices);
      }
    }

    const updatePromises = Object.keys(pricesMap).map(async (ticker) => {
      const investment = investments.find((inv) => normalizeTicker(inv.ticker) === ticker);
      await MarketPrice.findOneAndUpdate(
        { ticker },
        {
          price: pricesMap[ticker],
          lastUpdate: now,
          type: investment?.type?.toLowerCase() || 'acoes',
        },
        { upsert: true, new: true }
      );
    });

    await Promise.all(updatePromises);
  } catch (err) {
    console.error('Erro na sincronização de preços de mercado:', err.message);
    console.error('MarketService sync tickers:', normalizedTickers);
    if (err.response) {
      console.error('MarketService response status:', err.response.status);
      console.error('MarketService response data:', err.response.data);
    } else if (err.request) {
      console.error('MarketService no response from request:', err.request?.path ?? err.config?.url);
    }
    if (err.config) {
      console.error('MarketService failed request config:', {
        url: err.config.url,
        method: err.config.method,
        params: err.config.params,
        headers: err.config.headers,
      });
    }
  }
};
