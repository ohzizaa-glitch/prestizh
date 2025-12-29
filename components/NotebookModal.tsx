
import React, { useMemo, useRef } from 'react';
import { X, BookOpen, Printer } from 'lucide-react';
import { Order } from '../types';

interface NotebookModalProps {
  orders: Order[];
  onClose: () => void;
  isDarkMode: boolean;
}

const NotebookModal: React.FC<NotebookModalProps> = ({ orders, onClose, isDarkMode }) => {
  const tableRef = useRef<HTMLDivElement>(null);

  // Группировка и подготовка данных для таблицы
  const rows = useMemo(() => {
    // Сортируем: сначала старые, новые снизу
    const sortedOrders = [...orders].sort((a, b) => a.timestamp - b.timestamp);

    return sortedOrders.map(order => {
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
  }, [orders]);

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
      h2 { text-align: center; margin-bottom: 20px; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(`<h2>Журнал учета (Престиж)</h2>`);
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
        <div className={`p-5 border-b flex justify-between items-center rounded-t-2xl ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <BookOpen size={20} />
            </div>
            <h2 className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Журнал учета (Тетрадь)</h2>
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
                            Нет записей
                        </td>
                    </tr>
                ) : (
                    rows.map((row, index) => (
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotebookModal;
