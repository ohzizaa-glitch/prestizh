
import React from 'react';
import { ServiceCategory } from '../types';
import { Image as ImageIcon } from 'lucide-react';
import Counter from './Counter';

interface PrintingSectionProps {
  category: ServiceCategory;
  quantities: Record<string, number>;
  onQuantityChange: (id: string, qty: number) => void;
  isDarkMode: boolean;
}

const PrintingSection: React.FC<PrintingSectionProps> = ({ category, quantities, onQuantityChange, isDarkMode }) => {
  return (
    <div className={`rounded-2xl border overflow-hidden mb-8 transition-all ${isDarkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'}`}>
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <ImageIcon size={24} />
          </div>
          <div>
            <h2 className={`text-xl font-black uppercase tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{category.title}</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Выберите размер и количество фотографий</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {category.items.map((item) => {
            const qty = quantities[item.id] || 0;
            const subtotal = qty * item.price;
            
            return (
              <div key={item.id} className={`rounded-2xl p-4 shadow-sm border flex flex-col items-center text-center transition-all hover:-translate-y-1 duration-200 ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-blue-50 hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-100'}`}>
                <div className="mb-2">
                   {/* Aspect Ratio Visual Representation */}
                   <div 
                     className={`border-2 rounded-sm mx-auto mb-3 transition-colors ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-100 border-slate-200'}`}
                     style={{
                        width: '60px',
                        height: item.name.includes('10 x 15') ? '40px' : item.name.includes('15 x 20') ? '45px' : '50px' 
                     }}
                   />
                </div>
                <h3 className={`font-black uppercase tracking-tighter text-lg mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{item.name.replace('Печать ', '')}</h3>
                <p className="text-slate-500 mb-4 font-bold text-sm tracking-tight">{item.price} ₽ / шт</p>
                
                <div className="w-full flex justify-center mb-3">
                  <Counter 
                    value={qty} 
                    onChange={(newQty) => onQuantityChange(item.id, newQty)} 
                    isDarkMode={isDarkMode}
                  />
                </div>

                {qty > 0 && (
                  <div className={`w-full pt-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <span className="text-blue-600 font-black text-xl tracking-tighter">{subtotal} ₽</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PrintingSection;
