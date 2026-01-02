import { useState, useEffect } from 'react';
import { CryptoPair, Exchange, formatPrice, getFavorites, toggleFavorite, isFavorite } from '@/lib/exchanges';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import { SortBy } from '@/hooks/useCryptoScanner';

interface PairTableProps {
  pairs: CryptoPair[];
  exchange: Exchange;
  loading: boolean;
  onPairClick?: (pair: CryptoPair) => void;
  sortBy: SortBy;
  onSortChange: (sortBy: SortBy) => void;
  showFavoritesOnly: boolean;
}

function getIndicatorColor(value: number | null): string {
  if (value === null) return 'text-muted-foreground';
  if (value > 70) return 'text-destructive font-bold';
  if (value < 30) return 'text-success font-bold';
  return 'text-warning';
}

export function PairTable({ pairs, exchange, loading, onPairClick, showFavoritesOnly }: PairTableProps) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const handleToggleFavorite = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    const updated = toggleFavorite(symbol);
    setFavorites(updated);
  };

  const displayPairs = showFavoritesOnly 
    ? pairs.filter(p => favorites.includes(p.symbol))
    : pairs;

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-card text-muted-foreground sticky top-0 z-10">
            <tr>
              <th className="px-2 py-4 text-center font-medium w-12">★</th>
              <th className="px-6 py-4 text-left font-medium min-w-[140px]">Pair</th>
              <th className="px-4 py-4 text-center font-medium min-w-[100px]">Price</th>
              <th className="px-4 py-4 text-center font-medium min-w-[80px]">RSI</th>
              <th className="px-4 py-4 text-center font-medium min-w-[80px]">SRSI</th>
              <th className="px-4 py-4 text-center font-medium min-w-[80px]">MFI</th>
              <th className="px-4 py-4 text-center font-medium min-w-[80px]">RVI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayPairs.map((pair, index) => (
              <tr 
                key={pair.symbol} 
                className="hover:bg-card/50 transition-colors animate-fade-in cursor-pointer"
                style={{ animationDelay: `${index * 20}ms` }}
                onClick={() => onPairClick?.(pair)}
              >
                <td className="px-2 py-4 text-center">
                  <button
                    onClick={(e) => handleToggleFavorite(e, pair.symbol)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star 
                      className={cn(
                        "w-4 h-4 transition-colors",
                        favorites.includes(pair.symbol) 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-muted-foreground hover:text-yellow-400"
                      )} 
                    />
                  </button>
                </td>
                <td className="px-6 py-4 font-medium">
                  <span className="text-primary hover:text-accent hover:underline transition-colors">
                    {pair.symbol}
                  </span>
                </td>
                <td className="px-4 py-4 text-center text-foreground font-mono">
                  ${formatPrice(pair.price)}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={getIndicatorColor(pair.rsi)}>
                    {pair.rsi?.toFixed(1) || '-'}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={getIndicatorColor(pair.srsi)}>
                    {pair.srsi?.toFixed(1) || '-'}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={getIndicatorColor(pair.mfi)}>
                    {pair.mfi?.toFixed(1) || '-'}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={getIndicatorColor(pair.rvi)}>
                    {pair.rvi?.toFixed(1) || '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {displayPairs.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          {showFavoritesOnly ? 'No favorite pairs yet. Click the star to add favorites.' : 'No pairs match your filters.'}
        </div>
      )}
    </div>
  );
}