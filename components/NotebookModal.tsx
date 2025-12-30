
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { X, BookOpen, Printer, Calendar, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Order } from '../types';

interface NotebookModalProps {
  orders: Order[];
  onClose: () => void;
  isDarkMode: boolean;
}

const NotebookModal: React.FC<NotebookModalProps> = ({ orders, onClose, isDarkMode }) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

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

  // Генерация списка дней (аналогично HistoryModal)
  const availableDays = useMemo(() => {
    const daysMap = new Map();
    const today = new Date();
    
    // Сначала добавляем дни, за которые есть заказы
    orders.forEach(order => {
        const d = new Date(order.timestamp);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        if (!daysMap.has(dateStr)) {
            daysMap.set(dateStr, d);
        }
    });

    // Добавляем текущий день, если его нет (чтобы список не был пустым при отсутствии заказов)
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (!daysMap.has(todayStr)) {
        daysMap.set(todayStr, today);
    }

    // Преобразуем в массив и сортируем (новые сверху)
    return Array.from(daysMap.entries())
        .map(([value, date]) => ({
            value,
            label: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' }),
            fullLabel: date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' }),
            timestamp: date.getTime(),
            isToday: value === todayStr
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
  }, [orders]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return 'За всё время';
    const day = availableDays.find(d => d.value === selectedDate);
    return day ? day.fullLabel : selectedDate;
  }, [selectedDate, availableDays]);

  // Группировка и подготовка данных для таблицы с учетом фильтра
  const rows = useMemo(() => {
    let filteredOrders = [...orders];

    // Фильтрация по дате
    if (selectedDate) {
        filteredOrders = filteredOrders.filter(o => {
            const d = new Date(o.timestamp);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}` === selectedDate;
        });
    }

    // Сортируем: сначала старые, новые снизу (хронологический порядок для тетради)
    filteredOrders.sort((a, b) => a.timestamp - b.timestamp);

    return filteredOrders.map(order => {
      const dateObj = new Date(order.timestamp);
      const dateStr = dateObj.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      
      // Подсчет количества фото определенных форматов
      let qty1015 = 0;
      let qty1520 = 0;
      let qty2030 = 0;
      const otherItems: string[] = [];

      order.items.forEach(item => {
        if (item.categoryId === 'printing') {
            if (item.name.includes('10 x 15')) qty1015 += item.quantity;
            else if (item.name.includes('15 x 20')) qty1520 += item.quantity;
            else if (item.name.includes('20 x 30')) qty2030 += item.quantity;
            else {
                // Если какой-то нестандартный формат печати
                otherItems.push(`${item.name} (${item.quantity})`);
            }
        } else {
            // Все остальные товары и услуги
            const variantStr = item.variant ? ` ${item.variant}` : '';
            otherItems.push(`${item.name}${variantStr} (${item.quantity})`);
        }
      });

      const goodsDescription = otherItems.join(', ');

      return {
        id: order.id,
        date: dateStr,
        qty1015: qty1015 > 0 ? qty1015 : '',
        qty1520: qty1520 > 0 ? qty1520 : '',
        qty2030: qty2030 > 0 ? qty2030 : '',
        receiptNumber: order.receiptNumber || '',
        goods: goodsDescription,
        cash: order.paymentMethod === 'cash' ? order.totalAmount : '',
        card: order.paymentMethod === 'card' ? order.totalAmount : '',
        fullDate: dateObj.toLocaleDateString('ru-RU') // Для группировки если нужно, или тултипа
      };
    });
  }, [orders, selectedDate]);

  const handlePrint = () => {
    // Простая печать содержимого модального окна
    const content = tableRef.current;
    if (!content) return;
    
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Журнал учета</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: sans-serif; padding: 20px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid black; padding: 4px 8px; text-align: center; }
      th { background-color: #f0f0f0; }
      .text-left { text-align: left; }
      .font-bold { font-weight: bold; }
      h2 { text-align: center; margin-bottom: 5px; }
      .meta { text-align: center; margin-bottom: 20px; font-size: 12px; color: #555; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(`<h2>Журнал учета (Престиж)</h2>`);
    printWindow.document.write(`<div class="meta">Период: ${selectedDateLabel}</div>`);
    printWindow.document.write(content.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col h-[90vh] transition-colors ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex flex-col md:flex-row gap-4 justify-between items-center rounded-t-2xl flex-shrink-0 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <BookOpen size={20} />
            </div>
            <h2 className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Журнал учета</h2>
          </div>

          {/* Date Filter Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all ${isDarkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
            >
                <Calendar size={16} className={isDarkMode ? 'text-slate-400' : 'text-slate-500'} />
                <span className="font-bold text-sm capitalize min-w-[120px] text-left">{selectedDateLabel}</span>
                {isDateDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isDateDropdownOpen && (
                <div className={`absolute top-full left-0 md:left-auto md:right-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-xl shadow-xl border custom-scrollbar z-50 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-100'}`}>
                    <button
                        onClick={() => { setSelectedDate(''); setIsDateDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors border-b ${
                        selectedDate === '' 
                            ? (isDarkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600') 
                            : (isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50')
                        } ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}
                    >
                        <span className="font-bold text-sm">За всё время</span>
                        {selectedDate === '' && <Check size={16} />}
                    </button>
                    {availableDays.map(day => (
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

          <div className="flex items-center space-x-2">
            <button 
                onClick={handlePrint}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}
                title="Печать таблицы"
            >
                <Printer size={20} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                <X size={24} />
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className={`flex-grow overflow-auto p-0 ${isDarkMode ? 'bg-slate-900/30' : 'bg-white'}`}>
          <div ref={tableRef} className="min-w-[800px]">
            <table className={`w-full text-sm border-collapse ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>
              <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                <tr>
                  <th className={`border p-3 w-24 font-black uppercase text-[10px] tracking-wider ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}>Дата</th>
                  <th className={`border p-3 w-16 font-black uppercase text-[10px] tracking-wider ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}>10x15</th>
                  <th className={`border p-3 w-16 font-black uppercase text-[10px] tracking-wider ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}>15x20</th>
                  <th className={`border p-3 w-16 font-black uppercase text-[10px] tracking-wider ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}>20x30</th>
                  <th className={`border p-3 w-28 font-black uppercase text-[10px] tracking-wider ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}>№ Квит.</th>
                  <th className={`border p-3 font-black uppercase text-[10px] tracking-wider ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}>Товар / Услуга</th>
                  <th className={`border p-3 w-24 font-black uppercase text-[10px] tracking-wider ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}>Наличка</th>
                  <th className={`border p-3 w-24 font-black uppercase text-[10px] tracking-wider ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}>Безнал</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                    <tr>
                        <td colSpan={8} className={`border p-8 text-center opacity-50 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                            {selectedDate ? 'Нет записей за выбранную дату' : 'Нет записей'}
                        </td>
                    </tr>
                ) : (
                    rows.map((row) => (
                    <tr key={row.id} className={`group transition-colors ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                        <td className={`border p-2 text-center font-medium ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                        {row.date}
                        </td>
                        <td className={`border p-2 text-center font-bold ${isDarkMode ? 'border-slate-700 text-blue-400' : 'border-slate-200 text-blue-600'}`}>
                        {row.qty1015}
                        </td>
                        <td className={`border p-2 text-center font-bold ${isDarkMode ? 'border-slate-700 text-blue-400' : 'border-slate-200 text-blue-600'}`}>
                        {row.qty1520}
                        </td>
                        <td className={`border p-2 text-center font-bold ${isDarkMode ? 'border-slate-700 text-blue-400' : 'border-slate-200 text-blue-600'}`}>
                        {row.qty2030}
                        </td>
                        <td className={`border p-2 text-center font-bold text-red-500 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                        {row.receiptNumber}
                        </td>
                        <td className={`border p-2 text-left truncate max-w-xs ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`} title={row.goods}>
                        {row.goods}
                        </td>
                        <td className={`border p-2 text-center font-bold ${isDarkMode ? 'border-slate-700 text-emerald-400' : 'border-slate-200 text-emerald-600'}`}>
                        {row.cash}
                        </td>
                        <td className={`border p-2 text-center font-bold ${isDarkMode ? 'border-slate-700 text-purple-400' : 'border-slate-200 text-purple-600'}`}>
                        {row.card}
                        </td>
                    </tr>
                    ))
                )}
                {/* Итоговая строка при фильтрации по дню */}
                {selectedDate && rows.length > 0 && (
                   <tr className={`${isDarkMode ? 'bg-slate-800 font-bold' : 'bg-slate-50 font-bold'}`}>
                      <td colSpan={6} className={`border p-2 text-right uppercase text-xs tracking-wider ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                        Итого за {selectedDateLabel}:
                      </td>
                      <td className={`border p-2 text-center text-emerald-600 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                         {rows.reduce((sum, r) => sum + (Number(r.cash) || 0), 0)}
                      </td>
                      <td className={`border p-2 text-center text-purple-600 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                         {rows.reduce((sum, r) => sum + (Number(r.card) || 0), 0)}
                      </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotebookModal;
