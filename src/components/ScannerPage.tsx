import { useState, useEffect, useMemo, useRef } from 'react';
import { Exchange, CryptoPair, exchanges } from '@/lib/exchanges';
import { useCryptoScanner, SortBy } from '@/hooks/useCryptoScanner';
import { PairTable } from './PairTable';
import { PairDetailPage } from './PairDetailPage';
import { ArrowLeft, Loader2, Search, X } from 'lucide-react';

interface ScannerPageProps {
  exchange: Exchange;
  onBack: () => void;
}

export function ScannerPage({ exchange, onBack }: ScannerPageProps) {
  const [sortBy, setSortBy] = useState<SortBy>('rsi4h_asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPair, setSelectedPair] = useState<CryptoPair | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { pairs, loading, progress, loadData, sortPairs, filterPairs } = useCryptoScanner();

  const exchangeInfo = exchanges.find(e => e.id === exchange);

  useEffect(() => {
    loadData(exchange, '4h');
  }, [exchange, loadData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAndSortedPairs = useMemo(() => {
    const filtered = filterPairs(pairs, searchQuery);
    return sortPairs(filtered, sortBy);
  }, [pairs, searchQuery, sortBy, filterPairs, sortPairs]);

  const filteredSuggestions = pairs
    .filter(p => p.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 10);

  const handlePairClick = (pair: CryptoPair) => {
    setSelectedPair(pair);
  };

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

      {/* Search Bar */}
      <div className="bg-card p-6 border-b border-border">
        <div className="relative max-w-md" ref={dropdownRef}>
          <label className="block text-sm font-medium mb-2 text-muted-foreground">Search Pairs</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Type to search pairs..."
              className="w-full bg-secondary border border-border rounded-lg pl-10 pr-10 py-3 text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {showDropdown && searchQuery && filteredSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredSuggestions.map((pair) => (
                <button
                  key={pair.symbol}
                  onClick={() => {
                    setSearchQuery(pair.symbol);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-secondary transition-colors text-foreground"
                >
                  {pair.symbol}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
    </div>
  );
}
