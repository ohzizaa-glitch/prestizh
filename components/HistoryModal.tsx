
import React, { useState } from 'react';
import { X, History, CreditCard, Banknote, Calendar, Receipt, Trash2 } from 'lucide-react';
import { Order } from '../types';

interface HistoryModalProps {
  orders: Order[];
  onClose: () => void;
  onClearHistory: () => void;
  onDeleteOrder: (orderId: string) => void;
  onViewDigitalReceipt: (order: Order) => void;
  isDarkMode: boolean;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ orders, onClose, onClearHistory, onDeleteOrder, onViewDigitalReceipt, isDarkMode }) => {
  const [filter, setFilter] = useState<'all' | 'digital' | 'cash' | 'card'>('all');

  const filteredOrders = orders.filter(order => {
    if (filter === 'digital') return order.receiptNumber !== undefined;
    if (filter === 'cash') return order.paymentMethod === 'cash';
    if (filter === 'card') return order.paymentMethod === 'card';
    return true;
  });

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

        {/* Tabs */}
        <div className={`px-5 py-2 border-b flex gap-1 overflow-x-auto no-scrollbar ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
           {[
             { id: 'all', label: 'Все' },
             { id: 'cash', label: 'Наличные' },
             { id: 'card', label: 'По карте' },
             { id: 'digital', label: 'Квитанции' }
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setFilter(tab.id as any)}
               className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
             >
               {tab.label}
             </button>
           ))}
        </div>

        {/* Content */}
        <div className={`overflow-y-auto p-5 space-y-4 flex-grow custom-scrollbar ${isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50/20'}`}>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History size={48} className="mx-auto mb-3 opacity-10" />
              <p className="font-black uppercase tracking-tighter">История пуста</p>
            </div>
          ) : (
            filteredOrders.sort((a, b) => b.timestamp - a.timestamp).map(order => (
              <div key={order.id} className={`border rounded-xl p-4 shadow-sm relative group transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-200 hover:shadow-md'}`}>
                <button 
                  onClick={() => confirm('Удалить заказ?') && onDeleteOrder(order.id)}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex justify-between items-start mb-3 border-b pb-2 dark:border-slate-700 border-slate-50 pr-8">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase">{new Date(order.date).toLocaleString('ru-RU')}</p>
                    <div className="flex gap-2">
                       {order.paymentMethod === 'card' ? (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                             <CreditCard size={10} /> Карта
                          </span>
                       ) : (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                             <Banknote size={10} /> Наличные
                          </span>
                       )}
                       {order.receiptNumber && <span className="text-[9px] font-black uppercase bg-red-100 text-red-600 px-2 py-0.5 rounded-full">№{order.receiptNumber}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-blue-600 tracking-tighter">{order.totalAmount} ₽</p>
                  </div>
                </div>

                <div className="space-y-1">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs font-medium">
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                        {item.name} {item.variant ? `(${item.variant})` : ''} 
                        <span className="ml-1 opacity-50">x {item.quantity}</span>
                      </span>
                      <span className="font-bold">{item.total} ₽</span>
                    </div>
                  ))}
                </div>

                {order.receiptNumber && (
                  <button onClick={() => onViewDigitalReceipt(order)} className="w-full mt-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2">
                    <Receipt size={12} /> Открыть бланк
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t flex justify-between items-center dark:border-slate-700">
           <button onClick={() => confirm('Очистить ВСЮ историю?') && onClearHistory()} className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline">Очистить всё</button>
           <button onClick={onClose} className="px-6 py-2 rounded-lg bg-blue-600 text-white font-black uppercase tracking-tighter text-sm">Закрыть</button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
