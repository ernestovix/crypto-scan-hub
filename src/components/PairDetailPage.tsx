import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Exchange, CryptoPair, calculateRSI, formatVolume } from '@/lib/exchanges';
import { cn } from '@/lib/utils';

interface PairDetailPageProps {
  pair: CryptoPair;
  exchange: Exchange;
  onBack: () => void;
}

interface TimeframeData {
  timeframe: string;
  rsi: number | null;
  volume: number;
}

const TIMEFRAMES = ['5m', '15m', '30m', '1h', '4h', '1d'] as const;

function getRsiColor(rsi: number | null): string {
  if (rsi === null) return 'text-muted-foreground';
  if (rsi > 70) return 'text-destructive font-bold';
  if (rsi < 30) return 'text-success font-bold';
  return 'text-warning';
}

export function PairDetailPage({ pair, exchange, onBack }: PairDetailPageProps) {
  const [timeframeData, setTimeframeData] = useState<TimeframeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllTimeframes();
  }, [pair.symbol, exchange]);

  const isDerivExchange = (ex: Exchange): boolean => {
    return ['deriv', 'derivforex', 'derivstocks', 'derivstockindices', 'derivcommodity', 'derivetfs'].includes(ex);
  };

  const getSymbolForApi = () => {
    if (exchange === 'binance') {
      return pair.symbol.replace('/', '');
    } else if (exchange === 'bybit') {
      return pair.symbol.replace('/', '');
    } else if (exchange === 'l1s' || exchange === 'meme') {
      return pair.symbol.replace('/USDT', '').toLowerCase();
    } else if (exchange === 'kucoin') {
      return pair.symbol.replace('/', '-');
    } else if (exchange === 'cryptocom') {
      return pair.symbol.replace('/', '_');
    }
    return pair.symbol;
  };

  const fetchKlinesForTimeframe = async (timeframe: string): Promise<number[][] | null> => {
    const symbol = getSymbolForApi();
    const effectiveExchange = (exchange === 'l1s' || exchange === 'meme') ? 'coinmarketcap' : exchange;
    
    try {
      if (isDerivExchange(effectiveExchange)) {
        return null; // Simplified for now
      }

      if (effectiveExchange === 'binance') {
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
      } else if (effectiveExchange === 'bybit') {
        const bybitIntervals: Record<string, string> = { '5m': '5', '15m': '15', '30m': '30', '1h': '60', '4h': '240', '1d': 'D' };
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
    } catch (e) {
      console.error(`Failed to fetch klines for ${timeframe}:`, e);
    }
    return null;
  };

  const loadAllTimeframes = async () => {
    setLoading(true);
    const results: TimeframeData[] = [];

    for (const tf of TIMEFRAMES) {
      const klines = await fetchKlinesForTimeframe(tf);
      if (klines && klines.length >= 14) {
        const closes = klines.map(k => k[4]);
        const volumes = klines.map(k => k[5]);

        results.push({
          timeframe: tf,
          rsi: calculateRSI(closes, 14),
          volume: volumes.reduce((a, b) => a + b, 0) / volumes.length
        });
      } else {
        results.push({
          timeframe: tf,
          rsi: null,
          volume: 0
        });
      }
    }

    setTimeframeData(results);
    setLoading(false);
  };

  return (
    <div className="flex-1 bg-background min-h-screen">
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h2 className="text-2xl font-bold text-foreground">
            {pair.symbol}
          </h2>
          {loading && (
            <div className="flex items-center gap-2 text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading timeframes...</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">Multi-Timeframe RSI Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Timeframe</th>
                <th className="px-4 py-3 text-center font-medium">RSI (14)</th>
                <th className="px-4 py-3 text-right font-medium">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {timeframeData.map((tf) => (
                <tr key={tf.timeframe} className="hover:bg-card/50">
                  <td className="px-4 py-3 font-medium text-foreground uppercase">{tf.timeframe}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={getRsiColor(tf.rsi)}>
                      {tf.rsi?.toFixed(1) || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground font-mono">
                    {formatVolume(tf.volume)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
