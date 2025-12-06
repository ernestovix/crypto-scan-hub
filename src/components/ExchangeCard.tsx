import { cn } from '@/lib/utils';
import { ExchangeInfo } from '@/lib/exchanges';

interface ExchangeCardProps {
  exchange: ExchangeInfo;
  onClick: () => void;
  index: number;
}

export function ExchangeCard({ exchange, onClick, index }: ExchangeCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group bg-card border border-border rounded-2xl p-8 shadow-2xl",
        "transition-all duration-300 transform hover:scale-110",
        "hover:border-primary/50 hover:shadow-primary/20 hover:shadow-xl",
        "animate-fade-in",
        exchange.hoverColor
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <img 
        src={exchange.logo} 
        alt={exchange.name} 
        className="w-20 h-20 mx-auto mb-4 transition-transform duration-300 group-hover:scale-110"
      />
      <p className="text-xl font-semibold text-foreground">{exchange.name}</p>
    </button>
  );
}
