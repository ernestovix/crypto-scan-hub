export type Exchange = 'binance' | 'bybit' | 'kucoin' | 'cryptocom' | 'coinmarketcap' | 'coingecko' | 'deriv' | 'derivforex' | 'derivstocks' | 'derivstockindices' | 'derivcommodity' | 'derivetfs' | 'l1s' | 'meme';

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
  { id: 'deriv', name: 'Deriv Synthetic', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHtsVJDNvheGvB4o2auaoJOYisHNR8g0qRLslOiyoMGQ&s=10', hoverColor: 'hover:bg-red-600' },
  { id: 'derivforex', name: 'Deriv Forex', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHtsVJDNvheGvB4o2auaoJOYisHNR8g0qRLslOiyoMGQ&s=10', hoverColor: 'hover:bg-blue-600' },
  { id: 'derivstocks', name: 'Deriv Stocks', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHtsVJDNvheGvB4o2auaoJOYisHNR8g0qRLslOiyoMGQ&s=10', hoverColor: 'hover:bg-indigo-600' },
  { id: 'derivstockindices', name: 'Deriv Stock Indices', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHtsVJDNvheGvB4o2auaoJOYisHNR8g0qRLslOiyoMGQ&s=10', hoverColor: 'hover:bg-violet-600' },
  { id: 'derivcommodity', name: 'Deriv Commodity', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHtsVJDNvheGvB4o2auaoJOYisHNR8g0qRLslOiyoMGQ&s=10', hoverColor: 'hover:bg-amber-600' },
  { id: 'derivetfs', name: 'Deriv ETFs', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHtsVJDNvheGvB4o2auaoJOYisHNR8g0qRLslOiyoMGQ&s=10', hoverColor: 'hover:bg-teal-600' },
  { id: 'l1s', name: 'L1S Pairs', logo: 'https://thumbs.dreamstime.com/b/dollar-symbol-4647739.jpg', hoverColor: 'hover:bg-emerald-600' },
  { id: 'meme', name: 'Meme Pairs', logo: 'https://img.icons8.com/fluency/96/british-pound.png', hoverColor: 'hover:bg-purple-600' },
];

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '4h' | '12h' | '1d';

export interface CryptoPair {
  symbol: string;
  price: number;
  volume: number;
  rsi5m: number | null;
  rsi15m: number | null;
  rsi30m: number | null;
  rsi1h: number | null;
  rsi4h: number | null;
  rsi1d: number | null;
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
    derivforex: 'https://deriv.com/dtrader',
    derivstocks: 'https://deriv.com/dtrader',
    derivstockindices: 'https://deriv.com/dtrader',
    derivcommodity: 'https://deriv.com/dtrader',
    derivetfs: 'https://deriv.com/dtrader',
    l1s: 'https://coinmarketcap.com/currencies/',
    meme: 'https://coinmarketcap.com/currencies/'
  };
  
  const cleanSymbol = symbol.replace('/', '_').replace('/USDT', '').replace('_USDT', '').toLowerCase();
  
  if (exchange === 'coinmarketcap' || exchange === 'coingecko' || exchange === 'l1s' || exchange === 'meme') {
    return base[exchange] + cleanSymbol;
  }
  
  if (exchange === 'deriv' || exchange === 'derivforex' || exchange === 'derivstocks' || exchange === 'derivstockindices' || exchange === 'derivcommodity' || exchange === 'derivetfs') {
    return base[exchange];
  }
  
  return base[exchange] + symbol.replace('/', '_');
}

// Deriv Forex pairs
export const derivForexPairs = [
  { symbol: 'frxAUDCAD', name: 'AUD/CAD' },
  { symbol: 'frxAUDCHF', name: 'AUD/CHF' },
  { symbol: 'frxAUDJPY', name: 'AUD/JPY' },
  { symbol: 'frxAUDNZD', name: 'AUD/NZD' },
  { symbol: 'frxAUDUSD', name: 'AUD/USD' },
  { symbol: 'frxEURAUD', name: 'EUR/AUD' },
  { symbol: 'frxEURCAD', name: 'EUR/CAD' },
  { symbol: 'frxEURCHF', name: 'EUR/CHF' },
  { symbol: 'frxEURGBP', name: 'EUR/GBP' },
  { symbol: 'frxEURJPY', name: 'EUR/JPY' },
  { symbol: 'frxEURNZD', name: 'EUR/NZD' },
  { symbol: 'frxEURUSD', name: 'EUR/USD' },
  { symbol: 'frxGBPAUD', name: 'GBP/AUD' },
  { symbol: 'frxGBPCAD', name: 'GBP/CAD' },
  { symbol: 'frxGBPCHF', name: 'GBP/CHF' },
  { symbol: 'frxGBPJPY', name: 'GBP/JPY' },
  { symbol: 'frxGBPNZD', name: 'GBP/NZD' },
  { symbol: 'frxGBPUSD', name: 'GBP/USD' },
  { symbol: 'frxNZDJPY', name: 'NZD/JPY' },
  { symbol: 'frxNZDUSD', name: 'NZD/USD' },
  { symbol: 'frxUSDCAD', name: 'USD/CAD' },
  { symbol: 'frxUSDCHF', name: 'USD/CHF' },
  { symbol: 'frxUSDJPY', name: 'USD/JPY' },
  { symbol: 'frxUSDMXN', name: 'USD/MXN' },
  { symbol: 'frxUSDNOK', name: 'USD/NOK' },
  { symbol: 'frxUSDSEK', name: 'USD/SEK' },
];

// Deriv Stocks
export const derivStocks = [
  { symbol: 'AAPL', name: 'Apple Inc' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'NFLX', name: 'Netflix' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'BA', name: 'Boeing' },
  { symbol: 'DIS', name: 'Walt Disney' },
  { symbol: 'IBM', name: 'IBM' },
  { symbol: 'INTC', name: 'Intel' },
  { symbol: 'PFE', name: 'Pfizer' },
  { symbol: 'PYPL', name: 'PayPal' },
  { symbol: 'V', name: 'Visa' },
];

// Deriv Stock Indices
export const derivStockIndices = [
  { symbol: 'OTC_AS51', name: 'Australia 200' },
  { symbol: 'OTC_DJI', name: 'Wall Street 30' },
  { symbol: 'OTC_FCHI', name: 'France 40' },
  { symbol: 'OTC_FTSE', name: 'UK 100' },
  { symbol: 'OTC_GDAXI', name: 'Germany 40' },
  { symbol: 'OTC_HSI', name: 'Hong Kong 50' },
  { symbol: 'OTC_N225', name: 'Japan 225' },
  { symbol: 'OTC_NDX', name: 'US Tech 100' },
  { symbol: 'OTC_SPC', name: 'US 500' },
  { symbol: 'OTC_SSMI', name: 'Swiss 20' },
];

// Deriv Commodities
export const derivCommodities = [
  { symbol: 'frxXAUUSD', name: 'Gold/USD' },
  { symbol: 'frxXAGUSD', name: 'Silver/USD' },
  { symbol: 'frxXPDUSD', name: 'Palladium/USD' },
  { symbol: 'frxXPTUSD', name: 'Platinum/USD' },
  { symbol: 'WLDOIL', name: 'Oil/USD' },
];

// Deriv ETFs
export const derivETFs = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
  { symbol: 'IWM', name: 'iShares Russell 2000' },
  { symbol: 'EEM', name: 'iShares MSCI Emerging Markets' },
  { symbol: 'GLD', name: 'SPDR Gold Shares' },
  { symbol: 'SLV', name: 'iShares Silver Trust' },
  { symbol: 'USO', name: 'United States Oil Fund' },
  { symbol: 'VXX', name: 'iPath Series B S&P 500 VIX' },
];

// L1S Pairs (formerly spotspecialpairs) - using CoinMarketCap
export const L1SPairs = [
  "BTC/USDT",
  "ETH/USDT",
  "XRP/USDT",
  "SOL/USDT",
  "XLM/USDT",
  "BNB/USDT",
  "DOGE/USDT"
];

// Meme Pairs (formerly leveragespecialpairs) - using CoinMarketCap
export const MemePairs = [
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
