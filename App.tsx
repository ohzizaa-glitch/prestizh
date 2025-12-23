import React, { useState, useMemo, useEffect } from 'react';
import { SERVICE_CATEGORIES, PRINTING_CATEGORY, PHOTO_VARIANTS, DIGITAL_CATEGORY_IDS } from './constants';
import ServiceCard from './components/ServiceCard';
import PrintingSection from './components/PrintingSection';
import Receipt from './components/Receipt';
import HistoryModal from './components/HistoryModal';
import EarningsModal from './components/EarningsModal';
import DigitalReceiptModal from './components/DigitalReceiptModal';
import PhotoCutter from './components/PhotoCutter';
import { ShoppingBag, History, TrendingUp, Settings, Crop } from 'lucide-react';
import { PaymentMethod, Order } from './types';

export default function App() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  
  // Modals States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEarningsOpen, setIsEarningsOpen] = useState(false);
  const [isCutterOpen, setIsCutterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  // Settings State
  const [nextReceiptNumber, setNextReceiptNumber] = useState<number>(554);

  // Digital Receipt State
  const [activeDigitalOrder, setActiveDigitalOrder] = useState<Order | null>(null);

  // Load state from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('prestige_order_history');
    if (savedHistory) {
      try {
        setOrderHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    const savedNum = localStorage.getItem('prestige_next_receipt_num');
    if (savedNum) setNextReceiptNumber(parseInt(savedNum));
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

  const handleUpdateNextReceiptNum = (val: string) => {
    const num = parseInt(val) || 1;
    setNextReceiptNumber(num);
    localStorage.setItem('prestige_next_receipt_num', num.toString());
  };

  const updateOrderInHistory = (updatedOrder: Order) => {
    const newHistory = orderHistory.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    setOrderHistory(newHistory);
    localStorage.setItem('prestige_order_history', JSON.stringify(newHistory));
    setActiveDigitalOrder(updatedOrder);
  };

  // Flatten all items for calculation
  const allItems = useMemo(() => {
    const standardItems = SERVICE_CATEGORIES.flatMap(cat => cat.items.map(i => ({ ...i, categoryId: cat.id })));
    const printingItems = PRINTING_CATEGORY.items.map(i => ({ ...i, categoryId: PRINTING_CATEGORY.id }));
    return [...standardItems, ...printingItems];
  }, []);

  // Calculate total price
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
    let hasDigitalItems = false;
    let digitalSubtotal = 0;
    const digitalOrderItems: Order['items'] = [];
    
    Object.entries(quantities).forEach(([key, value]) => {
       const qty = value as number;
       const [itemId, variantId] = key.split('__');
       const item = allItems.find(i => i.id === itemId);
       if(item) {
          const variant = variantId ? PHOTO_VARIANTS.find(v => v.id === variantId) : undefined;
          const price = item.isPriceEditable ? (customPrices[itemId] || 0) : item.price;
          const itemData = {
             name: item.name,
             variant: variant?.label,
             price: price,
             quantity: qty,
             total: qty * price,
             categoryId: item.categoryId
          };
          
          orderItems.push(itemData);

          if (DIGITAL_CATEGORY_IDS.includes(item.categoryId || '')) {
            hasDigitalItems = true;
            digitalSubtotal += qty * price;
            digitalOrderItems.push(itemData);
          }
       }
    });

    const currentReceiptNum = nextReceiptNumber.toString().padStart(6, '0');

    const newOrder: Order = {
       id: Date.now().toString(),
       receiptNumber: hasDigitalItems ? currentReceiptNum : undefined,
       date: new Date().toISOString(),
       issueDate: new Date().toISOString(),
       timestamp: Date.now(),
       items: orderItems,
       totalAmount: totalPrice,
       paymentMethod
    };

    if (hasDigitalItems) {
      const nextNum = nextReceiptNumber + 1;
      setNextReceiptNumber(nextNum);
      localStorage.setItem('prestige_next_receipt_num', nextNum.toString());
    }

    const newHistory = [newOrder, ...orderHistory];
    setOrderHistory(newHistory);
    localStorage.setItem('prestige_order_history', JSON.stringify(newHistory));
    
    setQuantities({});
    setCustomPrices({});

    if (hasDigitalItems) {
      setActiveDigitalOrder({
        ...newOrder,
        items: digitalOrderItems,
        totalAmount: digitalSubtotal
      });
    } else {
      alert(`Заказ на сумму ${totalPrice} ₽ успешно сохранен!`);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
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
               onClick={() => setIsCutterOpen(true)}
               className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center space-x-1 border border-blue-100 mr-2"
               title="Инструмент обрезки фото"
            >
               <Crop size={20} />
               <span className="hidden sm:inline text-sm font-bold uppercase tracking-tighter">AI-Резак</span>
            </button>
            <button 
               onClick={() => setIsSettingsOpen(!isSettingsOpen)}
               className={`p-2 rounded-lg transition-colors flex items-center space-x-1 ${isSettingsOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
               title="Настройки"
            >
               <Settings size={20} />
            </button>
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

        {/* Quick Settings Panel */}
        {isSettingsOpen && (
          <div className="bg-slate-50 border-b border-slate-200 py-3 px-4 animate-in slide-in-from-top duration-200">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center space-x-3">
                <label className="text-xs font-bold text-slate-500 uppercase">След. номер квитанции:</label>
                <input 
                  type="number" 
                  value={nextReceiptNumber}
                  onChange={(e) => handleUpdateNextReceiptNum(e.target.value)}
                  className="w-24 bg-white border border-slate-200 rounded px-2 py-1 text-sm font-bold text-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 italic">Номер увеличивается автоматически после каждого цифрового заказа.</p>
            </div>
          </div>
        )}

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
        <div id={PRINTING_CATEGORY.id} className="scroll-mt-44 mb-8">
          <PrintingSection 
            category={PRINTING_CATEGORY}
            quantities={quantities}
            onQuantityChange={handleQuantityChange}
          />
        </div>

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

      {/* Modals */}
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

      {isHistoryOpen && (
        <HistoryModal 
           orders={orderHistory}
           onClose={() => setIsHistoryOpen(false)}
           onClearHistory={handleClearHistory}
           onViewDigitalReceipt={(order) => {
              setActiveDigitalOrder(order);
              setIsHistoryOpen(false);
           }}
        />
      )}

      {isEarningsOpen && (
        <EarningsModal 
           orders={orderHistory}
           onClose={() => setIsEarningsOpen(false)}
        />
      )}

      {isCutterOpen && (
        <PhotoCutter 
          onClose={() => setIsCutterOpen(false)}
        />
      )}

      {activeDigitalOrder && (
        <DigitalReceiptModal 
          order={activeDigitalOrder}
          onClose={() => setActiveDigitalOrder(null)}
          onUpdateOrder={updateOrderInHistory}
        />
      )}
    </div>
  );
}