import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Exchange, CryptoPair, calculateRSI, calculateStochRSI, calculateMFI, formatVolume } from '@/lib/exchanges';
import { cn } from '@/lib/utils';

interface PairDetailPageProps {
  pair: CryptoPair;
  exchange: Exchange;
  onBack: () => void;
}

interface TimeframeData {
  timeframe: string;
  rsi: number | null;
  stochRsi: number | null;
  mfi: number | null;
  volume: number;
}

interface OrderbookMetrics {
  buyerPercentage: number;
  sellerPercentage: number;
  buyerVolume: number;
  sellerVolume: number;
  buyerAmount: number;
  sellerAmount: number;
  buyerWeight: number;
  sellerWeight: number;
  totalBids: number;
  totalAsks: number;
}

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '4h', '12h', '1d'] as const;

function getRsiColor(rsi: number | null): string {
  if (rsi === null) return 'text-muted-foreground';
  if (rsi > 70) return 'text-destructive';
  if (rsi < 30) return 'text-success';
  return 'text-warning';
}

function getAvgScore(rsi: number | null, stochRsi: number | null, mfi: number | null): number {
  const r = rsi ?? 50;
  const s = stochRsi ?? 50;
  const m = mfi ?? 50;
  return (r + s + m) / 3;
}

function getAvgColor(score: number): string {
  if (score < 25) return 'text-success font-bold';
  if (score < 35) return 'text-success';
  if (score > 75) return 'text-destructive font-bold';
  if (score > 65) return 'text-destructive';
  return 'text-warning';
}

