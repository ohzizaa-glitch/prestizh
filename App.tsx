
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { SERVICE_CATEGORIES, PRINTING_CATEGORY, PHOTO_VARIANTS, DIGITAL_CATEGORY_IDS } from './constants';
import ServiceCard from './components/ServiceCard';
import PrintingSection from './components/PrintingSection';
import Receipt from './components/Receipt';
import HistoryModal from './components/HistoryModal';
import EarningsModal from './components/EarningsModal';
import DigitalReceiptModal from './components/DigitalReceiptModal';
import PhotoCutter from './components/PhotoCutter';
import CloudInbox from './components/CloudInbox';
import NotebookModal from './components/NotebookModal';
import TodoListModal from './components/TodoListModal';
import WorkloadWidget, { ActiveClient } from './components/WorkloadWidget';
import Toast from './components/Toast';
import { ShoppingBag, History, TrendingUp, Settings, Crop, Search, Moon, Sun, CloudUpload, Menu, X, ChevronRight, BookOpen, ClipboardList } from 'lucide-react';
import { PaymentMethod, Order, ServiceItem } from './types';

export default function App() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // 1. Инициализация темы сразу из памяти
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('prestige_theme') === 'dark';
  });
  
  // 2. Инициализация очереди клиентов
  const [clients, setClientsState] = useState<ActiveClient[]>(() => {
    try {
      const saved = localStorage.getItem('prestige_clients_queue');
      // Миграция старых данных (если там был remainingMs, он мог устареть)
      // Лучше сбросить, если структура не совпадает, или просто принять как есть
      // В новой версии мы используем finishTime.
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Ошибка загрузки очереди:', e);
      return [];
    }
  });

  // Канал для синхронизации между вкладками
  const syncChannel = useMemo(() => new BroadcastChannel('prestige_sync_channel'), []);

  // Обертка для изменения клиентов с синхронизацией
  const setClients = (newClientsOrUpdater: ActiveClient[] | ((prev: ActiveClient[]) => ActiveClient[])) => {
    setClientsState(prev => {
      const updated = typeof newClientsOrUpdater === 'function' ? newClientsOrUpdater(prev) : newClientsOrUpdater;
      
      // Сохраняем и уведомляем другие вкладки
      localStorage.setItem('prestige_clients_queue', JSON.stringify(updated));
      syncChannel.postMessage({ type: 'SYNC_CLIENTS', payload: updated });
      
      return updated;
    });
  };

  // Слушаем изменения из других вкладок (BroadcastChannel + Storage Event)
  useEffect(() => {
    // 1. Обработка сообщений от BroadcastChannel (быстрая синхронизация)
    syncChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'SYNC_CLIENTS') {
        setClientsState(event.data.payload);
      }
    };

    // 2. Обработка события storage (для надежности)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'prestige_clients_queue' && e.newValue) {
        try {
          const newQueue = JSON.parse(e.newValue);
          setClientsState(newQueue);
        } catch (err) {
          console.error('Ошибка синхронизации localStorage:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      syncChannel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [syncChannel]);


  // 3. Инициализация ИСТОРИИ ЗАКАЗОВ сразу из памяти
  const [orderHistory, setOrderHistory] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('prestige_order_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // 4. Инициализация номера квитанции
  const [nextReceiptNumber, setNextReceiptNumber] = useState<number>(() => {
    const saved = localStorage.getItem('prestige_next_receipt_num');
    return saved ? parseInt(saved) : 554;
  });

  // --- ЭФФЕКТЫ АВТОМАТИЧЕСКОГО СОХРАНЕНИЯ (Только локально, т.к. setClients уже пишет в LS) ---
  // Убрали useEffect для clients, так как сохранение перенесено в setClients
  
  // Сохраняем историю при ЛЮБОМ изменении
  useEffect(() => {
    localStorage.setItem('prestige_order_history', JSON.stringify(orderHistory));
  }, [orderHistory]);

  // Сохраняем номер квитанции
  useEffect(() => {
    localStorage.setItem('prestige_next_receipt_num', nextReceiptNumber.toString());
  }, [nextReceiptNumber]);

  // Сохраняем тему
  useEffect(() => {
    localStorage.setItem('prestige_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);


  // --- ОБРАБОТЧИКИ ---

  const handleAddClient = (type: 'regular' | 'urgent') => {
    setClients(prev => {
      // Ищем самое позднее время окончания среди текущих клиентов
      const maxFinishTime = prev.reduce((max, c) => Math.max(max, c.finishTime), Date.now());
      
      // Определяем длительность в мс
      let durationMs = 0;
      if (prev.length === 0 || maxFinishTime <= Date.now()) {
        // Если очередь пуста или все заказы уже просрочены, начинаем от "сейчас"
        durationMs = type === 'regular' ? 15 * 60000 : 20 * 60000;
      } else {
        // Иначе добавляем ко времени окончания последнего заказа
        const addMinutes = type === 'regular' ? 10 : 15;
        durationMs = addMinutes * 60000;
      }

      // Вычисляем время старта (либо сейчас, либо когда освободится последний)
      const startTime = Math.max(Date.now(), maxFinishTime);
      const finishTime = startTime + durationMs;

      const newClient: ActiveClient = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        finishTime: finishTime,
        totalDurationMs: durationMs, // Храним чисто для расчета прогрессбара
        label: type === 'regular' ? `Клиент` : `Тяжелый`
      };
      return [...prev, newClient];
    });
  };

  const handleRemoveClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // Добавить/убавить минуты у конкретного клиента (сдвигает финиш)
  const handleAddMinutes = (id: string, minutes: number) => {
    setClients(prev => prev.map(c => 
      c.id === id 
        ? { ...c, finishTime: c.finishTime + (minutes * 60000) } 
        : c
    ));
  };

  const handleClearQueue = () => {
    setClients([]);
  };
  
  // Modals States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEarningsOpen, setIsEarningsOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isCutterOpen, setIsCutterOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isTodoOpen, setIsTodoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Toast System
  const [toasts, setToasts] = useState<{id: number, message: string, type: 'success' | 'info' | 'error'}[]>([]);
  
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // --- SHORTCUTS (ГОРЯЧИЕ КЛАВИШИ) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Игнорируем нажатия, если пользователь печатает в поле ввода
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Клавиша "L" (Layout/Layers/Passport) - Фото на паспорт РФ
      if (e.key.toLowerCase() === 'l') {
        const itemId = 'doc_photo';
        const variantId = '3.5x4.5_rf'; // ID варианта Паспорт РФ из constants.tsx
        const quantityKey = `${itemId}__${variantId}`;

        setQuantities(prev => ({
          ...prev,
          [quantityKey]: (prev[quantityKey] || 0) + 1
        }));
        
        showToast('Быстрое добавление: Фото на паспорт РФ', 'success');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [activeDigitalOrder, setActiveDigitalOrder] = useState<Order | null>(null);

  const allItems = useMemo(() => {
    const standardItems = SERVICE_CATEGORIES.flatMap(cat => cat.items.map(i => ({ ...i, categoryId: cat.id })));
    const printingItems = PRINTING_CATEGORY.items.map(i => ({ ...i, categoryId: PRINTING_CATEGORY.id }));
    return [...standardItems, ...printingItems];
  }, []);

  const getActualPrice = (item: ServiceItem, qty: number, variantId?: string) => {
    // --- LOCKED BUSINESS LOGIC: PRINTING DISCOUNTS ---
    // 10x15: 100-199 -> 24rub, 200+ -> 23rub, Base -> 25rub
    if (item.id === 'print_10x15') {
        if (qty >= 200) return 23;
        if (qty >= 100) return 24;
    }
    // 15x20: 50+ -> 45rub, Base -> 50rub
    if (item.id === 'print_15x20' && qty >= 50) return 45;
    // 20x30: 30+ -> 95rub, Base -> 100rub
    if (item.id === 'print_20x30' && qty >= 30) return 95;
    // -------------------------------------------------

    if (variantId) {
       const variantsList = item.variants || PHOTO_VARIANTS;
       const v = variantsList.find(v => v.id === variantId);
       if (v?.price !== undefined) return v.price;
    }

    if (item.isPriceEditable && customPrices[item.id]) return customPrices[item.id];

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

  const handlePriceChange = (id: string, price: number) => {
    setCustomPrices(prev => ({ ...prev, [id]: price }));
  };

  const handleClearCart = () => {
    setQuantities({});
    setCustomPrices({});
    setIsReceiptOpen(false);
    showToast('Корзина очищена', 'info');
  };

  const handleClearHistory = () => {
    setOrderHistory([]); // Эффект useEffect сам очистит localStorage
    showToast('История заказов удалена', 'error');
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrderHistory(prev => prev.filter(o => o.id !== orderId));
    showToast('Заказ удален из истории', 'info');
  };

  const handleDeleteOrders = (orderIds: string[]) => {
    setOrderHistory(prev => prev.filter(o => !orderIds.includes(o.id)));
    showToast(`Удалено заказов: ${orderIds.length}`, 'info');
  };

  const handleToggleOrderFlag = (orderId: string, flag: 'isPrinted' | 'isRecorded') => {
    setOrderHistory(prev => prev.map(o => 
      o.id === orderId ? { ...o, [flag]: !o[flag] } : o
    ));
  };

  const handleImportHistory = (importedOrders: Order[]) => {
    setOrderHistory(prev => {
      const existingIds = new Set(prev.map(o => o.id));
      const newOrders = importedOrders.filter(o => !existingIds.has(o.id));
      const merged = [...newOrders, ...prev];
      return merged.sort((a, b) => b.timestamp - a.timestamp);
    });
    showToast(`Импортировано ${importedOrders.length} заказов`);
  };

  const handleUpdateNextReceiptNum = (val: string) => {
    const num = parseInt(val) || 1;
    setNextReceiptNumber(num);
  };

  const updateOrderInHistory = (updatedOrder: Order) => {
    setOrderHistory(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setActiveDigitalOrder(updatedOrder);
    showToast('Квитанция обновлена');
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return SERVICE_CATEGORIES;
    const query = searchQuery.toLowerCase();
    return SERVICE_CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.filter(item => item.name.toLowerCase().includes(query))
    })).filter(cat => cat.items.length > 0);
  }, [searchQuery]);

  const totalPrice = useMemo(() => {
    return Object.entries(quantities).reduce((total, [key, value]) => {
      const qty = value as number;
      const [itemId, variantId] = key.split('__');
      const item = allItems.find(i => i.id === itemId);
      if (!item) return total;
      const price = getActualPrice(item, qty, variantId);
      return total + (qty * price);
    }, 0);
  }, [allItems, quantities, customPrices]);

  const totalItemsCount = (Object.values(quantities) as number[]).reduce((a, b) => a + b, 0);

  const handleSaveOrder = (paymentMethod: PaymentMethod) => {
    const orderItems: Order['items'] = [];
    let hasDigitalItems = false;
    
    // Формируем единый список всех товаров в заказе
    Object.entries(quantities).forEach(([key, value]) => {
       const qty = value as number;
       const [itemId, variantId] = key.split('__');
       const item = allItems.find(i => i.id === itemId);
       if(item) {
          const variantsList = item.variants || PHOTO_VARIANTS;
          const variant = variantId ? variantsList.find(v => v.id === variantId) : undefined;
          const price = getActualPrice(item, qty, variantId);
          
          // Проверяем, является ли эта позиция цифровой услугой
          if (DIGITAL_CATEGORY_IDS.includes(item.categoryId || '')) {
            hasDigitalItems = true;
          }

          const itemData = {
             name: item.name,
             variant: variant?.label,
             price: price,
             quantity: qty,
             total: qty * price,
             categoryId: item.categoryId
          };
          orderItems.push(itemData);
       }
    });

    const currentReceiptNum = nextReceiptNumber.toString().padStart(6, '0');
    const newOrder: Order = {
       id: Date.now().toString(),
       // Если есть хоть одна цифровая услуга, генерируем номер квитанции
       receiptNumber: hasDigitalItems ? currentReceiptNum : undefined,
       date: new Date().toISOString(),
       issueDate: new Date().toISOString(),
       timestamp: Date.now(),
       items: orderItems,
       totalAmount: totalPrice,
       paymentMethod,
       isPrinted: false, // Default state
       isRecorded: false // Default state
    };

    setOrderHistory(prev => [newOrder, ...prev]);

    if (hasDigitalItems) {
      setNextReceiptNumber(prev => prev + 1);
      // Передаем ВЕСЬ заказ в модальное окно квитанции
      setActiveDigitalOrder(newOrder); 
    } else {
      showToast('Заказ успешно сохранен');
    }
    
    setQuantities({});
    setCustomPrices({});
  };

  const scrollToCategory = (id: string) => {
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 dark:bg-slate-900 bg-slate-50`}>
      <Toast toasts={toasts} />
      
      {/* Header */}
      <header className="sticky top-0 z-40 dark:bg-slate-800/90 bg-white/90 backdrop-blur-md border-b dark:border-slate-700 border-slate-200 shadow-sm transition-colors">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div 
              className="flex items-center space-x-3 cursor-pointer group hover:opacity-80 transition-opacity"
              onClick={() => setIsMenuOpen(true)}
              title="Открыть меню навигации"
            >
              <div className="relative">
                <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/20 z-10 relative">
                  <span className="font-black text-xl tracking-tighter">П</span>
                </div>
                <div className="absolute -right-2 -bottom-2 bg-slate-900 text-white p-1 rounded-full border-2 border-white dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity transform scale-75">
                  <Menu size={12} />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-black uppercase tracking-tighter leading-none dark:text-white text-slate-800 group-hover:text-blue-600 transition-colors">Престиж</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Professional Studio</p>
              </div>
            </div>
            
            <div className="flex-grow max-w-md relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
               <input 
                 type="text"
                 placeholder="Найти услугу..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full py-2.5 pl-10 pr-4 rounded-xl border dark:bg-slate-700 dark:border-slate-600 dark:text-white border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm font-medium"
               />
            </div>

            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="p-2.5 rounded-xl dark:bg-slate-700 dark:text-yellow-400 bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                title="Переключить тему"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={() => setIsInboxOpen(true)} 
                className="p-2.5 rounded-xl dark:bg-slate-700 dark:text-blue-400 bg-slate-100 text-blue-600 hover:bg-slate-200 transition-all"
                title="Прием файлов от клиента"
              >
                <CloudUpload size={20} />
              </button>
              <button 
                onClick={() => setIsCutterOpen(true)} 
                className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
                title="Резак"
              >
                <Crop size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-1">
             <button onClick={() => setIsEarningsOpen(true)} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight dark:text-slate-400 text-slate-500 hover:text-emerald-500 transition-colors"><TrendingUp size={16}/><span>Доходы</span></button>
             <button onClick={() => setIsNotebookOpen(true)} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight dark:text-slate-400 text-slate-500 hover:text-blue-500 transition-colors"><BookOpen size={16}/><span>Тетрадь</span></button>
             <button onClick={() => setIsTodoOpen(true)} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight dark:text-slate-400 text-slate-500 hover:text-violet-500 transition-colors"><ClipboardList size={16}/><span>Список дел</span></button>
             <button onClick={() => setIsHistoryOpen(true)} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight dark:text-slate-400 text-slate-500 hover:text-blue-500 transition-colors"><History size={16}/><span>История</span></button>
             <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight dark:text-slate-400 text-slate-500 hover:text-slate-900 transition-colors"><Settings size={16}/><span>Настройки</span></button>
          </div>
        </div>

        {isSettingsOpen && (
          <div className="border-t dark:border-slate-700 border-slate-200 py-3 px-4 dark:bg-slate-800 bg-slate-50">
            <div className="max-w-6xl mx-auto flex items-center space-x-4">
              <label className="text-[10px] font-black uppercase tracking-widest dark:text-slate-400 text-slate-500">Квитанция №:</label>
              <input 
                type="number" 
                value={nextReceiptNumber} 
                onChange={(e) => handleUpdateNextReceiptNum(e.target.value)} 
                className="w-24 rounded border dark:bg-slate-700 dark:border-slate-600 dark:text-blue-400 border-slate-200 bg-white px-2 py-1 text-sm font-bold text-blue-600 outline-none"
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 pb-32">
        
        {/* Workload Widget */}
        {!searchQuery && (
          <WorkloadWidget 
            clients={clients} 
            onAddClient={handleAddClient}
            onRemoveClient={handleRemoveClient}
            onAddMinutes={handleAddMinutes}
            onClearAll={handleClearQueue}
            isDarkMode={isDarkMode} 
          />
        )}

        {!searchQuery && (
          <PrintingSection 
            id="category-printing"
            category={PRINTING_CATEGORY} 
            quantities={quantities} 
            onQuantityChange={handleQuantityChange} 
            isDarkMode={isDarkMode}
            getPrice={getActualPrice}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map(category => (
            <ServiceCard 
              key={category.id}
              id={`category-${category.id}`}
              category={category} 
              quantities={quantities} 
              customPrices={customPrices} 
              onQuantityChange={handleQuantityChange} 
              onPriceChange={handlePriceChange}
              isDarkMode={isDarkMode}
            />
          ))}
          {filteredCategories.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-40 dark:text-white">
              <Search size={64} className="mx-auto mb-4" />
              <p className="text-xl font-bold">Ничего не найдено</p>
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t dark:bg-slate-800 dark:border-slate-700 bg-white border-slate-200 shadow-2xl z-40 p-4 safe-area-bottom transition-colors">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">К оплате</p>
            <p className="text-3xl font-black tracking-tighter dark:text-white text-slate-900 leading-none">{totalPrice} <span className="text-blue-600 font-bold">₽</span></p>
          </div>
          
          <button 
            onClick={() => setIsReceiptOpen(true)}
            className="flex items-center space-x-3 bg-blue-600 text-white py-4 px-10 rounded-2xl font-black shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all relative"
          >
            <ShoppingBag size={24} />
            <span className="uppercase tracking-tighter text-lg">Корзина</span>
            {totalItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-full border-4 dark:border-slate-800 border-white animate-bounce">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Drawer (Sidebar) */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMenuOpen(false)}
        />
        
        {/* Drawer */}
        <div className={`absolute top-0 left-0 h-full w-80 max-w-[85vw] shadow-2xl transform transition-transform duration-300 flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${isDarkMode ? 'bg-slate-900 border-r border-slate-700' : 'bg-white'}`}>
           <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 text-white p-2 rounded-xl">
                  <span className="font-black text-xl tracking-tighter">П</span>
                </div>
                <span className={`font-black uppercase tracking-tighter text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Навигация</span>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <X size={24} />
              </button>
           </div>
           
           <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
              <button
                onClick={() => scrollToCategory('category-printing')}
                className={`w-full p-4 rounded-xl flex items-center justify-between group transition-all ${isDarkMode ? 'bg-gradient-to-r from-blue-900/20 to-transparent hover:from-blue-900/40 text-blue-200' : 'bg-gradient-to-r from-blue-50 to-transparent hover:from-blue-100 text-blue-800'}`}
              >
                 <div className="flex items-center space-x-3">
                    <PRINTING_CATEGORY.icon size={20} />
                    <span className="font-bold">{PRINTING_CATEGORY.title}</span>
                 </div>
                 <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className={`h-px w-full my-4 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}></div>

              {SERVICE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(`category-${cat.id}`)}
                  className={`w-full p-3 rounded-xl flex items-center justify-between group transition-all ${isDarkMode ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'}`}
                >
                   <div className="flex items-center space-x-3">
                      <cat.icon size={20} className={isDarkMode ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-600'} />
                      <span className="font-bold text-sm">{cat.title}</span>
                   </div>
                   <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
           </div>

           <div className={`p-6 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <p className="text-center text-[10px] uppercase font-black tracking-widest text-slate-500">
                Prestige Calculator v2.1
              </p>
           </div>
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
          isDarkMode={isDarkMode}
          getPrice={getActualPrice}
        />
      )}
      {isNotebookOpen && (
        <NotebookModal
          orders={orderHistory}
          onClose={() => setIsNotebookOpen(false)}
          isDarkMode={isDarkMode}
        />
      )}
      {isTodoOpen && (
        <TodoListModal
          onClose={() => setIsTodoOpen(false)}
          isDarkMode={isDarkMode}
        />
      )}
      {isHistoryOpen && (
        <HistoryModal 
          orders={orderHistory} 
          onClose={() => setIsHistoryOpen(false)} 
          onClearHistory={handleClearHistory} 
          onDeleteOrder={handleDeleteOrder} 
          onDeleteOrders={handleDeleteOrders}
          onImportHistory={handleImportHistory}
          onViewDigitalReceipt={(order) => { setActiveDigitalOrder(order); setIsHistoryOpen(false); }} 
          isDarkMode={isDarkMode}
          onToggleFlag={handleToggleOrderFlag}
        />
      )}
      {isEarningsOpen && (
        <EarningsModal 
          orders={orderHistory} 
          onClose={() => setIsEarningsOpen(false)} 
          isDarkMode={isDarkMode} 
        />
      )}
      {isCutterOpen && (
        <PhotoCutter 
          onClose={() => setIsCutterOpen(false)} 
          isDarkMode={isDarkMode}
          onNotify={showToast}
        />
      )}
      {isInboxOpen && (
        <CloudInbox 
          onClose={() => setIsInboxOpen(false)} 
          isDarkMode={isDarkMode}
          onNotify={showToast}
        />
      )}
      {activeDigitalOrder && (
        <DigitalReceiptModal 
          order={activeDigitalOrder} 
          onClose={() => setActiveDigitalOrder(null)} 
          onUpdateOrder={updateOrderInHistory} 
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
