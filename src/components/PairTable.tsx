import { useState } from 'react';
import { CryptoPair, Exchange, formatPrice } from '@/lib/exchanges';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { SortBy } from '@/hooks/useCryptoScanner';

interface PairTableProps {
  pairs: CryptoPair[];
  exchange: Exchange;
  loading: boolean;
  onPairClick?: (pair: CryptoPair) => void;
  sortBy: SortBy;
  onSortChange: (sortBy: SortBy) => void;
}

type SortColumn = 'price' | 'rsi5m' | 'rsi15m' | 'rsi30m' | 'rsi1h' | 'rsi4h' | 'rsi1d';

function getRsiColor(rsi: number | null): string {
  if (rsi === null) return 'text-muted-foreground';
  if (rsi > 70) return 'text-destructive font-bold';
  if (rsi < 30) return 'text-success font-bold';
  return 'text-warning';
}

function SortableHeader({ 
  label, 
  column, 
  currentSort, 
  onSort 
}: { 
  label: string; 
  column: SortColumn; 
  currentSort: SortBy; 
  onSort: (column: SortColumn) => void;
}) {
  const isAsc = currentSort === `${column}_asc`;
  const isDesc = currentSort === `${column}_desc`;
  const isActive = isAsc || isDesc;

  return (
    <th 
      className="px-4 py-4 text-center font-medium min-w-[80px] cursor-pointer hover:bg-secondary/50 transition-colors select-none"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center justify-center gap-1">
        <span>{label}</span>
        <div className="flex flex-col">
          <ArrowUp className={cn(
            "w-3 h-3 -mb-1",
            isAsc ? "text-primary" : "text-muted-foreground/30"
          )} />
          <ArrowDown className={cn(
            "w-3 h-3 -mt-1",
            isDesc ? "text-primary" : "text-muted-foreground/30"
          )} />
        </div>
      </div>
    </th>
  );
}

export function PairTable({ pairs, exchange, loading, onPairClick, sortBy, onSortChange }: PairTableProps) {
  const handleSort = (column: SortColumn) => {
    const currentAsc = `${column}_asc` as SortBy;
    const currentDesc = `${column}_desc` as SortBy;
    
    if (sortBy === currentDesc) {
      onSortChange(currentAsc);
    } else {
      onSortChange(currentDesc);
    }
  };

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-card text-muted-foreground sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-left font-medium sticky left-0 bg-card z-20 min-w-[140px]">Pair</th>
              <SortableHeader label="Price" column="price" currentSort={sortBy} onSort={handleSort} />
              <SortableHeader label="RSI 5m" column="rsi5m" currentSort={sortBy} onSort={handleSort} />
              <SortableHeader label="RSI 15m" column="rsi15m" currentSort={sortBy} onSort={handleSort} />
              <SortableHeader label="RSI 30m" column="rsi30m" currentSort={sortBy} onSort={handleSort} />
              <SortableHeader label="RSI 1h" column="rsi1h" currentSort={sortBy} onSort={handleSort} />
              <SortableHeader label="RSI 4h" column="rsi4h" currentSort={sortBy} onSort={handleSort} />
              <SortableHeader label="RSI 1d" column="rsi1d" currentSort={sortBy} onSort={handleSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pairs.map((pair, index) => (
              <tr 
                key={pair.symbol} 
                className="hover:bg-card/50 transition-colors animate-fade-in cursor-pointer"
                style={{ animationDelay: `${index * 20}ms` }}
                onClick={() => onPairClick?.(pair)}
              >
                <td className="px-6 py-4 font-medium sticky left-0 bg-background z-10">
                  <span className="text-primary hover:text-accent hover:underline transition-colors">
                    {pair.symbol}
                  </span>
                </td>
                <td className="px-4 py-4 text-center text-foreground font-mono">
                  ${formatPrice(pair.price)}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={getRsiColor(pair.rsi5m)}>
                    {pair.rsi5m?.toFixed(1) || '-'}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={getRsiColor(pair.rsi15m)}>
                    {pair.rsi15m?.toFixed(1) || '-'}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={getRsiColor(pair.rsi30m)}>
                    {pair.rsi30m?.toFixed(1) || '-'}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={getRsiColor(pair.rsi1h)}>
                    {pair.rsi1h?.toFixed(1) || '-'}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={getRsiColor(pair.rsi4h)}>
                    {pair.rsi4h?.toFixed(1) || '-'}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={getRsiColor(pair.rsi1d)}>
                    {pair.rsi1d?.toFixed(1) || '-'}
                  </span>
                </td>
              </tr>
            ))}
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
