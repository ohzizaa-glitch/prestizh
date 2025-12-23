import React from 'react';
import { Order } from '../types';
import { X, Printer } from 'lucide-react';

interface DigitalReceiptModalProps {
  order: Order;
  onClose: () => void;
}

const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({ order, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  // Filter only digital items as requested
  const digitalItems = order.items; 
  // Note: in the real app, we already pre-filtered this order if it was created for digital receipt.
  
  const formattedDate = new Date(order.timestamp).toLocaleDateString('ru-RU');
  const [day, month, year] = formattedDate.split('.');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto no-print-backdrop">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col relative print:shadow-none print:m-0">
        
        {/* Actions bar (hidden in print) */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 print:hidden bg-slate-50 rounded-t-xl">
           <div className="text-slate-500 font-medium text-sm flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              Квитанция сформирована
           </div>
           <div className="flex gap-2">
             <button 
                onClick={handlePrint}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
             >
                <Printer size={18} />
                <span>Печать</span>
             </button>
             <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500">
                <X size={24} />
             </button>
           </div>
        </div>

        {/* The Receipt Itself */}
        <div className="p-8 sm:p-12 bg-[#fdfdfd] print:p-0 print:bg-white flex flex-col items-center">
          <div className="w-full max-w-[500px] border border-slate-300 p-8 sm:p-10 relative bg-white shadow-inner print:shadow-none print:border-none">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="text-[11px] leading-tight text-slate-700 font-medium space-y-0.5 uppercase">
                <p>ИП Лобачев Л. Е.</p>
                <p>ИНН: 245 500 055 062 ; ОГРН: 304 245 510 3000 22</p>
                <p>г. Минусинск, ул. Абаканская 54 «А»</p>
              </div>
              <div className="border-2 border-slate-900 px-3 py-1 font-black text-sm tracking-tight whitespace-nowrap">
                ПРЕСТИЖ ФОТО
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6 relative">
              <h2 className="text-xl font-bold tracking-widest text-slate-900 uppercase">
                Квитанция № <span className="text-red-600 font-black">{order.receiptNumber}</span>
              </h2>
              <p className="text-sm font-bold italic mt-1 text-slate-800">
                Вид услуги: ЦИФРОВЫЕ УСЛУГИ
              </p>
              <div className="absolute right-0 top-1 text-[11px] font-bold text-slate-600">
                Серия ВВ
              </div>
            </div>

            {/* Content Lines */}
            <div className="space-y-5 mb-8">
              {/* Items List */}
              <div className="min-h-[120px] border-b border-slate-300 relative pb-2">
                {order.items.map((item, i) => (
                   <div key={i} className="flex justify-between text-xs font-medium mb-1">
                      <span>{item.name} {item.variant ? `(${item.variant})` : ''} x {item.quantity}</span>
                      <span>{item.total} ₽</span>
                   </div>
                ))}
                {/* Empty lines to simulate the blank form if few items */}
                {[...Array(Math.max(0, 4 - order.items.length))].map((_, i) => (
                  <div key={i} className="h-4 border-b border-slate-200 mt-1 opacity-20"></div>
                ))}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-4">
                 <div className="flex items-end gap-2 text-[13px] font-medium">
                    <span className="whitespace-nowrap">Дата приемки «</span>
                    <span className="flex-grow border-b border-slate-400 text-center px-1 font-bold">{day}</span>
                    <span>» «</span>
                    <span className="flex-grow border-b border-slate-400 text-center px-1 font-bold">{month}</span>
                    <span>» 20</span>
                    <span className="w-8 border-b border-slate-400 text-center px-1 font-bold">{year.slice(-2)}</span>
                    <span> г.</span>
                 </div>
                 <div className="flex items-end gap-2 text-[13px] font-medium">
                    <span className="whitespace-nowrap">Дата выдачи «</span>
                    <span className="flex-grow border-b border-slate-400 text-center px-1 font-bold">{day}</span>
                    <span>» «</span>
                    <span className="flex-grow border-b border-slate-400 text-center px-1 font-bold">{month}</span>
                    <span>» 20</span>
                    <span className="w-8 border-b border-slate-400 text-center px-1 font-bold">{year.slice(-2)}</span>
                    <span> г.</span>
                 </div>
              </div>

              {/* Total Cost */}
              <div className="flex items-end gap-2 text-[13px] font-bold">
                 <span className="whitespace-nowrap">Стоимость услуги:</span>
                 <span className="flex-grow border-b-2 border-slate-400 px-2 text-lg text-blue-800">
                   {order.totalAmount} рублей
                 </span>
              </div>

              {/* Signature */}
              <div className="flex items-end gap-2 text-[13px] font-medium mt-6">
                 <span className="whitespace-nowrap">Подпись</span>
                 <div className="flex-grow border-b border-slate-400 h-6"></div>
              </div>
            </div>

            {/* Footer tiny text */}
            <p className="text-[9px] text-center text-slate-400 mt-4 italic">
              Бланк строгой отчетности. Генерируется автоматически системой Престиж Калькулятор.
            </p>
          </div>
        </div>
      </div>
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print-container, .print-container * { visibility: visible; }
          .fixed { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print-backdrop { background: transparent !important; backdrop-filter: none !important; }
          .bg-white { background-color: white !important; }
          .border { border: none !important; }
          .p-8, .p-12 { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default DigitalReceiptModal;