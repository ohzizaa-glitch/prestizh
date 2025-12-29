
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { X, History, CreditCard, Banknote, Calendar, Receipt, Trash2, Download, Upload, Share2, Filter, ChevronDown, ChevronUp, Check, Printer, BookOpen, CheckCircle2, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { Order } from '../types';

interface HistoryModalProps {
  orders: Order[];
  onClose: () => void;
  onClearHistory: () => void;
  onDeleteOrder: (orderId: string) => void;
  onDeleteOrders?: (orderIds: string[]) => void;
  onImportHistory: (orders: Order[]) => void;
  onViewDigitalReceipt: (order: Order) => void;
  isDarkMode: boolean;
  onToggleFlag?: (orderId: string, flag: 'isPrinted' | 'isRecorded') => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ 
  orders, 
  onClose, 
  onClearHistory, 
  onDeleteOrder, 
  onDeleteOrders,
  onImportHistory,
  onViewDigitalReceipt, 
  isDarkMode,
  onToggleFlag
}) => {
  const [filter, setFilter] = React.useState<'all' | 'digital' | 'cash' | 'card'>('all');
  const [selectedDate, setSelectedDate] = React.useState<string>('');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  
  // States for confirmations
  const [confirmClear, setConfirmClear] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Закрытие дропдауна при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Сброс подтверждения полной очистки через 3 секунды
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (confirmClear) {
        timeout = setTimeout(() => setConfirmClear(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [confirmClear]);

  // Сброс подтверждения удаления одного элемента через 3 секунды
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (itemToDelete) {
        timeout = setTimeout(() => setItemToDelete(null), 3000);
    }
    return () => clearTimeout(timeout);
  }, [itemToDelete]);

  // Сброс выделения при выходе из режима
  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedOrderIds(new Set());
    }
  }, [isSelectionMode]);

  // Генерация списка дней
  const currentMonthDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = daysInMonth; i >= 1; i--) {
      const date = new Date(year, month, i);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const isToday = i === today.getDate();
      days.push({
        value: dateStr,
        label: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' }),
        fullLabel: date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' }),
        isToday
      });
    }
    return days;
  }, []);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return 'Вся история';
    const day = currentMonthDays.find(d => d.value === selectedDate);
    return day ? `${day.fullLabel} ${day.isToday ? '(Сегодня)' : ''}` : selectedDate;
  }, [selectedDate, currentMonthDays]);

  const filteredOrders = orders.filter(order => {
    let matchesType = true;
    if (filter === 'digital' && order.receiptNumber === undefined) matchesType = false;
    if (filter === 'cash' && order.paymentMethod !== 'cash') matchesType = false;
    if (filter === 'card' && order.paymentMethod !== 'card') matchesType = false;
    let matchesDate = true;
    if (selectedDate) {
      const d = new Date(order.timestamp);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const orderDateStr = `${year}-${month}-${day}`;
      if (orderDateStr !== selectedDate) matchesDate = false;
    }
    return matchesType && matchesDate;
  });

  const toggleOrderSelection = (id: string) => {
    const newSet = new Set(selectedOrderIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedOrderIds(newSet);
  };

  const handleBulkDelete = () => {
    if (selectedOrderIds.size === 0) return;
    // For bulk actions, window.confirm is still appropriate or we need a modal.
    // Keeping confirm for now as requested fix was mainly for "button not working"
    if (confirm(`Удалить выбранные заказы (${selectedOrderIds.size} шт)?`)) {
       if (onDeleteOrders) {
           onDeleteOrders(Array.from(selectedOrderIds));
       } else {
           selectedOrderIds.forEach(id => onDeleteOrder(id));
       }
       setIsSelectionMode(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  // ... export/import/share handlers same as before ...
  const handleExport = () => {
    const dataStr = JSON.stringify(orders, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prestige_history_${new Date().toLocaleDateString('ru-RU')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          if (confirm(`Найдено ${json.length} записей. Импортировать?`)) {
            onImportHistory(json);
          }
        } else {
          alert('Ошибка: Неверный формат файла');
        }
      } catch (err) {
        alert('Ошибка чтения файла');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleShare = async () => {
    const targetOrders = selectedDate ? filteredOrders : orders.filter(o => new Date(o.timestamp).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA'));
    const reportDate = selectedDate ? new Date(selectedDate).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU');
    
    const total = targetOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const cash = targetOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.totalAmount, 0);
    const card = targetOrders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.totalAmount, 0);
    const count = targetOrders.length;

    const text = `📊 Отчет Престиж за ${reportDate}:\n\n` +
                 `💰 Всего: ${total} ₽\n` +
                 `💵 Наличные: ${cash} ₽\n` +
                 `💳 Карта: ${card} ₽\n` +
                 `📝 Заказов: ${count} шт.\n\n` +
                 `Сгенерировано в приложении.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Отчет Престиж ${reportDate}`,
          text: text,
        });
      } catch (err) {
        navigator.clipboard.writeText(text);
        alert('Отчет скопирован в буфер обмена');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Отчет скопирован в буфер обмена');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] transition-colors ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex justify-between items-center rounded-t-2xl flex-shrink-0 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
              <History size={20} />
            </div>
            <h2 className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>История заказов</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
            <X size={24} />
          </button>
        </div>

        {/* Tools */}
        <div className={`px-5 py-3 border-b flex flex-col gap-3 flex-shrink-0 relative z-[20] ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
           
           <div className="flex items-center space-x-2 relative" ref={dropdownRef}>
             <div className="w-full sm:w-auto flex-grow relative">
                <button 
                  onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                  className={`w-full flex items-center justify-between p-2.5 pl-3 rounded-xl border transition-all ${isDarkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-white' : 'bg-slate-50 border-slate-200 hover:bg-white text-slate-700 hover:shadow-sm'}`}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className={isDarkMode ? 'text-slate-400' : 'text-slate-500'} />
                    <span className="font-bold text-sm capitalize">{selectedDateLabel}</span>
                  </div>
                  <div className="pl-2 border-l ml-2 border-slate-300 dark:border-slate-600">
                    {isDateDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {isDateDropdownOpen && (
                  <div className={`absolute top-full left-0 mt-2 w-full max-h-60 overflow-y-auto rounded-xl shadow-xl border custom-scrollbar animate-in fade-in zoom-in-95 duration-100 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-100'}`}>
                    <button
                      onClick={() => { setSelectedDate(''); setIsDateDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors border-b ${
                        selectedDate === '' 
                          ? (isDarkMode ? 'bg-indigo-900/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                          : (isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50')
                      } ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}
                    >
                      <span className="font-bold text-sm">Показать всю историю</span>
                      {selectedDate === '' && <Check size={16} />}
                    </button>
                    {currentMonthDays.map(day => (
                      <button
                        key={day.value}
                        onClick={() => { setSelectedDate(day.value); setIsDateDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${
                          selectedDate === day.value 
                            ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') 
                            : (isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50')
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-sm capitalize">{day.fullLabel}</span>
                          {day.isToday && <span className="text-[10px] font-black uppercase tracking-wider opacity-70">Сегодня</span>}
                        </div>
                        {selectedDate === day.value && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                )}
             </div>
           </div>

           <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
             <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
               <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Все</button>
               <button onClick={() => setFilter('digital')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filter === 'digital' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Цифровые</button>
               <button onClick={() => setFilter('cash')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filter === 'cash' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Наличные</button>
               <button onClick={() => setFilter('card')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filter === 'card' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Карта</button>
             </div>

             <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button 
                  onClick={() => setIsSelectionMode(!isSelectionMode)}
                  className={`p-2 rounded-lg transition-colors ${isSelectionMode ? 'bg-blue-600 text-white shadow-md' : (isDarkMode ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}
                  title="Режим выбора"
                >
                  <CheckSquare size={16} />
                </button>
                <div className={`w-px h-8 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                <button onClick={handleShare} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-700 text-emerald-400 hover:bg-slate-600' : 'bg-slate-100 text-emerald-600 hover:bg-slate-200'}`}><Share2 size={16} /></button>
                <button onClick={handleImportClick} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-700 text-blue-400 hover:bg-slate-600' : 'bg-slate-100 text-blue-600 hover:bg-slate-200'}`}><Upload size={16} /></button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                <button onClick={handleExport} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-700 text-orange-400 hover:bg-slate-600' : 'bg-slate-100 text-orange-600 hover:bg-slate-200'}`}><Download size={16} /></button>
             </div>
           </div>

           {isSelectionMode && (
             <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                    <button onClick={handleSelectAll} className="text-xs font-bold text-blue-600 hover:underline">
                        {selectedOrderIds.size === filteredOrders.length ? 'Снять выделение' : 'Выбрать все'}
                    </button>
                    <span className="text-xs text-slate-500">Выбрано: {selectedOrderIds.size}</span>
                </div>
                {selectedOrderIds.size > 0 && (
                  <button onClick={handleBulkDelete} className="text-xs font-bold text-red-500 hover:underline">
                      Удалить выбранные
                  </button>
                )}
             </div>
           )}
        </div>

        {/* Content */}
        <div className={`overflow-y-auto p-5 space-y-4 flex-grow relative z-0 ${isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50/50'}`}>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold uppercase tracking-tighter">Заказов не найдено</p>
              {selectedDate && <p className="text-xs mt-2">Попробуйте выбрать другую дату или "Вся история"</p>}
            </div>
          ) : (
            <>
              <div className={`p-3 mb-2 rounded-xl flex justify-between items-center text-xs font-bold uppercase tracking-wide border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                <span>Заказов: {filteredOrders.length}</span>
                <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>
                  Сумма: {filteredOrders.reduce((acc, o) => acc + o.totalAmount, 0)} ₽
                </span>
              </div>

              {filteredOrders.sort((a, b) => b.timestamp - a.timestamp).map(order => {
                const isSelected = selectedOrderIds.has(order.id);
                const isConfirmingDelete = itemToDelete === order.id;

                return (
                  <div 
                    key={order.id} 
                    onClick={() => isSelectionMode && toggleOrderSelection(order.id)}
                    className={`border rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative group 
                      ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
                      ${isSelectionMode ? 'cursor-pointer' : ''}
                      ${isSelected ? (isDarkMode ? 'ring-2 ring-blue-500 bg-blue-900/10' : 'ring-2 ring-blue-500 bg-blue-50') : ''}
                      ${isConfirmingDelete ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                    `}
                  >
                    {isSelectionMode && (
                        <div className="absolute top-4 left-4 z-10">
                            {isSelected ? <CheckSquare className="text-blue-500" /> : <Square className="text-slate-400" />}
                        </div>
                    )}

                    {!isSelectionMode && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isConfirmingDelete) {
                                    onDeleteOrder(order.id);
                                    setItemToDelete(null);
                                } else {
                                    setItemToDelete(order.id);
                                }
                            }}
                            className={`absolute top-4 right-4 p-2 transition-all rounded-lg z-10 flex items-center gap-2 ${
                                isConfirmingDelete 
                                ? 'bg-red-500 text-white shadow-md hover:bg-red-600' 
                                : 'text-slate-300 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                            title={isConfirmingDelete ? "Нажмите еще раз для удаления" : "Удалить заказ"}
                        >
                            <Trash2 size={16} className={isConfirmingDelete ? "animate-pulse" : ""} />
                            {isConfirmingDelete && <span className="text-xs font-bold">Удалить?</span>}
                        </button>
                    )}

                    <div className={`flex justify-between items-start mb-3 pb-3 border-b pr-8 ${isDarkMode ? 'border-slate-700' : 'border-slate-50'} ${isSelectionMode ? 'pl-8' : ''}`}>
                      <div>
                        <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
                            <Calendar size={12} />
                            <span>{new Date(order.timestamp).toLocaleString('ru-RU')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            {order.paymentMethod === 'card' ? (
                                <span className="flex items-center space-x-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                    <CreditCard size={12} /> <span>Карта</span>
                                </span>
                            ) : (
                                <span className="flex items-center space-x-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                    <Banknote size={12} /> <span>Наличные</span>
                                </span>
                            )}
                            <span className="text-xs text-slate-400">ID: {order.id.slice(-6)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className={`text-xl font-bold tracking-tighter ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{order.totalAmount} ₽</div>
                         {order.receiptNumber && (
                            <div className="text-[10px] font-black text-red-600 mt-1 uppercase tracking-widest">Квитанция №{order.receiptNumber}</div>
                         )}
                      </div>
                    </div>

                    <div className={`space-y-1 mb-4 ${isSelectionMode ? 'pl-8' : ''}`}>
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span className={`${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {item.name} 
                                    {item.variant && <span className="text-slate-400 ml-1 text-xs">({item.variant})</span>}
                                    <span className="text-slate-400 mx-1">×</span> 
                                    <span className="font-black">{item.quantity}</span>
                                </span>
                                <span className="text-slate-500 tabular-nums font-bold">{item.total} ₽</span>
                            </div>
                        ))}
                    </div>

                    <div className={`mt-4 pt-3 border-t grid grid-cols-2 gap-3 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'} ${isSelectionMode ? 'pl-8' : ''}`}>
                       <button
                         onClick={(e) => { e.stopPropagation(); onToggleFlag && onToggleFlag(order.id, 'isPrinted'); }}
                         className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all border ${
                           order.isPrinted 
                             ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20' 
                             : (isDarkMode ? 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-white')
                         }`}
                       >
                         {order.isPrinted ? <CheckCircle2 size={16} /> : <Printer size={16} />}
                         <span className="text-xs font-bold uppercase tracking-tight">Чек ККМ</span>
                       </button>

                       <button
                         onClick={(e) => { e.stopPropagation(); onToggleFlag && onToggleFlag(order.id, 'isRecorded'); }}
                         className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all border ${
                           order.isRecorded 
                             ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20' 
                             : (isDarkMode ? 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-white')
                         }`}
                       >
                         {order.isRecorded ? <CheckCircle2 size={16} /> : <BookOpen size={16} />}
                         <span className="text-xs font-bold uppercase tracking-tight">Тетрадь</span>
                       </button>
                    </div>

                    {order.receiptNumber && (
                      <div className={`mt-3 ${isSelectionMode ? 'pl-8' : ''}`}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onViewDigitalReceipt(order); }}
                            className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all border ${isDarkMode ? 'bg-slate-700 text-slate-300 border-transparent hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/50' : 'bg-slate-100 text-slate-600 border-transparent hover:bg-red-50 hover:text-red-600 hover:border-red-100'}`}
                        >
                            <Receipt size={14} />
                            <span className="uppercase tracking-tighter">Посмотреть квитанцию</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t rounded-b-2xl flex justify-end items-center relative z-[10] flex-shrink-0 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
             {!isSelectionMode && orders.length > 0 && (
                 <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirmClear) {
                        onClearHistory();
                        setConfirmClear(false);
                      } else {
                        setConfirmClear(true);
                      }
                    }}
                    className={`text-xs font-black uppercase tracking-widest transition-all px-4 py-2 cursor-pointer rounded-xl flex items-center gap-2 ${
                      confirmClear 
                        ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30 animate-in slide-in-from-right-2' 
                        : 'text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10'
                    }`}
                 >
                    {confirmClear && <AlertTriangle size={14} />}
                    {confirmClear ? 'Подтвердить удаление' : 'Очистить всё'}
                 </button>
             )}
             
             {isSelectionMode && (
                <div className="mr-auto text-xs font-bold text-slate-500">
                    Режим выбора
                </div>
             )}

             <button 
                onClick={onClose}
                className={`px-6 py-2 rounded-xl font-black uppercase tracking-tighter text-sm transition-colors ml-2 ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
             >
                Закрыть
             </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
