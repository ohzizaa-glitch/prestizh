
import React, { useState, useMemo, useEffect } from 'react';
import { SERVICE_CATEGORIES, PRINTING_CATEGORY, PHOTO_VARIANTS, DIGITAL_CATEGORY_IDS } from './constants';
import ServiceCard from './components/ServiceCard';
import PrintingSection from './components/PrintingSection';
import Receipt from './components/Receipt';
import HistoryModal from './components/HistoryModal';
import EarningsModal from './components/EarningsModal';
import DigitalReceiptModal from './components/DigitalReceiptModal';
import PhotoCutter from './components/PhotoCutter';
import CloudInbox from './components/CloudInbox';
import Toast from './components/Toast';
import { ShoppingBag, History, TrendingUp, Settings, Crop, Search, Moon, Sun, CloudUpload } from 'lucide-react';
import { PaymentMethod, Order, ServiceItem } from './types';

export default function App() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('prestige_theme') === 'dark');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEarningsOpen, setIsEarningsOpen] = useState(false);
  const [isCutterOpen, setIsCutterOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<{id: number, message: string, type: 'success' | 'info' | 'error'}[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [nextReceiptNumber, setNextReceiptNumber] = useState<number>(554);
  const [activeDigitalOrder, setActiveDigitalOrder] = useState<Order | null>(null);

  // Load data on mount
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

  useEffect(() => {
    localStorage.setItem('prestige_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const allItems = useMemo(() => {
    const standardItems = SERVICE_CATEGORIES.flatMap(cat => cat.items.map(i => ({ ...i, categoryId: cat.id })));
    const printingItems = PRINTING_CATEGORY.items.map(i => ({ ...i, categoryId: PRINTING_CATEGORY.id }));
    return [...standardItems, ...printingItems];
  }, []);

  // ЦЕНТРАЛЬНАЯ ФУНКЦИЯ РАСЧЕТА ЦЕНЫ (Единая для всего приложения)
  const getActualPrice = (item: ServiceItem, qty: number, variantId?: string) => {
    // 1. Оптовые скидки на печать
    if (item.id === 'print_10x15' && qty >= 100) return 19;
    if (item.id === 'print_15x20' && qty >= 50) return 35;
    if (item.id === 'print_20x30' && qty >= 30) return 75;

    // 2. Цена конкретного варианта (Флешки и т.д.)
    if (variantId) {
       const variantsList = item.variants || PHOTO_VARIANTS;
       const v = variantsList.find(v => v.id === variantId);
       if (v?.price !== undefined) return v.price;
    }

    // 3. Ручной ввод цены
    if (item.isPriceEditable && customPrices[item.id]) return customPrices[item.id];

    // 4. Базовая цена из прайса
    return item.price;
  };

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

  const totalPrice = useMemo(() => {
    return Object.entries(quantities).reduce((total, [key, value]) => {
      const qty = value as number;
      const [itemId, variantId] = key.split('__');
      const item = allItems.find(i => i.id === itemId);
      if (!item) return total;
      return total + (qty * getActualPrice(item, qty, variantId));
    }, 0);
  }, [allItems, quantities, customPrices]);

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
          const variantsList = item.variants || PHOTO_VARIANTS;
          const variant = variantId ? variantsList.find(v => v.id === variantId) : undefined;
          const price = getActualPrice(item, qty, variantId);
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

    const updatedHistory = [newOrder, ...orderHistory];
    setOrderHistory(updatedHistory);
    localStorage.setItem('prestige_order_history', JSON.stringify(updatedHistory));
    
    setQuantities({});
    setCustomPrices({});
    showToast(`Заказ №${newOrder.id.slice(-4)} сохранен (${paymentMethod === 'cash' ? 'Наличные' : 'Карта'})`);

    if (hasDigitalItems) {
      setActiveDigitalOrder({ ...newOrder, items: digitalOrderItems, totalAmount: digitalSubtotal });
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return SERVICE_CATEGORIES;
    const query = searchQuery.toLowerCase();
    return SERVICE_CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.filter(item => item.name.toLowerCase().includes(query))
    })).filter(cat => cat.items.length > 0);
  }, [searchQuery]);

  return (
    <div className={`min-h-screen transition-colors duration-300 dark:bg-slate-900 bg-slate-50`}>
      <Toast toasts={toasts} />
      
      {/* Header */}
      <header className="sticky top-0 z-40 dark:bg-slate-800/90 bg-white/90 backdrop-blur-md border-b dark:border-slate-700 border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/20">
                <span className="font-black text-xl tracking-tighter">П</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-black uppercase tracking-tighter leading-none dark:text-white text-slate-800">Престиж</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Photo Studio</p>
              </div>
            </div>
            
            <div className="flex-grow max-w-md relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text"
                 placeholder="Поиск услуг..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full py-2.5 pl-10 pr-4 rounded-xl border dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-200 bg-slate-50 outline-none text-sm"
               />
            </div>

            <div className="flex items-center space-x-2">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl dark:bg-slate-700 dark:text-yellow-400 bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
                {isDarkMode ? <Sun size={20} /> : < Moon size={20} />}
              </button>
              <button onClick={() => setIsHistoryOpen(true)} className="p-2.5 rounded-xl dark:bg-slate-700 dark:text-blue-400 bg-slate-100 text-blue-600 hover:bg-slate-200 transition-all">
                <History size={20} />
              </button>
              <button onClick={() => setIsCutterOpen(true)} className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
                <Crop size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-1">
             <button onClick={() => setIsEarningsOpen(true)} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight dark:text-slate-400 text-slate-500 hover:text-emerald-500 transition-colors"><TrendingUp size={16}/><span>Доходы</span></button>
             <button onClick={() => setIsInboxOpen(true)} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight dark:text-slate-400 text-slate-500 hover:text-blue-500 transition-colors"><CloudUpload size={16}/><span>Прием файлов</span></button>
             <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight dark:text-slate-400 text-slate-500 hover:text-slate-900 transition-colors"><Settings size={16}/><span>Настройки</span></button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 pb-32">
        {!searchQuery && (
          <PrintingSection category={PRINTING_CATEGORY} quantities={quantities} onQuantityChange={handleQuantityChange} isDarkMode={isDarkMode} />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map(category => (
            <ServiceCard key={category.id} category={category} quantities={quantities} customPrices={customPrices} onQuantityChange={handleQuantityChange} onPriceChange={(id, p) => setCustomPrices(prev => ({...prev, [id]: p}))} isDarkMode={isDarkMode} />
          ))}
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t dark:bg-slate-800 dark:border-slate-700 bg-white border-slate-200 shadow-2xl z-40 p-4 safe-area-bottom">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Сумма заказа</p>
            <p className="text-3xl font-black tracking-tighter dark:text-white text-slate-900 leading-none">{totalPrice} <span className="text-blue-600 font-bold">₽</span></p>
          </div>
          <button onClick={() => setIsReceiptOpen(true)} className="flex items-center space-x-3 bg-blue-600 text-white py-4 px-10 rounded-2xl font-black shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all relative">
            <ShoppingBag size={24} />
            <span className="uppercase tracking-tighter text-lg">Корзина</span>
            {/* Fix: Explicitly type the reduce parameters to avoid 'unknown' type inference error */}
            {Object.keys(quantities).length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-full border-4 dark:border-slate-800 border-white">{Object.values(quantities).reduce((a: number, b: number) => a + b, 0)}</span>}
          </button>
        </div>
      </div>

      {/* Modals */}
      {isReceiptOpen && <Receipt items={allItems} quantities={quantities} customPrices={customPrices} onClose={() => setIsReceiptOpen(false)} onClear={() => {setQuantities({}); setCustomPrices({});}} onSaveOrder={handleSaveOrder} isDarkMode={isDarkMode} />}
      {isHistoryOpen && <HistoryModal orders={orderHistory} onClose={() => setIsHistoryOpen(false)} onClearHistory={() => {setOrderHistory([]); localStorage.removeItem('prestige_order_history');}} onDeleteOrder={(id) => {const h = orderHistory.filter(o=>o.id!==id); setOrderHistory(h); localStorage.setItem('prestige_order_history', JSON.stringify(h));}} onViewDigitalReceipt={(order) => setActiveDigitalOrder(order)} isDarkMode={isDarkMode} />}
      {isEarningsOpen && <EarningsModal orders={orderHistory} onClose={() => setIsEarningsOpen(false)} isDarkMode={isDarkMode} />}
      {isCutterOpen && <PhotoCutter onClose={() => setIsCutterOpen(false)} isDarkMode={isDarkMode} onNotify={showToast} />}
      {isInboxOpen && <CloudInbox onClose={() => setIsInboxOpen(false)} isDarkMode={isDarkMode} onNotify={showToast} />}
      {activeDigitalOrder && <DigitalReceiptModal order={activeDigitalOrder} onClose={() => setActiveDigitalOrder(null)} onUpdateOrder={(o) => {const h = orderHistory.map(old => old.id === o.id ? o : old); setOrderHistory(h); localStorage.setItem('prestige_order_history', JSON.stringify(h));}} isDarkMode={isDarkMode} />}
    </div>
  );
}
