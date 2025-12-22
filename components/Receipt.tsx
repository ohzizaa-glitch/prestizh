import React, { useMemo } from 'react';
import { ServiceItem } from '../types';
import { X, Receipt as ReceiptIcon, Trash2 } from 'lucide-react';

interface ReceiptProps {
  items: ServiceItem[];
  quantities: Record<string, number>;
  onClose: () => void;
  onClear: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ items, quantities, onClose, onClear }) => {
  const activeItems = useMemo(() => {
    return items.filter(item => (quantities[item.id] || 0) > 0);
  }, [items, quantities]);

  const total = activeItems.reduce((acc, item) => acc + (item.price * quantities[item.id]), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-full text-orange-600">
              <ReceiptIcon size={20} />
            </div>
            <h2 className="font-bold text-xl text-slate-800">Итоговый чек</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={24} />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-5 space-y-4 flex-grow">
          {activeItems.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              Корзина пуста
            </div>
          ) : (
            <ul className="space-y-3">
              {activeItems.map(item => (
                <li key={item.id} className="flex justify-between items-start text-sm sm:text-base border-b border-dashed border-slate-200 pb-3 last:border-0">
                  <div className="pr-4">
                    <span className="font-medium text-slate-900 block">{item.name}</span>
                    <span className="text-slate-500 text-xs">
                      {quantities[item.id]} {item.unit} x {item.price} ₽
                      {item.isVariablePrice && ' (от)'}
                    </span>
                  </div>
                  <div className="font-bold text-slate-800 whitespace-nowrap">
                    {quantities[item.id] * item.price} ₽
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-600 font-medium">Общая сумма:</span>
            <span className="text-3xl font-bold text-blue-600">{total} ₽</span>
          </div>
          
          <div className="flex gap-3">
             <button 
              onClick={onClear}
              disabled={activeItems.length === 0}
              className="flex-1 py-3 px-4 rounded-xl border border-red-200 text-red-600 font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2"
            >
              <Trash2 size={18} />
              Очистить
            </button>
            <button 
              onClick={() => alert('Заказ оформлен! (Демо)')}
              disabled={activeItems.length === 0}
              className="flex-[2] bg-blue-600 text-white py-3 px-6 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              Оформить заказ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;