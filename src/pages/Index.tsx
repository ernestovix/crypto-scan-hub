import { useState } from 'react';
import { Exchange } from '@/lib/exchanges';
import { ExchangeSelector } from '@/components/ExchangeSelector';
import { ScannerPage } from '@/components/ScannerPage';

const Index = () => {
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      {!selectedExchange ? (
        <ExchangeSelector onSelect={setSelectedExchange} />
      ) : (
        <ScannerPage 
          exchange={selectedExchange} 
          onBack={() => setSelectedExchange(null)} 
        />
      )}
    </div>
  );
};

export default Index;
