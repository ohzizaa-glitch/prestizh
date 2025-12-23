import React, { useState, useMemo, useEffect } from 'react';
import { SERVICE_CATEGORIES, PRINTING_CATEGORY, PHOTO_VARIANTS } from './constants';
import ServiceCard from './components/ServiceCard';
import PrintingSection from './components/PrintingSection';
import Receipt from './components/Receipt';
import HistoryModal from './components/HistoryModal';
import EarningsModal from './components/EarningsModal';
import { ShoppingBag, History, TrendingUp } from 'lucide-react';
import { PaymentMethod, Order } from './types';

export default function App() {
  // Store quantities as { [itemId or itemId__variantId]: number }
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  // Store custom prices for editable items: { [itemId]: price }
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  
  // History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEarningsOpen, setIsEarningsOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('prestige_order_history');
    if (savedHistory) {
      try {
        setOrderHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

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

  const handlePriceChange = (id: string, price: number) => {
    setCustomPrices(prev => ({ ...prev, [id]: price }));
  };

  const handleClearCart = () => {
    setQuantities({});
    setCustomPrices({});
    setIsReceiptOpen(false);
  };

  const handleClearHistory = () => {
    setOrderHistory([]);
    localStorage.removeItem('prestige_order_history');
  };

  // Flatten all items for calculation
  const allItems = useMemo(() => {
    const standardItems = SERVICE_CATEGORIES.flatMap(cat => cat.items);
    const printingItems = PRINTING_CATEGORY.items;
    return [...standardItems, ...printingItems];
  }, []);

  // Calculate total price accounting for composite keys and custom prices
  const totalPrice = useMemo(() => {
    return Object.entries(quantities).reduce((total, [key, value]) => {
      const qty = value as number;
      const [itemId] = key.split('__');
      const item = allItems.find(i => i.id === itemId);
      const price = (item?.isPriceEditable ? (customPrices[itemId] || 0) : (item?.price || 0));
      return total + (qty * price);
    }, 0);
  }, [allItems, quantities, customPrices]);

  const totalItemsCount = (Object.values(quantities) as number[]).reduce((a, b) => a + b, 0);

  const handleSaveOrder = (paymentMethod: PaymentMethod) => {
    const orderItems: Order['items'] = [];
    
    Object.entries(quantities).forEach(([key, value]) => {
       const qty = value as number;
       const [itemId, variantId] = key.split('__');
       const item = allItems.find(i => i.id === itemId);
       if(item) {
          const variant = variantId ? PHOTO_VARIANTS.find(v => v.id === variantId) : undefined;
          const price = item.isPriceEditable ? (customPrices[itemId] || 0) : item.price;
          orderItems.push({
             name: item.name,
             variant: variant?.label,
             price: price,
             quantity: qty,
             total: qty * price
          });
       }
    });

    const newOrder: Order = {
       id: Date.now().toString(),
       date: new Date().toISOString(),
       timestamp: Date.now(),
       items: orderItems,
       totalAmount: totalPrice,
       paymentMethod
    };

    const newHistory = [newOrder, ...orderHistory];
    setOrderHistory(newHistory);
    localStorage.setItem('prestige_order_history', JSON.stringify(newHistory));
    
    // Clear cart after save
    setQuantities({});
    setCustomPrices({});
    alert(`Заказ на сумму ${totalPrice} ₽ успешно сохранен!`);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Offset for sticky header
      const headerOffset = 160;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <span className="font-bold text-xl tracking-tighter">П</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-none">Престиж</h1>
              <p className="text-xs text-slate-500 font-medium">Калькулятор услуг</p>
            </div>
          </div>
          
          <div className="flex space-x-1">
            <button 
               onClick={() => setIsEarningsOpen(true)}
               className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors flex items-center space-x-1"
               title="Статистика доходов"
            >
               <TrendingUp size={20} />
               <span className="hidden sm:inline text-sm font-medium">Доходы</span>
            </button>
            <button 
               onClick={() => setIsHistoryOpen(true)}
               className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center space-x-1"
               title="История заказов"
            >
               <History size={20} />
               <span className="hidden sm:inline text-sm font-medium">История</span>
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="max-w-6xl mx-auto px-4 pb-3 overflow-x-auto no-scrollbar">
          <div className="flex space-x-2">
            <button
              onClick={() => scrollToSection(PRINTING_CATEGORY.id)}
              className="whitespace-nowrap px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-100"
            >
              {PRINTING_CATEGORY.title}
            </button>
            {SERVICE_CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => scrollToSection(category.id)}
                className="whitespace-nowrap px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-100"
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Printing Section First */}
        <div id={PRINTING_CATEGORY.id} className="scroll-mt-44 mb-8">
          <PrintingSection 
            category={PRINTING_CATEGORY}
            quantities={quantities}
            onQuantityChange={handleQuantityChange}
          />
        </div>

        {/* Other Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICE_CATEGORIES.map(category => (
            <div key={category.id} id={category.id} className="scroll-mt-44 flex flex-col h-full">
              <ServiceCard 
                category={category}
                quantities={quantities}
                customPrices={customPrices}
                onQuantityChange={handleQuantityChange}
                onPriceChange={handlePriceChange}
              />
            </div>
          ))}
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 p-4 safe-area-bottom">
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
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white animate-bounce">
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
          customPrices={customPrices}
          onClose={() => setIsReceiptOpen(false)}
          onClear={handleClearCart}
          onSaveOrder={handleSaveOrder}
        />
      )}

      {/* History Modal */}
      {isHistoryOpen && (
        <HistoryModal 
           orders={orderHistory}
           onClose={() => setIsHistoryOpen(false)}
           onClearHistory={handleClearHistory}
        />
      )}

      {/* Earnings Modal */}
      {isEarningsOpen && (
        <EarningsModal 
           orders={orderHistory}
           onClose={() => setIsEarningsOpen(false)}
        />
      )}
    </div>
  );
}