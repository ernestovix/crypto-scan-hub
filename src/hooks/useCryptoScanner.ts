import { useState, useCallback } from 'react';
import { Exchange, Timeframe, CryptoPair, calculateRSI, calculateMFI } from '@/lib/exchanges';

export type SortBy = 'mfi_desc' | 'mfi_asc' | 'rsi_desc' | 'rsi_asc' | 'volume_desc';

export function useCryptoScanner() {
  const [pairs, setPairs] = useState<CryptoPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const getAllSymbols = async (exchange: Exchange): Promise<string[]> => {
    const endpoints: Record<Exchange, string> = {
      binance: 'https://api.binance.com/api/v3/exchangeInfo',
      bybit: 'https://api.bybit.com/v5/market/instruments-info?category=spot',
      kucoin: 'https://api.kucoin.com/api/v1/symbols',
      cryptocom: 'https://api.crypto.com/v2/public/get-ticker',
      gateio: 'https://api.gateio.ws/api/v4/spot/currency_pairs'
    };

    try {
      const res = await fetch(endpoints[exchange]);
      const data = await res.json();

      switch (exchange) {
        case 'binance':
          return data.symbols
            .filter((s: { status: string; symbol: string }) => s.status === 'TRADING' && s.symbol.endsWith('USDT'))
            .slice(0, 100)
            .map((s: { symbol: string }) => s.symbol);
        case 'bybit':
          return data.result.list
            .filter((s: { status: string; symbol: string }) => s.status === 'Trading' && s.symbol.endsWith('USDT'))
            .slice(0, 100)
            .map((s: { symbol: string }) => s.symbol);
        case 'kucoin':
          return data.data
            .filter((s: { enableTrading: boolean; symbol: string }) => s.enableTrading && s.symbol.endsWith('-USDT'))
            .slice(0, 100)
            .map((s: { symbol: string }) => s.symbol);
        case 'gateio':
          return data
            .filter((s: { trade_status: string; id: string }) => s.trade_status === 'tradable' && s.id.endsWith('_USDT'))
            .slice(0, 100)
            .map((s: { id: string }) => s.id);
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
    
    const urls: Record<Exchange, string> = {
      binance: `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=100`,
      bybit: `https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=${bybitIntervals[timeframe]}&limit=100`,
      kucoin: `https://api.kucoin.com/api/v1/market/candles?type=${timeframe}&symbol=${symbol}`,
      cryptocom: '',
      gateio: `https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=${symbol}&interval=${timeframe}&limit=100`
    };

    try {
      const res = await fetch(urls[exchange]);
      const data = await res.json();

      switch (exchange) {
        case 'binance':
          return data.map((d: string[]) => [
            parseFloat(d[0]),
            parseFloat(d[1]),
            parseFloat(d[2]),
            parseFloat(d[3]),
            parseFloat(d[4]),
            parseFloat(d[5])
          ]);
        case 'bybit':
          return data.result.list.reverse().map((d: string[]) => [
            parseFloat(d[0]),
            parseFloat(d[1]),
            parseFloat(d[2]),
            parseFloat(d[3]),
            parseFloat(d[4]),
            parseFloat(d[6])
          ]);
        case 'kucoin':
          return data.data?.reverse().map((d: string[]) => [
            parseFloat(d[0]) * 1000,
            parseFloat(d[1]),
            parseFloat(d[3]),
            parseFloat(d[4]),
            parseFloat(d[2]),
            parseFloat(d[5])
          ]) || null;
        case 'gateio':
          return data.map((d: string[]) => [
            parseFloat(d[0]) * 1000,
            parseFloat(d[5]),
            parseFloat(d[3]),
            parseFloat(d[4]),
            parseFloat(d[2]),
            parseFloat(d[6])
          ]);
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
    const highs = klines.map(k => k[2]);
    const lows = klines.map(k => k[3]);
    const volumes = klines.map(k => k[5]);

    const rsi = calculateRSI(closes, 14);
    const mfi = calculateMFI(highs, lows, closes, volumes, 14);
    const latest = klines[klines.length - 1];

    let formattedSymbol = symbol;
    if (exchange === 'binance' || exchange === 'bybit') {
      formattedSymbol = symbol.replace('USDT', '/USDT');
    } else if (exchange === 'kucoin') {
      formattedSymbol = symbol.replace('-', '/');
    } else if (exchange === 'gateio') {
      formattedSymbol = symbol.replace('_', '/');
    }

    return {
      symbol: formattedSymbol,
      price: latest[4],
      volume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      rsi,
      mfi
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
      case 'mfi_desc':
        return sorted.sort((a, b) => (b.mfi || 0) - (a.mfi || 0));
      case 'mfi_asc':
        return sorted.sort((a, b) => (a.mfi || 0) - (b.mfi || 0));
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

  const filterPairs = useCallback((pairsToFilter: CryptoPair[], mfiLower: number, mfiUpper: number): CryptoPair[] => {
    return pairsToFilter.filter(p => 
      (p.mfi || 0) >= mfiLower && (p.mfi || 0) <= mfiUpper
    );
  }, []);

  return { pairs, loading, progress, loadData, sortPairs, filterPairs };
}
