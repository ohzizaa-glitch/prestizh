import React, { useMemo, useState } from 'react';
import { ServiceItem, PaymentMethod, ServiceVariant } from '../types';
import { PHOTO_VARIANTS } from '../constants';
import { X, Receipt as ReceiptIcon, Trash2, CreditCard, Banknote } from 'lucide-react';

interface ReceiptProps {
  items: ServiceItem[];
  quantities: Record<string, number>;
  onClose: () => void;
  onClear: () => void;
  onSaveOrder: (paymentMethod: PaymentMethod) => void;
}

const Receipt: React.FC<ReceiptProps> = ({ items, quantities, onClose, onClear, onSaveOrder }) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  // Helper to find variant info
  const getVariantInfo = (variantId: string): ServiceVariant | undefined => {
    return PHOTO_VARIANTS.find(v => v.id === variantId);
  };

  // Process quantities keys to rebuild the cart list
  const cartItems = useMemo(() => {
    const results: Array<{
        originalItem: ServiceItem;
        variant?: ServiceVariant;
        quantity: number;
        subtotal: number;
        key: string;
    }> = [];

    Object.entries(quantities).forEach(([key, value]) => {
      const qty = value as number;
      if (qty <= 0) return;

      // Check if key is composite (e.g. "doc_photo__3x4")
      const [itemId, variantId] = key.split('__');
      const item = items.find(i => i.id === itemId);

      if (item) {
        const variant = variantId ? getVariantInfo(variantId) : undefined;
        results.push({
            originalItem: item,
            variant,
            quantity: qty,
            subtotal: qty * item.price,
            key
        });
      }
    });

    return results;
  }, [items, quantities]);

  const total = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  const handlePay = () => {
    onSaveOrder(paymentMethod);
    onClose();
    // Assuming onClear handled by parent after save or inside save wrapper, 
    // but typically we clear after successful payment.
    // In this flow, we will let parent handle the logic.
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
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
                      {entry.quantity} {entry.originalItem.unit} x {entry.originalItem.price} ₽
                      {entry.originalItem.isVariablePrice && ' (от)'}
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

        {/* Payment Method Selector */}
        {cartItems.length > 0 && (
            <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Способ оплаты</p>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    <button 
                        onClick={() => setPaymentMethod('cash')}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-all ${
                            paymentMethod === 'cash' 
                            ? 'bg-emerald-100 text-emerald-700 shadow-sm' 
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <Banknote size={16} />
                        <span>Наличные</span>
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('card')}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-all ${
                            paymentMethod === 'card' 
                            ? 'bg-purple-100 text-purple-700 shadow-sm' 
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <CreditCard size={16} />
                        <span>Картой</span>
                    </button>
                </div>
            </div>
        )}

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-600 font-medium">Общая сумма:</span>
            <span className="text-3xl font-bold text-blue-600">{total} ₽</span>
          </div>
          
          <div className="flex gap-3">
             <button 
              onClick={onClear}
              disabled={cartItems.length === 0}
              className="flex-1 py-3 px-4 rounded-xl border border-red-200 text-red-600 font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">Сброс</span>
            </button>
            <button 
              onClick={handlePay}
              disabled={cartItems.length === 0}
              className={`flex-[2] text-white py-3 px-6 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2
                 ${paymentMethod === 'cash' 
                    ? 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700' 
                    : 'bg-purple-600 shadow-purple-200 hover:bg-purple-700'
                 } disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed`}
            >
              {paymentMethod === 'cash' ? 'Оплата наличными' : 'Оплата картой'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;