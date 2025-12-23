import React, { useState } from 'react';
import { X, History, CreditCard, Banknote, Calendar, Receipt } from 'lucide-react';
import { Order } from '../types';
import { DIGITAL_CATEGORY_IDS } from '../constants';

interface HistoryModalProps {
  orders: Order[];
  onClose: () => void;
  onClearHistory: () => void;
  onViewDigitalReceipt: (order: Order) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ orders, onClose, onClearHistory, onViewDigitalReceipt }) => {
  const [filter, setFilter] = useState<'all' | 'digital'>('all');

  const filteredOrders = orders.filter(order => {
    if (filter === 'digital') return order.receiptNumber !== undefined;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
              <History size={20} />
            </div>
            <h2 className="font-bold text-xl text-slate-800">История заказов</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={24} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-slate-100 flex gap-2">
           <button 
             onClick={() => setFilter('all')}
             className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Все заказы
           </button>
           <button 
             onClick={() => setFilter('digital')}
             className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'digital' ? 'bg-red-600 text-white shadow-md shadow-red-100' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Цифровые квитанции
           </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 space-y-4 bg-slate-50/50 flex-grow">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History size={48} className="mx-auto mb-3 opacity-20" />
              <p>Заказов не найдено</p>
            </div>
          ) : (
            filteredOrders.sort((a, b) => b.timestamp - a.timestamp).map(order => {
              const hasDigital = order.items.some(i => DIGITAL_CATEGORY_IDS.includes(i.categoryId || ''));
              
              return (
                <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-50">
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
                       <div className="text-xl font-bold text-blue-600">{order.totalAmount} ₽</div>
                       {order.receiptNumber && (
                          <div className="text-[10px] font-bold text-red-600 mt-1">Квитанция №{order.receiptNumber}</div>
                       )}
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                      {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                              <span className="text-slate-700">
                                  {item.name} 
                                  {item.variant && <span className="text-slate-400 ml-1 text-xs">({item.variant})</span>}
                                  <span className="text-slate-400 mx-1">×</span> 
                                  <span className="font-medium">{item.quantity}</span>
                              </span>
                              <span className="text-slate-500 tabular-nums">{item.total} ₽</span>
                          </div>
                      ))}
                  </div>

                  {order.receiptNumber && (
                    <button 
                      onClick={() => onViewDigitalReceipt(order)}
                      className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-colors border border-transparent hover:border-red-100"
                    >
                      <Receipt size={14} />
                      <span>Посмотреть квитанцию</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 rounded-b-2xl flex justify-end">
             {orders.length > 0 && (
                 <button 
                    onClick={() => {
                        if(confirm('Вы уверены, что хотите очистить всю историю?')) onClearHistory();
                    }}
                    className="text-red-500 text-sm font-medium hover:text-red-700 transition-colors px-4 py-2"
                 >
                    Очистить историю
                 </button>
             )}
             <button 
                onClick={onClose}
                className="bg-slate-100 text-slate-700 px-5 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors ml-2"
             >
                Закрыть
             </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;