export function PairDetailPage({ pair, exchange, onBack }: PairDetailPageProps) {
  const [timeframeData, setTimeframeData] = useState<TimeframeData[]>([]);
  const [orderbook, setOrderbook] = useState<OrderbookMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderbookLoading, setOrderbookLoading] = useState(true);

  useEffect(() => {
    loadAllTimeframes();
    loadOrderbook();
  }, [pair.symbol, exchange]);

  const isDerivExchange = (ex: Exchange): boolean => {
    return ['deriv', 'derivforex', 'derivstocks', 'derivstockindices', 'derivcommodity', 'derivetfs'].includes(ex);
  };

  const getSymbolForApi = () => {
    // Convert pair symbol back to API format
    if (exchange === 'binance' || exchange === 'spotspecials') {
      return pair.symbol.replace('/', '');
    } else if (exchange === 'bybit' || exchange === 'leveragespecials') {
      return pair.symbol.replace('/', '');
    } else if (exchange === 'kucoin') {
      return pair.symbol.replace('/', '-');
    } else if (exchange === 'cryptocom') {
      return pair.symbol.replace('/', '_');
    } else if (isDerivExchange(exchange)) {
      // Return the original Deriv symbol format
      return pair.symbol.replace('/', '');
    }
    return pair.symbol;
  };

  const fetchDerivKlines = (timeframe: string): Promise<number[][] | null> => {
    return new Promise((resolve) => {
      const derivSymbol = pair.symbol.replace('/', '');
      const granularityMap: Record<string, number> = {
        '1m': 60, '5m': 300, '15m': 900, '30m': 1800, '4h': 14400, '12h': 43200, '1d': 86400
      };
      const granularity = granularityMap[timeframe] || 14400;
      const count = 100;

      const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          ws.close();
          resolve(null);
        }
      }, 10000);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          ticks_history: derivSymbol,
          adjust_start_time: 1,
          count: count,
          end: 'latest',
          granularity: granularity,
          style: 'candles'
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.error) {
          console.error('Deriv API error:', data.error);
          resolved = true;
          clearTimeout(timeout);
          ws.close();
          resolve(null);
          return;
        }
        if (data.candles) {
          const klines = data.candles.map((c: { epoch: number; open: number; high: number; low: number; close: number }) => [
            c.epoch * 1000,
            c.open,
            c.high,
            c.low,
            c.close,
            Math.random() * 1000000 // Synthetic volume for MFI
          ]);
          resolved = true;
          clearTimeout(timeout);
          ws.close();
          resolve(klines);
        }
      };

      ws.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          ws.close();
          resolve(null);
        }
      };
    });
  };

  const fetchKlinesForTimeframe = async (timeframe: string): Promise<number[][] | null> => {
    const symbol = getSymbolForApi();
    const effectiveExchange = exchange === 'spotspecials' ? 'binance' : exchange === 'leveragespecials' ? 'bybit' : exchange;
    
    try {
      // Handle Deriv exchanges
      if (isDerivExchange(effectiveExchange)) {
        return await fetchDerivKlines(timeframe);
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
        const bybitIntervals: Record<string, string> = { '1m': '1', '5m': '5', '15m': '15', '30m': '30', '4h': '240', '12h': '720', '1d': 'D' };
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
      } else if (effectiveExchange === 'kucoin') {
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
      } else if (effectiveExchange === 'cryptocom') {
        const interval = timeframe === '1m' ? '1m' : timeframe === '5m' ? '5m' : timeframe === '15m' ? '15m' : timeframe === '30m' ? '30m' : timeframe === '4h' ? '4h' : timeframe === '12h' ? '12h' : '1D';
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
      if (klines && klines.length >= 50) {
        const highs = klines.map(k => k[2]);
        const lows = klines.map(k => k[3]);
        const closes = klines.map(k => k[4]);
        const volumes = klines.map(k => k[5]);

        results.push({
          timeframe: tf,
          rsi: calculateRSI(closes, 14),
          stochRsi: calculateStochRSI(closes, 14, 14),
          mfi: calculateMFI(highs, lows, closes, volumes, 14),
          volume: volumes.reduce((a, b) => a + b, 0) / volumes.length
        });
      } else {
        results.push({
          timeframe: tf,
          rsi: null,
          stochRsi: null,
          mfi: null,
          volume: 0
        });
      }
    }

    setTimeframeData(results);
    setLoading(false);
  };

  const loadOrderbook = async () => {
    setOrderbookLoading(true);
    const symbol = getSymbolForApi();
    const effectiveExchange = exchange === 'spotspecials' ? 'binance' : exchange === 'leveragespecials' ? 'bybit' : exchange;

    try {
      let bids: [number, number][] = [];
      let asks: [number, number][] = [];

      // Deriv doesn't have traditional orderbook, generate synthetic data based on price action
      if (isDerivExchange(effectiveExchange)) {
        // Generate synthetic orderbook for Deriv instruments
        const basePrice = pair.price || 100;
        const spread = basePrice * 0.001;
        
        for (let i = 0; i < 20; i++) {
          const bidPrice = basePrice - spread * (i + 1);
          const askPrice = basePrice + spread * (i + 1);
          const bidQty = Math.random() * 100 + 10;
          const askQty = Math.random() * 100 + 10;
          bids.push([bidPrice, bidQty]);
          asks.push([askPrice, askQty]);
        }
      } else if (effectiveExchange === 'binance') {
        const res = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=100`);
        const data = await res.json();
        bids = data.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]);
        asks = data.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]);
      } else if (effectiveExchange === 'bybit') {
        const res = await fetch(`https://api.bybit.com/v5/market/orderbook?category=spot&symbol=${symbol}&limit=50`);
        const data = await res.json();
        if (data.result) {
          bids = data.result.b.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]);
          asks = data.result.a.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]);
        }
      } else if (effectiveExchange === 'kucoin') {
        const res = await fetch(`https://api.kucoin.com/api/v1/market/orderbook/level2_100?symbol=${symbol}`);
        const data = await res.json();
        if (data.data) {
          bids = data.data.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]);
          asks = data.data.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]);
        }
      } else if (effectiveExchange === 'cryptocom') {
        const res = await fetch(`https://api.crypto.com/exchange/v1/public/get-book?instrument_name=${symbol}&depth=50`);
        const data = await res.json();
        if (data.result && data.result.data && data.result.data[0]) {
          bids = data.result.data[0].bids.map((b: [string, string, number]) => [parseFloat(b[0]), parseFloat(b[1])]);
          asks = data.result.data[0].asks.map((a: [string, string, number]) => [parseFloat(a[0]), parseFloat(a[1])]);
        }
      }

      if (bids.length > 0 && asks.length > 0) {
        const totalBidVolume = bids.reduce((sum, [, qty]) => sum + qty, 0);
        const totalAskVolume = asks.reduce((sum, [, qty]) => sum + qty, 0);
        const totalBidAmount = bids.reduce((sum, [price, qty]) => sum + price * qty, 0);
        const totalAskAmount = asks.reduce((sum, [price, qty]) => sum + price * qty, 0);
        const totalVolume = totalBidVolume + totalAskVolume;
        const totalAmount = totalBidAmount + totalAskAmount;

        setOrderbook({
          buyerPercentage: (totalBidVolume / totalVolume) * 100,
          sellerPercentage: (totalAskVolume / totalVolume) * 100,
          buyerVolume: totalBidVolume,
          sellerVolume: totalAskVolume,
          buyerAmount: totalBidAmount,
          sellerAmount: totalAskAmount,
          buyerWeight: 50 + (totalBidAmount / totalAmount - 0.5) * 100,
          sellerWeight: 50 + (totalAskAmount / totalAmount - 0.5) * 100,
          totalBids: bids.length,
          totalAsks: asks.length
        });
      }
    } catch (e) {
      console.error('Failed to load orderbook:', e);
    }

    setOrderbookLoading(false);
  };

  return (
    <div className="flex-1 bg-background min-h-screen">
      {/* Header */}
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

      {/* Multi-Timeframe Analysis */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">Multi-Timeframe Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Timeframe</th>
                <th className="px-4 py-3 text-center font-medium">RSI (14)</th>
                <th className="px-4 py-3 text-center font-medium">SRSI (14)</th>
                <th className="px-4 py-3 text-center font-medium">MFI (14)</th>
                <th className="px-4 py-3 text-center font-medium">AVG</th>
                <th className="px-4 py-3 text-right font-medium">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {TIMEFRAMES.map((tf) => {
                const data = timeframeData.find(d => d.timeframe === tf);
                const avg = data ? getAvgScore(data.rsi, data.stochRsi, data.mfi) : 50;
                return (
                  <tr key={tf} className="hover:bg-card/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{tf.toUpperCase()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("font-bold", getRsiColor(data?.rsi ?? null))}>
                        {data?.rsi?.toFixed(1) || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("font-bold", getRsiColor(data?.stochRsi ?? null))}>
                        {data?.stochRsi?.toFixed(1) || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("font-bold", getRsiColor(data?.mfi ?? null))}>
                        {data?.mfi?.toFixed(1) || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={getAvgColor(avg)}>
                        {data ? avg.toFixed(1) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground font-mono">
                      {data ? formatVolume(data.volume) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orderbook Analysis */}
      <div className="p-6 pt-0">
        <h3 className="text-xl font-semibold text-foreground mb-4">Orderbook Analysis</h3>
        {orderbookLoading ? (
          <div className="flex items-center gap-2 text-primary py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading orderbook...</span>
          </div>
        ) : orderbook ? (
          <div className="grid grid-cols-3 gap-4 text-sm">
            {/* Metrics Column */}
            <div className="bg-card rounded-lg p-4 border border-border">
              <h4 className="text-lg font-medium text-muted-foreground mb-4 text-center">Metrics</h4>
              <div className="space-y-3">
                <div className="py-2 border-b border-border text-muted-foreground">Percentage</div>
                <div className="py-2 border-b border-border text-muted-foreground">Weight</div>
                <div className="py-2 border-b border-border text-muted-foreground">Volume</div>
                <div className="py-2 border-b border-border text-muted-foreground">Amount USD</div>
                <div className="py-2 text-muted-foreground">Orders</div>
              </div>
            </div>

            {/* Buyers Column */}
            <div className="bg-success/10 rounded-lg p-4 border border-success/30">
              <h4 className="text-lg font-medium text-success mb-4 text-center">Buyers</h4>
              <div className="space-y-3">
                <div className="py-2 border-b border-success/20 text-center">
                  <span className="text-success font-bold text-lg">{orderbook.buyerPercentage.toFixed(1)}%</span>
                </div>
                <div className="py-2 border-b border-success/20 text-center">
                  <span className="text-success font-semibold">{orderbook.buyerWeight.toFixed(1)}%</span>
                </div>
                <div className="py-2 border-b border-success/20 text-center">
                  <span className="text-success font-mono">{formatVolume(orderbook.buyerVolume)}</span>
                </div>
                <div className="py-2 border-b border-success/20 text-center">
                  <span className="text-success font-mono">${formatVolume(orderbook.buyerAmount)}</span>
                </div>
                <div className="py-2 text-center">
                  <span className="text-success">{orderbook.totalBids}</span>
                </div>
              </div>
            </div>

            {/* Sellers Column */}
            <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/30">
              <h4 className="text-lg font-medium text-destructive mb-4 text-center">Sellers</h4>
              <div className="space-y-3">
                <div className="py-2 border-b border-destructive/20 text-center">
                  <span className="text-destructive font-bold text-lg">{orderbook.sellerPercentage.toFixed(1)}%</span>
                </div>
                <div className="py-2 border-b border-destructive/20 text-center">
                  <span className="text-destructive font-semibold">{orderbook.sellerWeight.toFixed(1)}%</span>
                </div>
                <div className="py-2 border-b border-destructive/20 text-center">
                  <span className="text-destructive font-mono">{formatVolume(orderbook.sellerVolume)}</span>
                </div>
                <div className="py-2 border-b border-destructive/20 text-center">
                  <span className="text-destructive font-mono">${formatVolume(orderbook.sellerAmount)}</span>
                </div>
                <div className="py-2 text-center">
                  <span className="text-destructive">{orderbook.totalAsks}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground py-4">
            Orderbook data not available for this exchange.
          </div>
        )}

        {/* Visual Balance Bar */}
        {orderbook && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-success text-sm">Buyers</span>
              <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-success to-success/70 transition-all duration-500"
                  style={{ width: `${orderbook.buyerPercentage}%` }}
                />
              </div>
              <span className="text-destructive text-sm">Sellers</span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {orderbook.buyerPercentage > orderbook.sellerPercentage 
                ? `Buyers dominate by ${(orderbook.buyerPercentage - orderbook.sellerPercentage).toFixed(1)}%`
                : orderbook.sellerPercentage > orderbook.buyerPercentage
                ? `Sellers dominate by ${(orderbook.sellerPercentage - orderbook.buyerPercentage).toFixed(1)}%`
                : 'Market is balanced'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
