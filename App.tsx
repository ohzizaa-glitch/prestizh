import React, { useState, useMemo } from 'react';
import { SERVICE_CATEGORIES, PRINTING_CATEGORY } from './constants';
import ServiceCard from './components/ServiceCard';
import PrintingSection from './components/PrintingSection';
import Receipt from './components/Receipt';
import { ShoppingBag } from 'lucide-react';

export default function App() {
  // Store quantities as { [itemId]: number }
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const handleQuantityChange = (id: string, qty: number) => {
    setQuantities(prev => {
      if (qty <= 0) {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      }
      return { ...prev, [id]: qty };
    });
  };

  const handleClearCart = () => {
    setQuantities({});
    setIsReceiptOpen(false);
  };

  // Flatten all items for calculation
  const allItems = useMemo(() => {
    const standardItems = SERVICE_CATEGORIES.flatMap(cat => cat.items);
    const printingItems = PRINTING_CATEGORY.items;
    return [...standardItems, ...printingItems];
  }, []);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return allItems.reduce((total, item) => {
      const qty = quantities[item.id] || 0;
      return total + (qty * item.price);
    }, 0);
  }, [allItems, quantities]);

  const totalItemsCount = (Object.values(quantities) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <span className="font-bold text-xl tracking-tighter">П</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-none">Престиж</h1>
              <p className="text-xs text-slate-500 font-medium">Калькулятор услуг</p>
            </div>
          </div>
          
          {/* Working hours section removed as requested */}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Printing Section First (Special Design) */}
        <PrintingSection 
          category={PRINTING_CATEGORY}
          quantities={quantities}
          onQuantityChange={handleQuantityChange}
        />

        {/* Other Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICE_CATEGORIES.map(category => (
            <ServiceCard 
              key={category.id}
              category={category}
              quantities={quantities}
              onQuantityChange={handleQuantityChange}
            />
          ))}
        </div>
      </main>

      {/* Sticky Bottom Bar for Mobile/Desktop */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-slate-500 text-sm mb-1">Итого к оплате:</p>
            <p className="text-3xl font-bold text-blue-600 leading-none">{totalPrice} ₽</p>
          </div>
          
          <button 
            onClick={() => setIsReceiptOpen(true)}
            className="flex items-center space-x-2 bg-slate-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-slate-800 transition-colors relative"
          >
            <ShoppingBag size={20} />
            <span>Корзина</span>
            {totalItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {isReceiptOpen && (
        <Receipt 
          items={allItems}
          quantities={quantities}
          onClose={() => setIsReceiptOpen(false)}
          onClear={handleClearCart}
        />
      )}
    </div>
  );
}