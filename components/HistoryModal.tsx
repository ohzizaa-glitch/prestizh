
import React, { useRef } from 'react';
import { X, History, CreditCard, Banknote, Calendar, Receipt, Trash2, Download, Upload, Share2 } from 'lucide-react';
import { Order } from '../types';

interface HistoryModalProps {
  orders: Order[];
  onClose: () => void;
  onClearHistory: () => void;
  onDeleteOrder: (orderId: string) => void;
  onImportHistory: (orders: Order[]) => void;
  onViewDigitalReceipt: (order: Order) => void;
  isDarkMode: boolean;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ 
  orders, 
  onClose, 
  onClearHistory, 
  onDeleteOrder, 
  onImportHistory,
  onViewDigitalReceipt, 
  isDarkMode 
}) => {
  const [filter, setFilter] = React.useState<'all' | 'digital'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredOrders = orders.filter(order => {
    if (filter === 'digital') return order.receiptNumber !== undefined;
    return true;
  });

  // Функция для скачивания истории (Резервная копия)
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

  // Функция для импорта (Восстановление)
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
    // Сброс value, чтобы можно было загрузить тот же файл снова при необходимости
    e.target.value = '';
  };

  // Функция для шаринга отчета (Текстовый вид)
  const handleShare = async () => {
    const today = new Date().toLocaleDateString('ru-RU');
    const todayOrders = orders.filter(o => new Date(o.timestamp).toLocaleDateString('ru-RU') === today);
    
    const total = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const cash = todayOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.totalAmount, 0);
    const card = todayOrders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.totalAmount, 0);
    const count = todayOrders.length;

    const text = `📊 Отчет Престиж за ${today}:\n\n` +
                 `💰 Всего: ${total} ₽\n` +
                 `💵 Наличные: ${cash} ₽\n` +
                 `💳 Карта: ${card} ₽\n` +
                 `📝 Заказов: ${count} шт.\n\n` +
                 `Сгенерировано в приложении.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Отчет Престиж ${today}`,
          text: text,
        });
      } catch (err) {
        // Если отмена или ошибка шаринга, просто копируем в буфер
        navigator.clipboard.writeText(text);
        alert('Отчет скопирован в буфер обмена');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Отчет скопирован в буфер обмена');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] transition-colors ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex justify-between items-center rounded-t-2xl ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
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

        {/* Tools & Filters */}
        <div className={`px-5 py-3 border-b flex flex-wrap gap-2 items-center justify-between ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
           <div className="flex gap-2">
             <button 
               onClick={() => setFilter('all')}
               className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
             >
               Все заказы
             </button>
             <button 
               onClick={() => setFilter('digital')}
               className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'digital' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
             >
               Цифровые квитанции
             </button>
           </div>

           <div className="flex gap-2">
              <button 
                onClick={handleShare}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-700 text-emerald-400 hover:bg-slate-600' : 'bg-slate-100 text-emerald-600 hover:bg-slate-200'}`}
                title="Поделиться отчетом за сегодня"
              >
                <Share2 size={16} />
              </button>
              <div className={`w-px h-8 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
              <button 
                onClick={handleImportClick}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-700 text-blue-400 hover:bg-slate-600' : 'bg-slate-100 text-blue-600 hover:bg-slate-200'}`}
                title="Загрузить историю из файла"
              >
                <Upload size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileChange} 
              />
              <button 
                onClick={handleExport}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-700 text-orange-400 hover:bg-slate-600' : 'bg-slate-100 text-orange-600 hover:bg-slate-200'}`}
                title="Скачать историю (Резервная копия)"
              >
                <Download size={16} />
              </button>
           </div>
        </div>

        {/* Content */}
        <div className={`overflow-y-auto p-5 space-y-4 flex-grow ${isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50/50'}`}>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold uppercase tracking-tighter">Заказов не найдено</p>
            </div>
          ) : (
            filteredOrders.sort((a, b) => b.timestamp - a.timestamp).map(order => {
              return (
                <div key={order.id} className={`border rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative group ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  {/* Delete Individual Order Button */}
                  <button 
                    onClick={() => {
                      if(confirm('Удалить этот заказ из истории?')) onDeleteOrder(order.id);
                    }}
                    className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors lg:opacity-0 lg:group-hover:opacity-100"
                    title="Удалить заказ"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className={`flex justify-between items-start mb-3 pb-3 border-b pr-8 ${isDarkMode ? 'border-slate-700' : 'border-slate-50'}`}>
                    <div>
                      <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
                          <Calendar size={12} />
                          <span>{new Date(order.date).toLocaleString('ru-RU')}</span>
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
                       <div className="text-xl font-bold text-blue-600 tracking-tighter">{order.totalAmount} ₽</div>
                       {order.receiptNumber && (
                          <div className="text-[10px] font-black text-red-600 mt-1 uppercase tracking-widest">Квитанция №{order.receiptNumber}</div>
                       )}
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
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

                  {order.receiptNumber && (
                    <button 
                      onClick={() => onViewDigitalReceipt(order)}
                      className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all border ${isDarkMode ? 'bg-slate-700 text-slate-300 border-transparent hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/50' : 'bg-slate-100 text-slate-600 border-transparent hover:bg-red-50 hover:text-red-600 hover:border-red-100'}`}
                    >
                      <Receipt size={14} />
                      <span className="uppercase tracking-tighter">Посмотреть квитанцию</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t rounded-b-2xl flex justify-end items-center ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
             {orders.length > 0 && (
                 <button 
                    onClick={() => {
                        if(confirm('Вы уверены, что хотите очистить ВСЮ историю?')) onClearHistory();
                    }}
                    className="text-red-500 text-xs font-black uppercase tracking-widest hover:text-red-700 transition-colors px-4 py-2"
                 >
                    Очистить всё
                 </button>
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
