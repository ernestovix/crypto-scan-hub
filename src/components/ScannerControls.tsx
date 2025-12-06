import { Timeframe } from '@/lib/exchanges';
import { SortBy } from '@/hooks/useCryptoScanner';

interface ScannerControlsProps {
  timeframe: Timeframe;
  sortBy: SortBy;
  mfiUpper: number;
  mfiLower: number;
  onTimeframeChange: (value: Timeframe) => void;
  onSortChange: (value: SortBy) => void;
  onMfiUpperChange: (value: number) => void;
  onMfiLowerChange: (value: number) => void;
}

export function ScannerControls({
  timeframe,
  sortBy,
  mfiUpper,
  mfiLower,
  onTimeframeChange,
  onSortChange,
  onMfiUpperChange,
  onMfiLowerChange
}: ScannerControlsProps) {
  return (
    <div className="bg-card p-6 border-b border-border">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <option value="mfi_desc">MFI ↓ (Highest)</option>
            <option value="mfi_asc">MFI ↑ (Lowest)</option>
            <option value="rsi_desc">RSI ↓ (Highest)</option>
            <option value="rsi_asc">RSI ↑ (Lowest)</option>
            <option value="volume_desc">Volume ↓</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-muted-foreground">MFI Upper Limit</label>
          <select
            value={mfiUpper}
            onChange={(e) => onMfiUpperChange(Number(e.target.value))}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
          >
            <option value={999}>No Limit</option>
            <option value={90}>90 (Extremely Overbought)</option>
            <option value={80}>80 (Overbought)</option>
            <option value={70}>70</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-muted-foreground">MFI Lower Limit</label>
          <select
            value={mfiLower}
            onChange={(e) => onMfiLowerChange(Number(e.target.value))}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
          >
            <option value={0}>No Limit</option>
            <option value={10}>10 (Extremely Oversold)</option>
            <option value={20}>20 (Oversold)</option>
            <option value={30}>30</option>
          </select>
        </div>
      </div>
    </div>
  );
}
