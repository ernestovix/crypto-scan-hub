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

function getMfiColor(mfi: number | null): string {
  if (mfi === null) return 'text-muted-foreground';
  if (mfi > 80) return 'text-destructive font-bold';
  if (mfi < 20) return 'text-success font-bold';
  return 'text-muted-foreground';
}

export function PairTable({ pairs, exchange, loading }: PairTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-card text-muted-foreground sticky top-0">
          <tr>
            <th className="px-6 py-4 text-left font-medium">Pair</th>
            <th className="px-6 py-4 text-right font-medium">Price</th>
            <th className="px-6 py-4 text-center font-medium">RSI (14)</th>
            <th className="px-6 py-4 text-center font-medium">MFI (14)</th>
            <th className="px-6 py-4 text-right font-medium">Avg Volume</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {pairs.map((pair, index) => (
            <tr 
              key={pair.symbol} 
              className="hover:bg-card/50 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 20}ms` }}
            >
              <td className="px-6 py-4 font-medium">
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
                <span className={getMfiColor(pair.mfi)}>
                  {pair.mfi?.toFixed(1) || '-'}
                </span>
              </td>
              <td className="px-6 py-4 text-right text-muted-foreground font-mono">
                ${formatVolume(pair.volume)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {pairs.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          No pairs match your filters.
        </div>
      )}
    </div>
  );
}
