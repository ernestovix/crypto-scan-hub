import { useState, useEffect, useMemo } from 'react';
import { Exchange, Timeframe, CryptoPair, exchanges } from '@/lib/exchanges';
import { useCryptoScanner, SortBy } from '@/hooks/useCryptoScanner';
import { ScannerControls } from './ScannerControls';
import { PairTable } from './PairTable';
import { PairDetailPage } from './PairDetailPage';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface ScannerPageProps {
  exchange: Exchange;
  onBack: () => void;
}

export function ScannerPage({ exchange, onBack }: ScannerPageProps) {
  const [sortBy, setSortBy] = useState<SortBy>('avg_buy'); // Default to Avg ↑
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPair, setSelectedPair] = useState<CryptoPair | null>(null);

  const { pairs, loading, progress, loadData, sortPairs, filterPairs } = useCryptoScanner();

  const exchangeInfo = exchanges.find(e => e.id === exchange);

  useEffect(() => {
    // Always use 4h as default timeframe
    loadData(exchange, '4h');
  }, [exchange, loadData]);

  const filteredAndSortedPairs = useMemo(() => {
    const filtered = filterPairs(pairs, searchQuery);
    return sortPairs(filtered, sortBy);
  }, [pairs, searchQuery, sortBy, filterPairs, sortPairs]);

  const handlePairClick = (pair: CryptoPair) => {
    setSelectedPair(pair);
  };

  // Show pair detail page if a pair is selected
  if (selectedPair) {
    return (
      <PairDetailPage 
        pair={selectedPair} 
        exchange={exchange} 
        onBack={() => setSelectedPair(null)} 
      />
    );
  }

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
                {exchangeInfo?.name}
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

      {/* Controls - No timeframe selector */}
      <ScannerControls
        sortBy={sortBy}
        searchQuery={searchQuery}
        pairs={pairs}
        onSortChange={setSortBy}
        onSearchChange={setSearchQuery}
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
      <PairTable 
        pairs={filteredAndSortedPairs} 
        exchange={exchange} 
        loading={loading}
        onPairClick={handlePairClick}
      />
    </div>
  );
}
