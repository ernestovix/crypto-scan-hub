import { useState, useEffect, useMemo } from 'react';
import { Exchange, Timeframe, exchanges } from '@/lib/exchanges';
import { useCryptoScanner, SortBy } from '@/hooks/useCryptoScanner';
import { ScannerControls } from './ScannerControls';
import { PairTable } from './PairTable';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface ScannerPageProps {
  exchange: Exchange;
  onBack: () => void;
}

export function ScannerPage({ exchange, onBack }: ScannerPageProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('4h');
  const [sortBy, setSortBy] = useState<SortBy>('mfi_desc');
  const [mfiUpper, setMfiUpper] = useState(999);
  const [mfiLower, setMfiLower] = useState(0);

  const { pairs, loading, progress, loadData, sortPairs, filterPairs } = useCryptoScanner();

  const exchangeInfo = exchanges.find(e => e.id === exchange);

  useEffect(() => {
    loadData(exchange, timeframe);
  }, [exchange, timeframe, loadData]);

  const filteredAndSortedPairs = useMemo(() => {
    const filtered = filterPairs(pairs, mfiLower, mfiUpper);
    return sortPairs(filtered, sortBy);
  }, [pairs, mfiLower, mfiUpper, sortBy, filterPairs, sortPairs]);

  const handleTimeframeChange = (value: Timeframe) => {
    setTimeframe(value);
  };

  return (
    <div className="flex-1 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-3">
              <img src={exchangeInfo?.logo} alt={exchangeInfo?.name} className="w-8 h-8" />
              <h2 className="text-2xl font-bold text-foreground">
                {exchangeInfo?.name} - RSI & MFI Scanner
              </h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {pairs.length} pairs loaded
            </span>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">
                Loading... {progress.current}/{progress.total}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <ScannerControls
        timeframe={timeframe}
        sortBy={sortBy}
        mfiUpper={mfiUpper}
        mfiLower={mfiLower}
        onTimeframeChange={handleTimeframeChange}
        onSortChange={setSortBy}
        onMfiUpperChange={setMfiUpper}
        onMfiLowerChange={setMfiLower}
      />

      {/* Progress Bar */}
      {loading && progress.total > 0 && (
        <div className="bg-card px-6 py-2">
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300 ease-out"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <PairTable pairs={filteredAndSortedPairs} exchange={exchange} loading={loading} />
    </div>
  );
}
