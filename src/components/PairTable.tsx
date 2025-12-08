import { CryptoPair, Exchange, formatPrice, formatVolume, getTradingUrl } from '@/lib/exchanges';
import { cn } from '@/lib/utils';

interface PairTableProps {
  pairs: CryptoPair[];
  exchange: Exchange;
  loading: boolean;
}

function getRsiColor(rsi: number | null): string {
  if (rsi === null) return 'text-muted-foreground';
  if (rsi > 70) return 'text-destructive';
  if (rsi < 30) return 'text-success';
  return 'text-warning';
}

function getStochRsiColor(stochRsi: number | null): string {
  if (stochRsi === null) return 'text-muted-foreground';
  if (stochRsi > 80) return 'text-destructive font-bold';
  if (stochRsi < 20) return 'text-success font-bold';
  return 'text-muted-foreground';
}

function getCombinedScore(rsi: number | null, stochRsi: number | null): number {
  const r = rsi ?? 50;
  const s = stochRsi ?? 50;
  return (r + s) / 2;
}

function getCombinedColor(score: number): string {
  if (score < 25) return 'text-success font-bold';
  if (score < 35) return 'text-success';
  if (score > 75) return 'text-destructive font-bold';
  if (score > 65) return 'text-destructive';
  return 'text-warning';
}

export function PairTable({ pairs, exchange, loading }: PairTableProps) {
  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-card text-muted-foreground sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-left font-medium sticky left-0 bg-card z-20 min-w-[140px]">Pair</th>
              <th className="px-6 py-4 text-right font-medium min-w-[120px]">Price</th>
              <th className="px-6 py-4 text-center font-medium min-w-[100px]">RSI (14)</th>
              <th className="px-6 py-4 text-center font-medium min-w-[120px]">StochRSI (14)</th>
              <th className="px-6 py-4 text-center font-medium min-w-[100px]">Combined</th>
              <th className="px-6 py-4 text-right font-medium min-w-[100px]">Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pairs.map((pair, index) => {
              const combined = getCombinedScore(pair.rsi, pair.stochRsi);
              return (
                <tr 
                  key={pair.symbol} 
                  className="hover:bg-card/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <td className="px-6 py-4 font-medium sticky left-0 bg-background z-10">
                    <a 
                      href={getTradingUrl(exchange, pair.symbol)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-accent hover:underline transition-colors"
                    >
                      {pair.symbol}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-right text-foreground font-mono">
                    ${formatPrice(pair.price)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn("font-bold", getRsiColor(pair.rsi))}>
                      {pair.rsi?.toFixed(1) || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={getStochRsiColor(pair.stochRsi)}>
                      {pair.stochRsi?.toFixed(1) || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={getCombinedColor(combined)}>
                      {combined.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground font-mono">
                    {formatVolume(pair.volume)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {pairs.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          No pairs match your filters.
        </div>
      )}
    </div>
  );
}
