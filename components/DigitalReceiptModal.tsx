
import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { X, Printer, Save, Pencil } from 'lucide-react';

interface DigitalReceiptModalProps {
  order: Order;
  onClose: () => void;
  onUpdateOrder: (updatedOrder: Order) => void;
  isDarkMode: boolean;
}

const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({ order, onClose, onUpdateOrder, isDarkMode }) => {
  const [receiptNum, setReceiptNum] = useState(order.receiptNumber || '');
  
  // Issue Date (Дата выдачи)
  const initialIssueDate = new Date(order.issueDate || order.date);
  const [issueDay, setIssueDay] = useState(initialIssueDate.getDate().toString().padStart(2, '0'));
  const [issueMonth, setIssueMonth] = useState((initialIssueDate.getMonth() + 1).toString().padStart(2, '0'));
  const [issueYear, setIssueYear] = useState(initialIssueDate.getFullYear().toString().slice(-2));

  // Reception Date (Дата приемки) - Now Editable
  const initialRecDate = new Date(order.date);
  const [recDay, setRecDay] = useState(initialRecDate.getDate().toString().padStart(2, '0'));
  const [recMonth, setRecMonth] = useState((initialRecDate.getMonth() + 1).toString().padStart(2, '0'));
  const [recYear, setRecYear] = useState(initialRecDate.getFullYear().toString().slice(-2));

  // Items - Now Editable (Local state for rendering)
  const [items, setItems] = useState(() => 
    order.items.map(item => ({
      ...item,
      // Combine name and variant for easier single-line editing if needed, 
      // or keep distinct. Let's provide a full display string to edit.
      displayName: `${item.name} ${item.variant ? `(${item.variant})` : ''} x ${item.quantity}`,
      displayTotal: item.total.toString()
    }))
  );

  // Total - Now Editable
  const [customTotal, setCustomTotal] = useState(order.totalAmount.toString());

  // Editable fields state (Global settings)
  const [headerName, setHeaderName] = useState(() => localStorage.getItem('receipt_header_name') || 'ИП Лобачев Л. Е.');
  const [headerDetails, setHeaderDetails] = useState(() => localStorage.getItem('receipt_header_details') || 'ИНН: 245 500 055 062 ; ОГРН: 304 245 510 3000 22');
  const [headerAddress, setHeaderAddress] = useState(() => localStorage.getItem('receipt_header_address') || 'г. Минусинск, ул. Абаканская 54 «А»');
  const [serviceType, setServiceType] = useState(() => localStorage.getItem('receipt_service_type') || 'ЦИФРОВЫЕ УСЛУГИ');
  const [footerText, setFooterText] = useState(() => localStorage.getItem('receipt_footer_text') || 'Бланк строгой отчетности. Генерируется автоматически системой Престиж Калькулятор.');

  // Save editable fields to localStorage when they change
  useEffect(() => {
    localStorage.setItem('receipt_header_name', headerName);
    localStorage.setItem('receipt_header_details', headerDetails);
    localStorage.setItem('receipt_header_address', headerAddress);
    localStorage.setItem('receipt_service_type', serviceType);
    localStorage.setItem('receipt_footer_text', footerText);
  }, [headerName, headerDetails, headerAddress, serviceType, footerText]);

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    // Parse Issue Date
    const fullIssueYear = 2000 + parseInt(issueYear);
    const issueMonthIdx = parseInt(issueMonth) - 1;
    const issueDayNum = parseInt(issueDay);
    const newIssueDate = new Date(fullIssueYear, issueMonthIdx, issueDayNum);
    
    // Parse Reception Date
    const fullRecYear = 2000 + parseInt(recYear);
    const recMonthIdx = parseInt(recMonth) - 1;
    const recDayNum = parseInt(recDay);
    const newRecDate = new Date(fullRecYear, recMonthIdx, recDayNum);

    if (isNaN(newIssueDate.getTime()) || isNaN(newRecDate.getTime())) {
      alert('Ошибка: Введена некорректная дата');
      return;
    }

    // Update items in order object based on edits
    // Note: This is a destructive update for the complex structure, 
    // simplifying it to match the visual edit.
    const updatedItems = items.map((item, index) => ({
        ...order.items[index], // keep original props like categoryId
        name: item.displayName.split(' x ')[0], // simple heuristic
        // variant: '', // clear variant as it's baked into name now? Or keep it?
        // Let's just update the Order object to reflect the visual changes mostly for the "Receipt" view.
        // In a real app, we might want separate "receipt text" vs "data".
        // Here we update the data to match.
        total: parseFloat(item.displayTotal) || 0
    }));

    onUpdateOrder({
      ...order,
      receiptNumber: receiptNum,
      issueDate: newIssueDate.toISOString(),
      date: newRecDate.toISOString(), // Update reception date
      items: updatedItems,
      totalAmount: parseFloat(customTotal) || 0
    });
    
    // Optional: Notify user or close?
    // onClose(); // usually we might want to stay
  };

  const handleItemChange = (index: number, field: 'displayName' | 'displayTotal', value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

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
            
            {/* Header - Editable Inputs */}
            <div className="flex justify-between items-start mb-6 group/header relative">
              <div className="w-full mr-4">
                 <input 
                   value={headerName}
                   onChange={(e) => setHeaderName(e.target.value)}
                   className="w-full text-[11px] leading-tight text-slate-800 font-bold uppercase tracking-tighter bg-transparent border-none outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-200 rounded-sm mb-0.5 print:bg-transparent"
                 />
                 <input 
                   value={headerDetails}
                   onChange={(e) => setHeaderDetails(e.target.value)}
                   className="w-full text-[11px] leading-tight text-slate-800 font-bold uppercase tracking-tighter bg-transparent border-none outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-200 rounded-sm mb-0.5 print:bg-transparent"
                 />
                 <input 
                   value={headerAddress}
                   onChange={(e) => setHeaderAddress(e.target.value)}
                   className="w-full text-[11px] leading-tight text-slate-800 font-bold uppercase tracking-tighter bg-transparent border-none outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-200 rounded-sm print:bg-transparent"
                 />
                 <div className="absolute -left-5 top-0 opacity-0 group-hover/header:opacity-100 transition-opacity print:hidden text-slate-400">
                    <Pencil size={12} />
                 </div>
              </div>

              <div className="border-2 border-slate-900 px-3 py-1 font-black text-sm tracking-tight whitespace-nowrap text-slate-900 flex-shrink-0">
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
              <div className="flex justify-center items-center mt-1 group/type relative">
                 <span className="text-sm font-black italic text-slate-800 mr-2 whitespace-nowrap">Вид услуги:</span>
                 <input 
                   value={serviceType}
                   onChange={(e) => setServiceType(e.target.value)}
                   className="text-sm font-black italic text-slate-800 bg-transparent border-none outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-200 rounded-sm text-center min-w-[100px] print:bg-transparent"
                 />
                 <div className="absolute -right-4 top-1 opacity-0 group-hover/type:opacity-100 transition-opacity print:hidden text-slate-400">
                    <Pencil size={10} />
                 </div>
              </div>
              <div className="absolute right-0 top-1 text-[11px] font-black text-slate-600">
                Серия ВВ
              </div>
            </div>

            {/* Content Lines */}
            <div className="space-y-5 mb-8">
              <div className="min-h-[120px] border-b border-slate-300 relative pb-2 group/items">
                {items.map((item, i) => (
                   <div key={i} className="flex justify-between text-xs font-bold mb-1 text-slate-800 relative hover:bg-blue-50/50 rounded px-1 -mx-1 transition-colors">
                      <input 
                        value={item.displayName}
                        onChange={(e) => handleItemChange(i, 'displayName', e.target.value)}
                        className="flex-grow bg-transparent border-none outline-none focus:ring-0 text-slate-800 font-bold w-full print:bg-transparent"
                      />
                      <div className="flex items-center whitespace-nowrap ml-2">
                        <input 
                          value={item.displayTotal}
                          onChange={(e) => handleItemChange(i, 'displayTotal', e.target.value)}
                          className="w-16 text-right bg-transparent border-none outline-none focus:ring-0 text-slate-800 font-bold tabular-nums print:bg-transparent"
                        />
                        <span className="ml-1">₽</span>
                      </div>
                   </div>
                ))}
                
                {/* Empty lines filler */}
                {[...Array(Math.max(0, 4 - items.length))].map((_, i) => (
                  <div key={i} className="h-4 border-b border-slate-200 mt-1 opacity-20"></div>
                ))}

                <div className="absolute -left-6 top-0 opacity-0 group-hover/items:opacity-100 transition-opacity print:hidden text-slate-400">
                  <Pencil size={12} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 text-slate-900">
                 {/* Reception Date (Дата приемки) - Editable */}
                 <div className="flex items-end gap-1 text-[13px] font-bold group/date1 relative">
                    <span className="whitespace-nowrap">Дата приемки «</span>
                    <input 
                      type="text" 
                      maxLength={2}
                      value={recDay}
                      onChange={(e) => setRecDay(e.target.value.replace(/\D/g, ''))}
                      className="w-8 border-b border-slate-400 text-center font-black bg-transparent outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-200 print:focus:bg-transparent print:ring-0"
                    />
                    <span>» «</span>
                    <input 
                      type="text" 
                      maxLength={2}
                      value={recMonth}
                      onChange={(e) => setRecMonth(e.target.value.replace(/\D/g, ''))}
                      className="w-8 border-b border-slate-400 text-center font-black bg-transparent outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-200 print:focus:bg-transparent print:ring-0"
                    />
                    <span>» 20</span>
                    <input 
                      type="text" 
                      maxLength={2}
                      value={recYear}
                      onChange={(e) => setRecYear(e.target.value.replace(/\D/g, ''))}
                      className="w-6 border-b border-slate-400 text-center font-black bg-transparent outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-200 print:focus:bg-transparent print:ring-0"
                    />
                    <span> г.</span>
                    <div className="absolute -left-6 top-1 opacity-0 group-hover/date1:opacity-100 transition-opacity print:hidden text-slate-400">
                        <Pencil size={10} />
                    </div>
                 </div>

                 {/* Issue Date (Дата выдачи) - Editable */}
                 <div className="flex items-end gap-1 text-[13px] font-bold group/date2 relative">
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
                    <div className="absolute -left-6 top-1 opacity-0 group-hover/date2:opacity-100 transition-opacity print:hidden text-slate-400">
                        <Pencil size={10} />
                    </div>
                 </div>
              </div>

              <div className="flex items-end gap-2 text-[13px] font-black group/total relative">
                 <span className="whitespace-nowrap text-slate-900 uppercase tracking-tighter">Стоимость услуги:</span>
                 <div className="flex-grow border-b-2 border-slate-400 px-2 flex items-center">
                    <input 
                       value={customTotal}
                       onChange={(e) => setCustomTotal(e.target.value)}
                       className="w-full text-xl text-blue-800 tracking-tighter bg-transparent border-none outline-none focus:bg-blue-50/50 print:bg-transparent font-black"
                    />
                    <span className="text-blue-800 tracking-tighter text-xl ml-1">рублей</span>
                 </div>
                 <div className="absolute -left-6 top-1 opacity-0 group-hover/total:opacity-100 transition-opacity print:hidden text-slate-400">
                    <Pencil size={10} />
                 </div>
              </div>

              <div className="flex items-end gap-2 text-[13px] font-bold mt-6">
                 <span className="whitespace-nowrap text-slate-900">Подпись</span>
                 <div className="flex-grow border-b border-slate-400 h-6"></div>
              </div>
            </div>

            <div className="group/footer relative">
                <textarea 
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  rows={2}
                  className="w-full text-[9px] text-center text-slate-400 mt-4 italic font-bold bg-transparent border-none outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-200 rounded-sm resize-none print:bg-transparent overflow-hidden"
                />
                <div className="absolute -right-4 top-4 opacity-0 group-hover/footer:opacity-100 transition-opacity print:hidden text-slate-400">
                    <Pencil size={10} />
                 </div>
            </div>
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
          input, textarea { border: none !important; box-shadow: none !important; -webkit-appearance: none; appearance: none; background: transparent !important; resize: none; }
          .print\\:shadow-none { box-shadow: none !important; }
          .no-print-backdrop { background: white !important; }
          .bg-white.w-full { width: auto !important; }
          .p-8.sm\\:p-12 { padding: 0 !important; }
          .print\\:bg-transparent { background: transparent !important; }
        }
      `}</style>
    </div>
  );
};

export default DigitalReceiptModal;
