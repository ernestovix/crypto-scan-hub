import { useState, useRef, useEffect } from 'react';
import { Timeframe, CryptoPair } from '@/lib/exchanges';
import { SortBy } from '@/hooks/useCryptoScanner';
import { Search, X } from 'lucide-react';

interface ScannerControlsProps {
  timeframe: Timeframe;
  sortBy: SortBy;
  searchQuery: string;
  pairs: CryptoPair[];
  onTimeframeChange: (value: Timeframe) => void;
  onSortChange: (value: SortBy) => void;
  onSearchChange: (value: string) => void;
}

export function ScannerControls({
  timeframe,
  sortBy,
  searchQuery,
  pairs,
  onTimeframeChange,
  onSortChange,
  onSearchChange
}: ScannerControlsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = pairs
    .filter(p => p.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 10);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-card p-6 border-b border-border">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-muted-foreground">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => onTimeframeChange(e.target.value as Timeframe)}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
          >
            <option value="4h">4 Hours (Default)</option>
            <option value="1d">1 Day</option>
            <option value="12h">12 Hours</option>
            <option value="30m">30 Minutes</option>
            <option value="15m">15 Minutes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-muted-foreground">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortBy)}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
          >
            <option value="avg_buy">🟢 Strong Buy (AVG)</option>
            <option value="avg_sell">🔴 Strong Sell (AVG)</option>
            <option value="stochrsi_desc">SRSI ↓ (Highest)</option>
            <option value="stochrsi_asc">SRSI ↑ (Lowest)</option>
            <option value="rsi_desc">RSI ↓ (Highest)</option>
            <option value="rsi_asc">RSI ↑ (Lowest)</option>
            <option value="mfi_desc">MFI ↓ (Highest)</option>
            <option value="mfi_asc">MFI ↑ (Lowest)</option>
            <option value="volume_desc">Volume ↓</option>
          </select>
        </div>

        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-medium mb-2 text-muted-foreground">Search Pairs</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Type to search pairs..."
              className="w-full bg-secondary border border-border rounded-lg pl-10 pr-10 py-3 text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
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
                    onSearchChange(pair.symbol);
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
    </div>
  );
}
