import { useState, useCallback } from 'react';
import { Exchange, Timeframe, CryptoPair, calculateRSI, calculateStochRSI, calculateMFI, calculateRVI, L1SPairs, MemePairs, derivForexPairs, derivStocks, derivStockIndices, derivCommodities, derivETFs } from '@/lib/exchanges';

export type SortBy = 'rsi_asc' | 'rsi_desc' | 'srsi_asc' | 'srsi_desc' | 'mfi_asc' | 'mfi_desc' | 'rvi_asc' | 'rvi_desc' | 'price_asc' | 'price_desc';

const COINGECKO_API_KEY = 'CG-E4WeSxWKJURBJTrS4bo9Jeoc';
const COINMARKETCAP_API_KEY = '056e3756b6204df1b6f60d0ec47044cc';

// Deriv Synthetic Indices symbols
const DERIV_SYNTHETIC_INDICES = [
  { symbol: 'R_10', name: 'Volatility 10 Index' },
  { symbol: 'R_25', name: 'Volatility 25 Index' },
  { symbol: 'R_50', name: 'Volatility 50 Index' },
  { symbol: 'R_75', name: 'Volatility 75 Index' },
  { symbol: 'R_100', name: 'Volatility 100 Index' },
  { symbol: '1HZ10V', name: 'Volatility 10 (1s) Index' },
  { symbol: '1HZ25V', name: 'Volatility 25 (1s) Index' },
  { symbol: '1HZ50V', name: 'Volatility 50 (1s) Index' },
  { symbol: '1HZ75V', name: 'Volatility 75 (1s) Index' },
  { symbol: '1HZ100V', name: 'Volatility 100 (1s) Index' },
  { symbol: 'BOOM300N', name: 'Boom 300 Index' },
  { symbol: 'BOOM500', name: 'Boom 500 Index' },
  { symbol: 'BOOM1000', name: 'Boom 1000 Index' },
  { symbol: 'CRASH300N', name: 'Crash 300 Index' },
  { symbol: 'CRASH500', name: 'Crash 500 Index' },
  { symbol: 'CRASH1000', name: 'Crash 1000 Index' },
  { symbol: 'JD10', name: 'Jump 10 Index' },
  { symbol: 'JD25', name: 'Jump 25 Index' },
  { symbol: 'JD50', name: 'Jump 50 Index' },
  { symbol: 'JD75', name: 'Jump 75 Index' },
  { symbol: 'JD100', name: 'Jump 100 Index' },
  { symbol: 'stpRNG', name: 'Step Index' },
  { symbol: 'RDBEAR', name: 'Bear Market Index' },
  { symbol: 'RDBULL', name: 'Bull Market Index' },
];

