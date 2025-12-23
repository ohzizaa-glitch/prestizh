
import React, { useMemo, useState } from 'react';
import { ServiceItem, PaymentMethod, ServiceVariant } from '../types';
import { PHOTO_VARIANTS } from '../constants';
import { X, Receipt as ReceiptIcon, Trash2, CreditCard, Banknote, Calculator } from 'lucide-react';

interface ReceiptProps {
  items: ServiceItem[];
  quantities: Record<string, number>;
  customPrices: Record<string, number>;
  onClose: () => void;
  onClear: () => void;
  onSaveOrder: (paymentMethod: PaymentMethod) => void;
  isDarkMode: boolean;
}

const Receipt: React.FC<ReceiptProps> = ({ items, quantities, customPrices, onClose, onClear, onSaveOrder, isDarkMode }) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [receivedAmount, setReceivedAmount] = useState<string>('');

  const getActualPrice = (item: ServiceItem, qty: number, variantId?: string) => {
    // Скидки на печать
    if (item.id === 'print_10x15' && qty >= 100) return 19;
    if (item.id === 'print_15x20' && qty >= 50) return 35;
    if (item.id === 'print_20x30' && qty >= 30) return 75;

    // Цена варианта
    if (variantId) {
       const variantsList = item.variants || PHOTO_VARIANTS;
       const v = variantsList.find(v => v.id === variantId);
       if (v?.price !== undefined) return v.price;
    }

    // Ручная цена
    if (item.isPriceEditable && customPrices[item.id]) return customPrices[item.id];

    return item.price;
  };

  const cartItems = useMemo(() => {
    const results: Array<{
        originalItem: ServiceItem;
        variant?: ServiceVariant;
        quantity: number;
        price: number;
        subtotal: number;
        key: string;
    }> = [];

    Object.entries(quantities).forEach(([key, value]) => {
      const qty = value as number;
      if (qty <= 0) return;

      const [itemId, variantId] = key.split('__');
      const item = items.find(i => i.id === itemId);

      if (item) {
        const variantsList = item.variants || PHOTO_VARIANTS;
        const variant = variantId ? variantsList.find(v => v.id === variantId) : undefined;
        const actualPrice = getActualPrice(item, qty, variantId);
        
        results.push({
            originalItem: item,
            variant,
            quantity: qty,
            price: actualPrice,
            subtotal: qty * actualPrice,
            key
        });
      }
    });

    return results;
  }, [items, quantities, customPrices]);

  const total = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  
  const changeAmount = useMemo(() => {
    const received = parseFloat(receivedAmount);
    if (isNaN(received) || received < total) return 0;
    return received - total;
  }, [receivedAmount, total]);

  const handlePay = () => {
    onSaveOrder(paymentMethod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
        
        <div className={`p-5 border-b flex justify-between items-center rounded-t-2xl ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
              <ReceiptIcon size={20} />
            </div>
            <h2 className={`font-black uppercase tracking-tighter text-xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Итоговый чек</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4 flex-grow custom-scrollbar">
          {cartItems.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-tighter">
              Корзина пуста
            </div>
          ) : (
            <ul className="space-y-3">
              {cartItems.map(entry => (
                <li key={entry.key} className={`flex justify-between items-start text-sm sm:text-base border-b border-dashed pb-3 last:border-0 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <div className="pr-4">
                    <span className={`font-bold block tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                        {entry.originalItem.name}
                    </span>
                    {entry.variant && (
                        <span className="text-blue-500 text-[10px] block font-black uppercase tracking-widest mt-0.5">
                            {entry.variant.label}
                        </span>
                    )}
                    <span className="text-slate-500 text-[11px] block mt-0.5 font-bold uppercase">
                      {entry.quantity} {entry.originalItem.unit} × {entry.price} ₽
                    </span>
                  </div>
                  <div className={`font-black whitespace-nowrap tracking-tighter text-lg ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    {entry.subtotal} ₽
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cartItems.length > 0 && (
            <div className={`px-5 py-4 border-t space-y-4 ${isDarkMode ? 'bg-slate-900/30 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <div>
                  <p className="text-[10px] text-slate-400 mb-2 font-black uppercase tracking-widest">Способ оплаты</p>
                  <div className={`flex p-1 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <button 
                          onClick={() => setPaymentMethod('cash')}
                          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-black uppercase tracking-tighter transition-all ${
                              paymentMethod === 'cash' 
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                      >
                          <Banknote size={16} />
                          <span>Наличные</span>
                      </button>
                      <button 
                          onClick={() => setPaymentMethod('card')}
                          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-black uppercase tracking-tighter transition-all ${
                              paymentMethod === 'card' 
                              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                      >
                          <CreditCard size={16} />
                          <span>Картой</span>
                      </button>
                  </div>
                </div>

                {paymentMethod === 'cash' && (
                  <div className="animate-in slide-in-from-bottom-2 duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center">
                          <Calculator size={10} className="mr-1" /> Получено
                        </label>
                        <div className="relative">
                          <input 
                            type="number"
                            value={receivedAmount}
                            onChange={(e) => setReceivedAmount(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            className={`w-full border-2 rounded-xl px-4 py-3 text-xl font-black outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10' : 'bg-white border-emerald-50 text-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'}`}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₽</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Сдача</label>
                        <div className={`w-full h-[56px] flex items-center px-4 rounded-xl border-2 font-black text-2xl tracking-tighter transition-all ${
                          changeAmount > 0 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-inner' 
                          : 'bg-slate-100/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'
                        }`}>
                          {changeAmount} ₽
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
        )}

        <div className={`p-5 border-t rounded-b-2xl transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Итого к оплате:</span>
            <span className="text-4xl font-black text-blue-600 tracking-tighter">{total} ₽</span>
          </div>
          
          <div className="flex gap-3">
             <button 
              onClick={onClear}
              disabled={cartItems.length === 0}
              className={`p-4 rounded-2xl border-2 transition-all ${isDarkMode ? 'border-slate-700 text-slate-600 hover:text-red-500 hover:border-red-900/50 hover:bg-red-900/10' : 'border-slate-100 text-slate-300 hover:text-red-500 hover:border-red-100 hover:bg-red-50'} disabled:opacity-30 disabled:hover:border-transparent`}
              title="Очистить корзину"
            >
              <Trash2 size={24} />
            </button>
            <button 
              onClick={handlePay}
              disabled={cartItems.length === 0 || (paymentMethod === 'cash' && receivedAmount !== '' && parseFloat(receivedAmount) < total)}
              className={`flex-grow text-white py-4 px-6 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 uppercase tracking-tighter text-lg
                 ${paymentMethod === 'cash' 
                    ? 'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-700' 
                    : 'bg-purple-600 shadow-purple-500/20 hover:bg-purple-700'
                 } disabled:opacity-50 disabled:shadow-none disabled:grayscale disabled:cursor-not-allowed`}
            >
              {paymentMethod === 'cash' ? 'Принять наличные' : 'Оплачено картой'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
