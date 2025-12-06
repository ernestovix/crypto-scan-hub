import { exchanges, Exchange } from '@/lib/exchanges';
import { ExchangeCard } from './ExchangeCard';

interface ExchangeSelectorProps {
  onSelect: (exchange: Exchange) => void;
}

export function ExchangeSelector({ onSelect }: ExchangeSelectorProps) {
  return (
    <div className="flex-1 flex items-center justify-center gradient-hero min-h-screen">
      <div className="text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
          Crypto RSI & MFI Scanner
        </h1>
        <p className="text-xl text-muted-foreground mb-12">
          Real-time technical analysis across top exchanges
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 max-w-5xl mx-auto">
          {exchanges.map((exchange, index) => (
            <ExchangeCard
              key={exchange.id}
              exchange={exchange}
              onClick={() => onSelect(exchange.id)}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
