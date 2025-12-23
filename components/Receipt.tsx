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
}

const Receipt: React.FC<ReceiptProps> = ({ items, quantities, customPrices, onClose, onClear, onSaveOrder }) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [receivedAmount, setReceivedAmount] = useState<string>('');

  const getVariantInfo = (variantId: string): ServiceVariant | undefined => {
    return PHOTO_VARIANTS.find(v => v.id === variantId);
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
        const variant = variantId ? getVariantInfo(variantId) : undefined;
        const actualPrice = item.isPriceEditable ? (customPrices[itemId] || 0) : item.price;
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
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
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

        <div className="overflow-y-auto p-5 space-y-4 flex-grow">
          {cartItems.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              Корзина пуста
            </div>
          ) : (
            <ul className="space-y-3">
              {cartItems.map(entry => (
                <li key={entry.key} className="flex justify-between items-start text-sm sm:text-base border-b border-dashed border-slate-200 pb-3 last:border-0">
                  <div className="pr-4">
                    <span className="font-medium text-slate-900 block">
                        {entry.originalItem.name}
                    </span>
                    {entry.variant && (
                        <span className="text-blue-600 text-xs block font-medium mt-0.5">
                            {entry.variant.label}
                        </span>
                    )}
                    <span className="text-slate-500 text-xs block mt-0.5">
                      {entry.quantity} {entry.originalItem.unit} x {entry.price} ₽
                    </span>
                  </div>
                  <div className="font-bold text-slate-800 whitespace-nowrap">
                    {entry.subtotal} ₽
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cartItems.length > 0 && (
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-4">
                <div>
                  <p className="text-[10px] text-slate-400 mb-2 font-black uppercase tracking-widest">Способ оплаты</p>
                  <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                      <button 
                          onClick={() => setPaymentMethod('cash')}
                          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                              paymentMethod === 'cash' 
                              ? 'bg-emerald-600 text-white shadow-md' 
                              : 'text-slate-500 hover:bg-slate-50'
                          }`}
                      >
                          <Banknote size={16} />
                          <span>Наличные</span>
                      </button>
                      <button 
                          onClick={() => setPaymentMethod('card')}
                          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                              paymentMethod === 'card' 
                              ? 'bg-purple-600 text-white shadow-md' 
                              : 'text-slate-500 hover:bg-slate-50'
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
                            className="w-full bg-white border-2 border-emerald-100 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">₽</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Сдача</label>
                        <div className={`w-full h-[52px] flex items-center px-4 rounded-xl border-2 font-black text-xl transition-all ${
                          changeAmount > 0 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-inner' 
                          : 'bg-slate-100 border-slate-200 text-slate-300'
                        }`}>
                          {changeAmount} ₽
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
        )}

        <div className="p-5 bg-white border-t border-slate-200 rounded-b-2xl">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">Итого к оплате:</span>
            <span className="text-4xl font-black text-blue-600 tracking-tighter">{total} ₽</span>
          </div>
          
          <div className="flex gap-3">
             <button 
              onClick={onClear}
              disabled={cartItems.length === 0}
              className="p-4 rounded-2xl border-2 border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 disabled:opacity-50 transition-all"
              title="Очистить корзину"
            >
              <Trash2 size={24} />
            </button>
            <button 
              onClick={handlePay}
              disabled={cartItems.length === 0 || (paymentMethod === 'cash' && receivedAmount !== '' && parseFloat(receivedAmount) < total)}
              className={`flex-grow text-white py-4 px-6 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 uppercase tracking-tighter text-lg
                 ${paymentMethod === 'cash' 
                    ? 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700' 
                    : 'bg-purple-600 shadow-purple-200 hover:bg-purple-700'
                 } disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed`}
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