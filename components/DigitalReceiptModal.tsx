
import React, { useState } from 'react';
import { Order } from '../types';
import { X, Printer, Save } from 'lucide-react';

interface DigitalReceiptModalProps {
  order: Order;
  onClose: () => void;
  onUpdateOrder: (updatedOrder: Order) => void;
  isDarkMode: boolean;
}

const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({ order, onClose, onUpdateOrder, isDarkMode }) => {
  const [receiptNum, setReceiptNum] = useState(order.receiptNumber || '');
  
  const initialDate = new Date(order.issueDate || order.date);
  const [issueDay, setIssueDay] = useState(initialDate.getDate().toString().padStart(2, '0'));
  const [issueMonth, setIssueMonth] = useState((initialDate.getMonth() + 1).toString().padStart(2, '0'));
  const [issueYear, setIssueYear] = useState(initialDate.getFullYear().toString().slice(-2));

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    const fullYear = 2000 + parseInt(issueYear);
    const monthIdx = parseInt(issueMonth) - 1;
    const dayNum = parseInt(issueDay);
    
    const newDate = new Date(fullYear, monthIdx, dayNum);
    
    if (isNaN(newDate.getTime())) {
      alert('Ошибка: Введена некорректная дата');
      return;
    }

    onUpdateOrder({
      ...order,
      receiptNumber: receiptNum,
      issueDate: newDate.toISOString()
    });
  };

  const formattedOrderDate = new Date(order.timestamp).toLocaleDateString('ru-RU');
  const [orderDay, orderMonth, orderYear] = formattedOrderDate.split('.');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto no-print-backdrop">
      <div className={`w-full max-w-2xl rounded-xl shadow-2xl flex flex-col relative print:shadow-none print:m-0 print:bg-white transition-colors ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        
        {/* Actions bar (hidden in print) */}
        <div className={`flex justify-between items-center p-4 border-b print:hidden rounded-t-xl transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
           <div className={`font-black uppercase tracking-widest text-[10px] flex items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 shadow-lg shadow-blue-500/50"></span>
              Редактирование бланка
           </div>
           <div className="flex gap-2">
             <button 
                onClick={handleSave}
                className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-black uppercase tracking-tighter text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
             >
                <Save size={18} />
                <span className="hidden sm:inline">Сохранить</span>
             </button>
             <button 
                onClick={handlePrint}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-black uppercase tracking-tighter text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
             >
                <Printer size={18} />
                <span className="hidden sm:inline">Печать</span>
             </button>
             <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors">
                <X size={24} />
             </button>
           </div>
        </div>

        {/* The Receipt Itself - ALWAYS WHITE FOR LEGIBILITY & PRINTING */}
        <div className={`p-8 sm:p-12 print:p-0 print:bg-white flex flex-col items-center ${isDarkMode ? 'bg-slate-900/50' : 'bg-[#fdfdfd]'}`}>
          <div className="w-full max-w-[500px] border border-slate-300 p-8 sm:p-10 relative bg-white shadow-inner print:shadow-none print:border-none rounded-sm">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="text-[11px] leading-tight text-slate-800 font-bold space-y-0.5 uppercase tracking-tighter">
                <p>ИП Лобачев Л. Е.</p>
                <p>ИНН: 245 500 055 062 ; ОГРН: 304 245 510 3000 22</p>
                <p>г. Минусинск, ул. Абаканская 54 «А»</p>
              </div>
              <div className="border-2 border-slate-900 px-3 py-1 font-black text-sm tracking-tight whitespace-nowrap text-slate-900">
                ПРЕСТИЖ ФОТО
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6 relative">
              <div className="flex justify-center items-center text-xl font-black tracking-tighter text-slate-900 uppercase">
                <span>Квитанция № </span>
                <input 
                  type="text"
                  value={receiptNum}
                  onChange={(e) => setReceiptNum(e.target.value)}
                  className="w-24 text-red-600 font-black bg-transparent border-none outline-none focus:ring-2 focus:ring-red-100 rounded px-1 text-center print:ring-0"
                />
              </div>
              <p className="text-sm font-black italic mt-1 text-slate-800">
                Вид услуги: ЦИФРОВЫЕ УСЛУГИ
              </p>
              <div className="absolute right-0 top-1 text-[11px] font-black text-slate-600">
                Серия ВВ
              </div>
            </div>

            {/* Content Lines */}
            <div className="space-y-5 mb-8">
              <div className="min-h-[120px] border-b border-slate-300 relative pb-2">
                {order.items.map((item, i) => (
                   <div key={i} className="flex justify-between text-xs font-bold mb-1 text-slate-800">
                      <span>{item.name} {item.variant ? `(${item.variant})` : ''} x {item.quantity}</span>
                      <span className="tabular-nums">{item.total} ₽</span>
                   </div>
                ))}
                {[...Array(Math.max(0, 4 - order.items.length))].map((_, i) => (
                  <div key={i} className="h-4 border-b border-slate-200 mt-1 opacity-20"></div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 text-slate-900">
                 <div className="flex items-end gap-1 text-[13px] font-bold">
                    <span className="whitespace-nowrap">Дата приемки «</span>
                    <span className="w-8 border-b border-slate-400 text-center font-black">{orderDay}</span>
                    <span>» «</span>
                    <span className="w-8 border-b border-slate-400 text-center font-black">{orderMonth}</span>
                    <span>» 20</span>
                    <span className="w-6 border-b border-slate-400 text-center font-black">{orderYear.slice(-2)}</span>
                    <span> г.</span>
                 </div>

                 <div className="flex items-end gap-1 text-[13px] font-bold">
                    <span className="whitespace-nowrap">Дата выдачи «</span>
                    <input 
                      type="text" 
                      maxLength={2}
                      value={issueDay}
                      onChange={(e) => setIssueDay(e.target.value.replace(/\D/g, ''))}
                      className="w-8 border-b border-slate-400 text-center font-black bg-transparent outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-200 print:focus:bg-transparent print:ring-0"
                    />
                    <span>» «</span>
                    <input 
                      type="text" 
                      maxLength={2}
                      value={issueMonth}
                      onChange={(e) => setIssueMonth(e.target.value.replace(/\D/g, ''))}
                      className="w-8 border-b border-slate-400 text-center font-black bg-transparent outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-200 print:focus:bg-transparent print:ring-0"
                    />
                    <span>» 20</span>
                    <input 
                      type="text" 
                      maxLength={2}
                      value={issueYear}
                      onChange={(e) => setIssueYear(e.target.value.replace(/\D/g, ''))}
                      className="w-6 border-b border-slate-400 text-center font-black bg-transparent outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-200 print:focus:bg-transparent print:ring-0"
                    />
                    <span> г.</span>
                 </div>
              </div>

              <div className="flex items-end gap-2 text-[13px] font-black">
                 <span className="whitespace-nowrap text-slate-900 uppercase tracking-tighter">Стоимость услуги:</span>
                 <span className="flex-grow border-b-2 border-slate-400 px-2 text-xl text-blue-800 tracking-tighter">
                   {order.totalAmount} рублей
                 </span>
              </div>

              <div className="flex items-end gap-2 text-[13px] font-bold mt-6">
                 <span className="whitespace-nowrap text-slate-900">Подпись</span>
                 <div className="flex-grow border-b border-slate-400 h-6"></div>
              </div>
            </div>

            <p className="text-[9px] text-center text-slate-400 mt-4 italic font-bold">
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
          .fixed { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: auto !important; overflow: visible !important; }
          .no-print-backdrop { background: transparent !important; backdrop-filter: none !important; }
          .bg-white { background-color: white !important; }
          .border { border: none !important; }
          .p-8, .p-12 { padding: 0 !important; }
          input { border: none !important; box-shadow: none !important; -webkit-appearance: none; appearance: none; background: transparent !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .no-print-backdrop { background: white !important; }
          .bg-white.w-full { width: auto !important; }
          .p-8.sm\\:p-12 { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default DigitalReceiptModal;
