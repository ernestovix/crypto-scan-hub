export type Exchange = 'binance' | 'bybit' | 'kucoin' | 'cryptocom' | 'gateio';

export interface ExchangeInfo {
  id: Exchange;
  name: string;
  logo: string;
  hoverColor: string;
}

export const exchanges: ExchangeInfo[] = [
  { id: 'binance', name: 'Binance', logo: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png', hoverColor: 'hover:bg-yellow-600' },
  { id: 'bybit', name: 'Bybit', logo: 'https://cryptologos.cc/logos/bybit-bybit-logo.png', hoverColor: 'hover:bg-orange-600' },
  { id: 'kucoin', name: 'KuCoin', logo: 'https://cryptologos.cc/logos/kucoin-token-kcs-logo.png', hoverColor: 'hover:bg-green-600' },
  { id: 'cryptocom', name: 'Crypto.com', logo: 'https://cryptologos.cc/logos/cronos-cro-logo.png', hoverColor: 'hover:bg-blue-700' },
  { id: 'gateio', name: 'Gate.io', logo: 'https://cryptologos.cc/logos/gatechain-token-gt-logo.png', hoverColor: 'hover:bg-red-600' },
];

export type Timeframe = '15m' | '30m' | '4h' | '12h' | '1d';

export interface CryptoPair {
  symbol: string;
  price: number;
  volume: number;
  rsi: number | null;
  mfi: number | null;
}

export function calculateRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  
  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (const change of changes) {
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function calculateMFI(highs: number[], lows: number[], closes: number[], volumes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  
  const typicalPrices = closes.map((close, i) => (highs[i] + lows[i] + close) / 3);
  const rawMoneyFlow = typicalPrices.map((tp, i) => tp * volumes[i]);
  
  const positiveFlow: number[] = [];
  const negativeFlow: number[] = [];
  
  for (let i = 1; i < typicalPrices.length; i++) {
    if (typicalPrices[i] > typicalPrices[i - 1]) {
      positiveFlow.push(rawMoneyFlow[i]);
      negativeFlow.push(0);
    } else if (typicalPrices[i] < typicalPrices[i - 1]) {
      positiveFlow.push(0);
      negativeFlow.push(rawMoneyFlow[i]);
    } else {
      positiveFlow.push(0);
      negativeFlow.push(0);
    }
  }
  
  const startIdx = positiveFlow.length - period;
  if (startIdx < 0) return null;
  
  const sumPositive = positiveFlow.slice(startIdx).reduce((a, b) => a + b, 0);
  const sumNegative = negativeFlow.slice(startIdx).reduce((a, b) => a + b, 0);
  
  if (sumNegative === 0) return 100;
  const moneyRatio = sumPositive / sumNegative;
  return 100 - (100 / (1 + moneyRatio));
}

export function formatPrice(p: number): string {
  return p < 1 ? p.toFixed(6) : p.toFixed(2);
}

export function formatVolume(v: number): string {
  if (v > 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v > 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v > 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v.toFixed(0);
}

export function getTradingUrl(exchange: Exchange, symbol: string): string {
  const base: Record<Exchange, string> = {
    binance: 'https://www.binance.com/en/trade/',
    bybit: 'https://www.bybit.com/en/trade/spot/',
    kucoin: 'https://www.kucoin.com/trade/',
    cryptocom: 'https://crypto.com/exchange/trade/',
    gateio: 'https://www.gate.io/trade/'
  };
  return base[exchange] + symbol.replace('/', '_');
}
