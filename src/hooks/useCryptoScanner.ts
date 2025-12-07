import { useState, useCallback } from 'react';
import { Exchange, Timeframe, CryptoPair, calculateRSI, calculateStochRSI } from '@/lib/exchanges';

export type SortBy = 'stochrsi_desc' | 'stochrsi_asc' | 'rsi_desc' | 'rsi_asc' | 'volume_desc';

export function useCryptoScanner() {
  const [pairs, setPairs] = useState<CryptoPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const getAllSymbols = async (exchange: Exchange): Promise<string[]> => {
    try {
      switch (exchange) {
        case 'binance': {
          const res = await fetch('https://api.binance.com/api/v3/exchangeInfo');
          const data = await res.json();
          return data.symbols
            .filter((s: { status: string; symbol: string }) => s.status === 'TRADING' && s.symbol.endsWith('USDT'))
            .slice(0, 100)
            .map((s: { symbol: string }) => s.symbol);
        }
        case 'bybit': {
          const res = await fetch('https://api.bybit.com/v5/market/instruments-info?category=spot');
          const data = await res.json();
          return data.result.list
            .filter((s: { status: string; symbol: string }) => s.status === 'Trading' && s.symbol.endsWith('USDT'))
            .slice(0, 100)
            .map((s: { symbol: string }) => s.symbol);
        }
        case 'kucoin': {
          const res = await fetch('https://api.kucoin.com/api/v1/symbols');
          const data = await res.json();
          return data.data
            .filter((s: { enableTrading: boolean; symbol: string }) => s.enableTrading && s.symbol.endsWith('-USDT'))
            .slice(0, 100)
            .map((s: { symbol: string }) => s.symbol);
        }
        case 'gateio': {
          const res = await fetch('https://api.gateio.ws/api/v4/spot/currency_pairs');
          const data = await res.json();
          return data
            .filter((s: { trade_status: string; id: string }) => s.trade_status === 'tradable' && s.id.endsWith('_USDT'))
            .slice(0, 100)
            .map((s: { id: string }) => s.id);
        }
        case 'cryptocom': {
          const res = await fetch('https://api.crypto.com/exchange/v1/public/get-instruments');
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
          const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1');
          const data = await res.json();
          return data.map((coin: { id: string }) => coin.id);
        }
        case 'coincap': {
          const res = await fetch('https://api.coincap.io/v2/assets?limit=100');
          const data = await res.json();
          return data.data.map((coin: { id: string }) => coin.id);
        }
        case 'coinmarketcap':
        case 'coinlayer':
          // These require API keys, return empty for now
          return [];
        default:
          return [];
      }
    } catch (e) {
      console.error('Failed to fetch symbols:', e);
      return [];
    }
  };

  const fetchKlines = async (exchange: Exchange, symbol: string, timeframe: Timeframe): Promise<number[][] | null> => {
    const bybitIntervals: Record<Timeframe, string> = { '15m': '15', '30m': '30', '4h': '240', '12h': '720', '1d': 'D' };
    const gateioIntervals: Record<Timeframe, string> = { '15m': '15m', '30m': '30m', '4h': '4h', '12h': '12h', '1d': '1d' };
    
    try {
      switch (exchange) {
        case 'binance': {
          const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=100`);
          const data = await res.json();
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
          const res = await fetch(`https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=${bybitIntervals[timeframe]}&limit=100`);
          const data = await res.json();
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
          const res = await fetch(`https://api.kucoin.com/api/v1/market/candles?type=${timeframe}&symbol=${symbol}`);
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
        case 'gateio': {
          const res = await fetch(`https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=${symbol}&interval=${gateioIntervals[timeframe]}&limit=100`);
          const data = await res.json();
          return data.map((d: string[]) => [
            parseFloat(d[0]) * 1000,
            parseFloat(d[5]),
            parseFloat(d[3]),
            parseFloat(d[4]),
            parseFloat(d[2]),
            parseFloat(d[6])
          ]);
        }
        case 'cryptocom': {
          const interval = timeframe === '15m' ? '15m' : timeframe === '30m' ? '30m' : timeframe === '4h' ? '4h' : timeframe === '12h' ? '12h' : '1D';
          const res = await fetch(`https://api.crypto.com/exchange/v1/public/get-candlestick?instrument_name=${symbol}&timeframe=${interval}`);
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
          // CoinGecko uses days for historical data
          const days = timeframe === '1d' ? '100' : timeframe === '12h' ? '50' : timeframe === '4h' ? '20' : '7';
          const res = await fetch(`https://api.coingecko.com/api/v3/coins/${symbol}/market_chart?vs_currency=usd&days=${days}`);
          const data = await res.json();
          if (data.prices && data.total_volumes) {
            return data.prices.map((p: number[], i: number) => [
              p[0],
              p[1], // open (using price)
              p[1], // high (using price)
              p[1], // low (using price)
              p[1], // close (using price)
              data.total_volumes[i] ? data.total_volumes[i][1] : 0
            ]);
          }
          return null;
        }
        case 'coincap': {
          const interval = timeframe === '1d' ? 'd1' : timeframe === '12h' ? 'h12' : timeframe === '4h' ? 'h4' : 'h1';
          const res = await fetch(`https://api.coincap.io/v2/assets/${symbol}/history?interval=${interval}`);
          const data = await res.json();
          if (data.data) {
            return data.data.slice(-100).map((d: { time: number; priceUsd: string }) => [
              d.time,
              parseFloat(d.priceUsd),
              parseFloat(d.priceUsd),
              parseFloat(d.priceUsd),
              parseFloat(d.priceUsd),
              0
            ]);
          }
          return null;
        }
        default:
          return null;
      }
    } catch (e) {
      return null;
    }
  };

  const fetchPairData = async (exchange: Exchange, symbol: string, timeframe: Timeframe): Promise<CryptoPair | null> => {
    const klines = await fetchKlines(exchange, symbol, timeframe);
    if (!klines || klines.length < 50) return null;

    const closes = klines.map(k => k[4]);
    const volumes = klines.map(k => k[5]);

    const rsi = calculateRSI(closes, 14);
    const stochRsi = calculateStochRSI(closes, 14, 14);
    const latest = klines[klines.length - 1];

    let formattedSymbol = symbol;
    if (exchange === 'binance' || exchange === 'bybit') {
      formattedSymbol = symbol.replace('USDT', '/USDT');
    } else if (exchange === 'kucoin') {
      formattedSymbol = symbol.replace('-', '/');
    } else if (exchange === 'gateio') {
      formattedSymbol = symbol.replace('_', '/');
    } else if (exchange === 'cryptocom') {
      formattedSymbol = symbol.replace('_', '/');
    } else if (exchange === 'coingecko' || exchange === 'coincap') {
      formattedSymbol = symbol.toUpperCase() + '/USD';
    }

    return {
      symbol: formattedSymbol,
      price: latest[4],
      volume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      rsi,
      stochRsi
    };
  };

  const loadData = useCallback(async (exchange: Exchange, timeframe: Timeframe) => {
    setLoading(true);
    setPairs([]);
    setProgress({ current: 0, total: 0 });

    const symbols = await getAllSymbols(exchange);
    setProgress({ current: 0, total: symbols.length });

    const results: CryptoPair[] = [];
    const batchSize = 10;

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(symbol => fetchPairData(exchange, symbol, timeframe))
      );
      
      const validResults = batchResults.filter((r): r is CryptoPair => r !== null);
      results.push(...validResults);
      setProgress({ current: Math.min(i + batchSize, symbols.length), total: symbols.length });
      setPairs([...results]);
    }

    setLoading(false);
  }, []);

  const sortPairs = useCallback((pairsToSort: CryptoPair[], sortBy: SortBy): CryptoPair[] => {
    const sorted = [...pairsToSort];
    switch (sortBy) {
      case 'stochrsi_desc':
        return sorted.sort((a, b) => (b.stochRsi || 0) - (a.stochRsi || 0));
      case 'stochrsi_asc':
        return sorted.sort((a, b) => (a.stochRsi || 0) - (b.stochRsi || 0));
      case 'rsi_desc':
        return sorted.sort((a, b) => (b.rsi || 0) - (a.rsi || 0));
      case 'rsi_asc':
        return sorted.sort((a, b) => (a.rsi || 0) - (b.rsi || 0));
      case 'volume_desc':
        return sorted.sort((a, b) => b.volume - a.volume);
      default:
        return sorted;
    }
  }, []);

  const filterPairs = useCallback((pairsToFilter: CryptoPair[], searchQuery: string): CryptoPair[] => {
    if (!searchQuery.trim()) return pairsToFilter;
    const query = searchQuery.toLowerCase();
    return pairsToFilter.filter(p => p.symbol.toLowerCase().includes(query));
  }, []);

  return { pairs, loading, progress, loadData, sortPairs, filterPairs };
}
