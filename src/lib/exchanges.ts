export type Exchange = 'binance' | 'bybit' | 'kucoin' | 'cryptocom' | 'coinmarketcap' | 'coingecko' | 'deriv' | 'spotspecials' | 'leveragespecials';

export interface ExchangeInfo {
  id: Exchange;
  name: string;
  logo: string;
  hoverColor: string;
}

export const exchanges: ExchangeInfo[] = [
  { id: 'binance', name: 'Binance', logo: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png', hoverColor: 'hover:bg-yellow-600' },
  { id: 'bybit', name: 'Bybit', logo: 'https://assets.coingecko.com/markets/images/698/large/bybit_spot.png', hoverColor: 'hover:bg-orange-600' },
  { id: 'kucoin', name: 'KuCoin', logo: 'https://cryptologos.cc/logos/kucoin-token-kcs-logo.png', hoverColor: 'hover:bg-green-600' },
  { id: 'cryptocom', name: 'Crypto.com', logo: 'https://cryptologos.cc/logos/cronos-cro-logo.png', hoverColor: 'hover:bg-blue-700' },
  { id: 'coinmarketcap', name: 'CoinMarketCap', logo: 'https://coinmarketcap.com/apple-touch-icon.png', hoverColor: 'hover:bg-blue-500' },
  { id: 'coingecko', name: 'CoinGecko', logo: 'https://static.coingecko.com/s/coingecko-logo-8903d34ce19ca4be1c81f0db30e924154750d208683fad7ae6f2ce06c76d0a56.png', hoverColor: 'hover:bg-green-500' },
  { id: 'deriv', name: 'Deriv Synthetic Indices', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Deriv.com_official_logo.png/220px-Deriv.com_official_logo.png', hoverColor: 'hover:bg-red-600' },
  { id: 'spotspecials', name: 'Spot Specials', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Dollar_sign_in_circle.svg/240px-Dollar_sign_in_circle.svg.png', hoverColor: 'hover:bg-emerald-600' },
  { id: 'leveragespecials', name: 'Leverage Special', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Pound_sign.svg/240px-Pound_sign.svg.png', hoverColor: 'hover:bg-purple-600' },
];

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '4h' | '12h' | '1d';

export interface CryptoPair {
  symbol: string;
  price: number;
  volume: number;
  rsi: number | null;
  stochRsi: number | null;
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

export function calculateStochRSI(closes: number[], rsiPeriod = 14, stochPeriod = 14): number | null {
  if (closes.length < rsiPeriod + stochPeriod + 1) return null;
  
  // Calculate RSI values for each position
  const rsiValues: number[] = [];
  
  for (let i = rsiPeriod; i < closes.length; i++) {
    const slicedCloses = closes.slice(0, i + 1);
    const rsi = calculateRSI(slicedCloses, rsiPeriod);
    if (rsi !== null) {
      rsiValues.push(rsi);
    }
  }
  
  if (rsiValues.length < stochPeriod) return null;
  
  // Get the last stochPeriod RSI values
  const recentRsi = rsiValues.slice(-stochPeriod);
  const currentRsi = recentRsi[recentRsi.length - 1];
  const minRsi = Math.min(...recentRsi);
  const maxRsi = Math.max(...recentRsi);
  
  if (maxRsi === minRsi) return 50; // Avoid division by zero
  
  // StochRSI = (RSI - min(RSI)) / (max(RSI) - min(RSI)) * 100
  return ((currentRsi - minRsi) / (maxRsi - minRsi)) * 100;
}

export function calculateMFI(highs: number[], lows: number[], closes: number[], volumes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  
  const typicalPrices: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    typicalPrices.push((highs[i] + lows[i] + closes[i]) / 3);
  }
  
  const rawMoneyFlows: number[] = [];
  for (let i = 0; i < typicalPrices.length; i++) {
    rawMoneyFlows.push(typicalPrices[i] * volumes[i]);
  }
  
  let positiveFlow = 0;
  let negativeFlow = 0;
  
  for (let i = closes.length - period; i < closes.length; i++) {
    if (i > 0) {
      if (typicalPrices[i] > typicalPrices[i - 1]) {
        positiveFlow += rawMoneyFlows[i];
      } else if (typicalPrices[i] < typicalPrices[i - 1]) {
        negativeFlow += rawMoneyFlows[i];
      }
    }
  }
  
  if (negativeFlow === 0) return 100;
  const moneyRatio = positiveFlow / negativeFlow;
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
    coinmarketcap: 'https://coinmarketcap.com/currencies/',
    coingecko: 'https://www.coingecko.com/en/coins/',
    deriv: 'https://deriv.com/dtrader',
    spotspecials: 'https://www.binance.com/en/trade/',
    leveragespecials: 'https://www.bybit.com/en/trade/spot/'
  };
  
  const cleanSymbol = symbol.replace('/', '_').replace('/USDT', '').replace('_USDT', '').toLowerCase();
  
  if (exchange === 'coinmarketcap' || exchange === 'coingecko') {
    return base[exchange] + cleanSymbol;
  }
  
  if (exchange === 'deriv') {
    return base[exchange];
  }
  
  return base[exchange] + symbol.replace('/', '_');
}

// Special pairs lists
export const spotSpecialPairs = [
  "BTC/USDT",
  "ETH/USDT",
  "XRP/USDT",
  "SOL/USDT",
  "XLM/USDT",
  "BNB/USDT",
  "DOGE/USDT"
];

export const leverageSpecialPairs = [
  "PEPE/USDT",
  "SUI/USDT",
  "FARTCOIN/USDT",
  "PIEVERSE/USDT",
  "AVAX/USDT",
  "LINK/USDT",
  "ADA/USDT",
  "WLD/USDT",
  "LTC/USDT",
  "HYPE/USDT",
  "ENA/USDT",
  "H/USDT",
  "WIF/USDT",
  "NEAR/USDT",
  "BCH/USDT",
  "UNI/USDT",
  "GALA/USDT",
  "WLFI/USDT",
  "ASTER/USDT",
  "AAVE/USDT",
  "PENGU/USDT",
  "TRUMP/USDT",
  "MON/USDT",
  "DOT/USDT",
  "FIL/USDT",
  "ARB/USDT",
  "FET/USDT",
  "LDO/USDT",
  "PUMP/USDT",
  "ICP/USDT",
  "CRV/USDT",
  "SHIB/USDT",
  "TRX/USDT",
  "OP/USDT",
  "VIRTUAL/USDT",
  "RESOLV/USDT",
  "TON/USDT",
  "CFX/USDT",
  "APE/USDT",
  "PNUT/USDT",
  "ONDO/USDT",
  "HBAR/USDT",
  "EIGEN/USDT",
  "STRK/USDT",
  "PEOPLE/USDT",
  "ORDI/USDT",
  "TIA/USDT",
  "MOODENG/USDT",
  "TURBO/USDT",
  "SEI/USDT",
  "KAS/USDT",
  "ETHFI/USDT",
  "DYDX/USDT",
  "AR/USDT",
  "TRB/USDT",
  "POL/USDT",
  "ATOM/USDT",
  "IP/USDT",
  "SPX/USDT",
  "CAKE/USDT",
  "COAI/USDT",
  "CRO/USDT",
  "OM/USDT",
  "POPCAT/USDT",
  "SUSHI/USDT",
  "BOME/USDT",
  "SAND/USDT",
  "VINE/USDT",
  "LPT/USDT",
  "HUMA/USDT",
  "KAITO/USDT",
  "SOON/USDT",
  "BSV/USDT",
  "KAIA/USDT",
  "AXS/USDT",
  "GOAT/USDT",
  "THETA/USDT",
  "FLOCK/USDT",
  "WCT/USDT",
  "ANIME/USDT",
  "ZBCN/USDT",
  "SYRUP/USDT",
  "JCT/USDT",
  "SPK/USDT",
  "CETUS/USDT",
  "USUAL/USDT",
  "XPIN/USDT",
  "KERNEL/USDT",
  "TOSHI/USDT",
  "COOKIE/USDT"
];
