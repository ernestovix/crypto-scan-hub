import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Exchange, Timeframe, CryptoPair, exchanges } from '@/lib/exchanges';
import { useCryptoScanner, SortBy } from '@/hooks/useCryptoScanner';
import { PairTable } from './PairTable';
import { PairDetailPage } from './PairDetailPage';
import { ArrowLeft, Loader2, Search, X, ChevronDown, Star, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScannerPageProps {
  exchange: Exchange;
  onBack: () => void;
}

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '30m', label: '30m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1D' },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'rsi_asc', label: 'RSI ↑' },
  { value: 'rsi_desc', label: 'RSI ↓' },
  { value: 'srsi_asc', label: 'SRSI ↑' },
  { value: 'srsi_desc', label: 'SRSI ↓' },
  { value: 'mfi_asc', label: 'MFI ↑' },
  { value: 'mfi_desc', label: 'MFI ↓' },
  { value: 'rvi_asc', label: 'RVI ↑' },
  { value: 'rvi_desc', label: 'RVI ↓' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
];

const AUTO_REFRESH_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
];

export function ScannerPage({ exchange, onBack }: ScannerPageProps) {
  const [sortBy, setSortBy] = useState<SortBy>('rsi_asc');
  const [timeframe, setTimeframe] = useState<Timeframe>('4h');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPair, setSelectedPair] = useState<CryptoPair | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(0);
  const [showRefreshDropdown, setShowRefreshDropdown] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const timeframeDropdownRef = useRef<HTMLDivElement>(null);
  const refreshDropdownRef = useRef<HTMLDivElement>(null);

  const { pairs, loading, progress, loadData, sortPairs, filterPairs } = useCryptoScanner();

  const exchangeInfo = exchanges.find(e => e.id === exchange);

  const handleRefresh = useCallback(() => {
    loadData(exchange, timeframe);
    setLastRefresh(new Date());
  }, [exchange, timeframe, loadData]);

  useEffect(() => {
    handleRefresh();
  }, [exchange, timeframe]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh === 0 || loading) return;
    
    const interval = setInterval(() => {
      handleRefresh();
    }, autoRefresh * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, loading, handleRefresh]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
      if (timeframeDropdownRef.current && !timeframeDropdownRef.current.contains(event.target as Node)) {
        setShowTimeframeDropdown(false);
      }
      if (refreshDropdownRef.current && !refreshDropdownRef.current.contains(event.target as Node)) {
        setShowRefreshDropdown(false);
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

      {/* Controls Bar */}
      <div className="bg-card p-6 border-b border-border">
        <div className="flex flex-wrap items-end gap-4">
          {/* Timeframe Dropdown */}
          <div className="relative" ref={timeframeDropdownRef}>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Timeframe</label>
            <button
              onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
              className="flex items-center gap-2 bg-secondary border border-border rounded-lg px-4 py-3 text-foreground hover:bg-secondary/80 transition-colors min-w-[100px]"
            >
              <span>{TIMEFRAMES.find(t => t.value === timeframe)?.label}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            {showTimeframeDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => {
                      setTimeframe(tf.value);
                      setShowTimeframeDropdown(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left hover:bg-secondary transition-colors text-foreground",
                      tf.value === timeframe && "bg-primary/20"
                    )}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative" ref={sortDropdownRef}>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Sort By</label>
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 bg-secondary border border-border rounded-lg px-4 py-3 text-foreground hover:bg-secondary/80 transition-colors min-w-[120px]"
            >
              <span>{SORT_OPTIONS.find(s => s.value === sortBy)?.label}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            {showSortDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortDropdown(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left hover:bg-secondary transition-colors text-foreground",
                      option.value === sortBy && "bg-primary/20"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Favorites Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Filter</label>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={cn(
                "flex items-center gap-2 border rounded-lg px-4 py-3 transition-colors",
                showFavoritesOnly 
                  ? "bg-yellow-500/20 border-yellow-500 text-yellow-500" 
                  : "bg-secondary border-border text-foreground hover:bg-secondary/80"
              )}
            >
              <Star className={cn("w-4 h-4", showFavoritesOnly && "fill-yellow-500")} />
              <span>Favorites</span>
            </button>
          </div>

          {/* Auto-Refresh Dropdown */}
          <div className="relative" ref={refreshDropdownRef}>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Auto-Refresh</label>
            <button
              onClick={() => setShowRefreshDropdown(!showRefreshDropdown)}
              className={cn(
                "flex items-center gap-2 border rounded-lg px-4 py-3 transition-colors min-w-[100px]",
                autoRefresh > 0 
                  ? "bg-green-500/20 border-green-500 text-green-500" 
                  : "bg-secondary border-border text-foreground hover:bg-secondary/80"
              )}
            >
              <RefreshCw className={cn("w-4 h-4", autoRefresh > 0 && "animate-spin")} style={{ animationDuration: '3s' }} />
              <span>{AUTO_REFRESH_OPTIONS.find(o => o.value === autoRefresh)?.label}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            {showRefreshDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                {AUTO_REFRESH_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setAutoRefresh(option.value);
                      setShowRefreshDropdown(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left hover:bg-secondary transition-colors text-foreground",
                      option.value === autoRefresh && "bg-primary/20"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Manual Refresh Button */}
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Refresh</label>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 bg-primary border border-primary rounded-lg px-4 py-3 text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              <span>Now</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md" ref={dropdownRef}>
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

        {/* Last refresh info */}
        {!loading && pairs.length > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
            {autoRefresh > 0 && ` • Auto-refreshing every ${autoRefresh}s`}
          </div>
        )}
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
        showFavoritesOnly={showFavoritesOnly}
      />
    </div>
  );
}