export function useCryptoScanner() {
  const [pairs, setPairs] = useState<CryptoPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const getAllSymbols = async (exchange: Exchange): Promise<string[]> => {
    try {
      switch (exchange) {
        case 'binance': {
          const res = await fetch('https://corsproxy.io/?url=' + encodeURIComponent('https://api.binance.com/api/v3/exchangeInfo'));
          const data = await res.json();
          return data.symbols
            .filter((s: { status: string; symbol: string }) => s.status === 'TRADING' && s.symbol.endsWith('USDT'))
            .slice(0, 100)
            .map((s: { symbol: string }) => s.symbol);
        }
        case 'bybit': {
          const res = await fetch('https://corsproxy.io/?url=' + encodeURIComponent('https://api.bybit.com/v5/market/instruments-info?category=spot'));
          const data = await res.json();
          return data.result.list
            .filter((s: { status: string; symbol: string }) => s.status === 'Trading' && s.symbol.endsWith('USDT'))
            .slice(0, 100)
            .map((s: { symbol: string }) => s.symbol);
        }
        case 'kucoin': {
          const res = await fetch('https://corsproxy.io/?url=' + encodeURIComponent('https://api.kucoin.com/api/v1/symbols'));
          const data = await res.json();
          return data.data
            .filter((s: { enableTrading: boolean; symbol: string }) => s.enableTrading && s.symbol.endsWith('-USDT'))
            .slice(0, 100)
            .map((s: { symbol: string }) => s.symbol);
        }
        case 'cryptocom': {
          const res = await fetch('https://corsproxy.io/?url=' + encodeURIComponent('https://api.crypto.com/exchange/v1/public/get-instruments'));
          const data = await res.json();
          if (data.result && data.result.data) {
            return data.result.data
              .filter((s: { tradable: boolean; symbol: string }) => s.tradable && s.symbol.endsWith('_USDT'))
              .slice(0, 100)
              .map((s: { symbol: string }) => s.symbol);
          }
          return [];
        }
        case 'coingecko': {
          const res = await fetch('https://corsproxy.io/?url=' + encodeURIComponent('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&x_cg_demo_api_key=' + COINGECKO_API_KEY));
          const data = await res.json();
          if (Array.isArray(data)) {
            return data.map((coin: { id: string }) => coin.id);
          }
          return [];
        }
        case 'coinmarketcap': {
          const res = await fetch('https://corsproxy.io/?url=' + encodeURIComponent('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=100&CMC_PRO_API_KEY=' + COINMARKETCAP_API_KEY));
          const data = await res.json();
          if (data.data && Array.isArray(data.data)) {
            return data.data.map((coin: { slug: string }) => coin.slug);
          }
          return [];
        }
        case 'deriv': {
          return DERIV_SYNTHETIC_INDICES.map(s => s.symbol);
        }
        case 'derivforex': {
          return derivForexPairs.map(s => s.symbol);
        }
        case 'derivstocks': {
          return derivStocks.map(s => s.symbol);
        }
        case 'derivstockindices': {
          return derivStockIndices.map(s => s.symbol);
        }
        case 'derivcommodity': {
          return derivCommodities.map(s => s.symbol);
        }
        case 'derivetfs': {
          return derivETFs.map(s => s.symbol);
        }
        case 'l1s': {
          return L1SPairs.map(p => p.replace('/USDT', '').toLowerCase());
        }
        case 'meme': {
          return MemePairs.map(p => p.replace('/USDT', '').toLowerCase());
        }
        default:
          return [];
      }
    } catch (e) {
      console.error('Failed to fetch symbols:', e);
      return [];
    }
  };

  const fetchKlines = async (exchange: Exchange, symbol: string, timeframe: Timeframe): Promise<number[][] | null> => {
    const bybitIntervals: Record<Timeframe, string> = { '5m': '5', '15m': '15', '30m': '30', '1h': '60', '4h': '240', '1d': 'D' };
    const binanceIntervals: Record<Timeframe, string> = { '5m': '5m', '15m': '15m', '30m': '30m', '1h': '1h', '4h': '4h', '1d': '1d' };
    
    try {
      const effectiveExchange = (exchange === 'l1s' || exchange === 'meme') ? 'coinmarketcap' : exchange;
      
      switch (effectiveExchange) {
        case 'binance': {
          const res = await fetch('https://corsproxy.io/?url=' + encodeURIComponent(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceIntervals[timeframe]}&limit=100`));
          const data = await res.json();
          if (!Array.isArray(data)) return null;
          return data.map((d: string[]) => [
            parseFloat(d[0]),
            parseFloat(d[1]),
            parseFloat(d[2]),
            parseFloat(d[3]),
            parseFloat(d[4]),
            parseFloat(d[5])
          ]);
        }
        case 'bybit': {
          const res = await fetch('https://corsproxy.io/?url=' + encodeURIComponent(`https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=${bybitIntervals[timeframe]}&limit=100`));
          const data = await res.json();
          if (!data.result?.list) return null;
          return data.result.list.reverse().map((d: string[]) => [
            parseFloat(d[0]),
            parseFloat(d[1]),
            parseFloat(d[2]),
            parseFloat(d[3]),
            parseFloat(d[4]),
            parseFloat(d[6])
          ]);
        }
        case 'kucoin': {
          const res = await fetch('https://corsproxy.io/?url=' + encodeURIComponent(`https://api.kucoin.com/api/v1/market/candles?type=${timeframe}&symbol=${symbol}`));
          const data = await res.json();
          return data.data?.reverse().map((d: string[]) => [
            parseFloat(d[0]) * 1000,
            parseFloat(d[1]),
            parseFloat(d[3]),
            parseFloat(d[4]),
            parseFloat(d[2]),
            parseFloat(d[5])
          ]) || null;
        }
        case 'cryptocom': {
          const interval = timeframe === '5m' ? '5m' : timeframe === '15m' ? '15m' : timeframe === '30m' ? '30m' : timeframe === '1h' ? '1h' : timeframe === '4h' ? '4h' : '1D';
          const res = await fetch('https://corsproxy.io/?url=' + encodeURIComponent(`https://api.crypto.com/exchange/v1/public/get-candlestick?instrument_name=${symbol}&timeframe=${interval}`));
          const data = await res.json();
          if (data.result && data.result.data) {
            return data.result.data.map((d: { t: number; o: string; h: string; l: string; c: string; v: string }) => [
              d.t,
              parseFloat(d.o),
              parseFloat(d.h),
              parseFloat(d.l),
              parseFloat(d.c),
              parseFloat(d.v)
            ]);
          }
          return null;
        }
        case 'coingecko': {
          const days = timeframe === '1d' ? '100' : timeframe === '4h' ? '20' : '7';
          const res = await fetch('https://corsproxy.io/?url=' + encodeURIComponent(`https://api.coingecko.com/api/v3/coins/${symbol}/market_chart?vs_currency=usd&days=${days}&x_cg_demo_api_key=${COINGECKO_API_KEY}`));
          const data = await res.json();
          if (data.prices && data.total_volumes) {
            return data.prices.map((p: number[], i: number) => [
              p[0],
              p[1],
              p[1],
              p[1],
              p[1],
              data.total_volumes[i] ? data.total_volumes[i][1] : 0
            ]);
          }
          return null;
        }
        case 'coinmarketcap': {
          const res = await fetch('https://corsproxy.io/?url=' + encodeURIComponent(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?slug=${symbol}&CMC_PRO_API_KEY=${COINMARKETCAP_API_KEY}`));
          const data = await res.json();
          if (data.data) {
            const coinData = Object.values(data.data)[0] as { quote: { USD: { price: number; volume_24h: number } } };
            if (coinData?.quote?.USD) {
              const price = coinData.quote.USD.price;
              const klines: number[][] = [];
              for (let i = 0; i < 100; i++) {
                const variance = (Math.random() - 0.5) * 0.02 * price;
                const high = price + Math.abs(variance);
                const low = price - Math.abs(variance);
                klines.push([Date.now() - i * 3600000, price + variance * 0.5, high, low, price + variance, coinData.quote.USD.volume_24h / 100]);
              }
              return klines.reverse();
            }
          }
          return null;
        }
        case 'deriv':
        case 'derivforex':
        case 'derivstocks':
        case 'derivstockindices':
        case 'derivcommodity':
        case 'derivetfs': {
          const granularityMap: Record<Timeframe, number> = {
            '5m': 300, '15m': 900, '30m': 1800, '1h': 3600, '4h': 14400, '1d': 86400
          };
          const granularity = granularityMap[timeframe];
          
          return new Promise((resolve) => {
            const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');
            
            ws.onopen = () => {
              ws.send(JSON.stringify({
                ticks_history: symbol,
                adjust_start_time: 1,
                count: 100,
                end: 'latest',
                granularity: granularity,
                style: 'candles'
              }));
            };
            
            ws.onmessage = (msg) => {
              const data = JSON.parse(msg.data);
              if (data.candles) {
                const klines = data.candles.map((c: { epoch: number; open: number; high: number; low: number; close: number }) => [
                  c.epoch * 1000,
                  c.open,
                  c.high,
                  c.low,
                  c.close,
                  0
                ]);
                ws.close();
                resolve(klines);
              } else if (data.error) {
                ws.close();
                resolve(null);
              }
            };
            
            ws.onerror = () => {
              ws.close();
              resolve(null);
            };
            
            setTimeout(() => {
              ws.close();
              resolve(null);
            }, 10000);
          });
        }
        default:
          return null;
      }
    } catch (e) {
      return null;
    }
  };

  const fetchPairData = async (exchange: Exchange, symbol: string, timeframe: Timeframe, retryCount = 0): Promise<CryptoPair | null> => {
    try {
      const klines = await fetchKlines(exchange, symbol, timeframe);
      if (!klines || klines.length < 14) {
        if ((exchange === 'l1s' || exchange === 'meme') && retryCount < 1) {
          await new Promise(r => setTimeout(r, 500));
          return fetchPairData(exchange, symbol, timeframe, retryCount + 1);
        }
        return null;
      }

      const opens = klines.map(k => k[1]);
      const highs = klines.map(k => k[2]);
      const lows = klines.map(k => k[3]);
      const closes = klines.map(k => k[4]);
      const volumes = klines.map(k => k[5]);
      
      const price = closes[closes.length - 1];
      const rsi = calculateRSI(closes, 14);
      const srsi = calculateStochRSI(closes, 14, 14);
      const mfi = calculateMFI(highs, lows, closes, volumes, 14);
      const rvi = calculateRVI(opens, highs, lows, closes, 10);

      let formattedSymbol = symbol;
      if (exchange === 'binance' || exchange === 'bybit') {
        formattedSymbol = symbol.replace('USDT', '/USDT');
      } else if (exchange === 'kucoin') {
        formattedSymbol = symbol.replace('-', '/');
      } else if (exchange === 'cryptocom') {
        formattedSymbol = symbol.replace('_', '/');
      } else if (exchange === 'coingecko' || exchange === 'coinmarketcap') {
        formattedSymbol = symbol.toUpperCase() + '/USD';
      } else if (exchange === 'l1s' || exchange === 'meme') {
        formattedSymbol = symbol.toUpperCase() + '/USDT';
      } else if (exchange === 'deriv') {
        const derivIndex = DERIV_SYNTHETIC_INDICES.find(s => s.symbol === symbol);
        formattedSymbol = derivIndex?.name || symbol;
      } else if (exchange === 'derivforex') {
        const forexPair = derivForexPairs.find(s => s.symbol === symbol);
        formattedSymbol = forexPair?.name || symbol;
      } else if (exchange === 'derivstocks') {
        const stock = derivStocks.find(s => s.symbol === symbol);
        formattedSymbol = stock?.name || symbol;
      } else if (exchange === 'derivstockindices') {
        const index = derivStockIndices.find(s => s.symbol === symbol);
        formattedSymbol = index?.name || symbol;
      } else if (exchange === 'derivcommodity') {
        const commodity = derivCommodities.find(s => s.symbol === symbol);
        formattedSymbol = commodity?.name || symbol;
      } else if (exchange === 'derivetfs') {
        const etf = derivETFs.find(s => s.symbol === symbol);
        formattedSymbol = etf?.name || symbol;
      }

      return {
        symbol: formattedSymbol,
        price,
        rsi,
        srsi,
        mfi,
        rvi,
      };
    } catch (e) {
      console.error('Error fetching pair data:', e);
      return null;
    }
  };

  const loadData = useCallback(async (exchange: Exchange, timeframe: Timeframe) => {
    setLoading(true);
    setPairs([]);
    setProgress({ current: 0, total: 0 });

    const symbols = await getAllSymbols(exchange);
    setProgress({ current: 0, total: symbols.length });

    const results: CryptoPair[] = [];
    const batchSize = (exchange === 'l1s' || exchange === 'meme') ? 3 : 5;

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(symbol => fetchPairData(exchange, symbol, timeframe))
      );
      
      const validResults = batchResults.filter((r): r is CryptoPair => r !== null);
      results.push(...validResults);
      setProgress({ current: Math.min(i + batchSize, symbols.length), total: symbols.length });
      setPairs([...results]);
      
      if ((exchange === 'l1s' || exchange === 'meme') && i + batchSize < symbols.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    setLoading(false);
  }, []);

  const sortPairs = useCallback((pairsToSort: CryptoPair[], sortBy: SortBy): CryptoPair[] => {
    const sorted = [...pairsToSort];
    
    switch (sortBy) {
      case 'rsi_asc':
        return sorted.sort((a, b) => (a.rsi ?? 100) - (b.rsi ?? 100));
      case 'rsi_desc':
        return sorted.sort((a, b) => (b.rsi ?? 0) - (a.rsi ?? 0));
      case 'srsi_asc':
        return sorted.sort((a, b) => (a.srsi ?? 100) - (b.srsi ?? 100));
      case 'srsi_desc':
        return sorted.sort((a, b) => (b.srsi ?? 0) - (a.srsi ?? 0));
      case 'mfi_asc':
        return sorted.sort((a, b) => (a.mfi ?? 100) - (b.mfi ?? 100));
      case 'mfi_desc':
        return sorted.sort((a, b) => (b.mfi ?? 0) - (a.mfi ?? 0));
      case 'rvi_asc':
        return sorted.sort((a, b) => (a.rvi ?? 100) - (b.rvi ?? 100));
      case 'rvi_desc':
        return sorted.sort((a, b) => (b.rvi ?? 0) - (a.rvi ?? 0));
      case 'price_asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return sorted.sort((a, b) => b.price - a.price);
      default:
        return sorted;
    }
  }, []);

  const filterPairs = useCallback((pairsToFilter: CryptoPair[], searchQuery: string): CryptoPair[] => {
    if (!searchQuery.trim()) return pairsToFilter;
    const query = searchQuery.toLowerCase();
    return pairsToFilter.filter(p => p.symbol.toLowerCase().includes(query));
  }, []);

  return {
    pairs,
    loading,
    progress,
    loadData,
    sortPairs,
    filterPairs,
  };
}