import React from 'react';
import { ServiceCategory } from '../types';
import { Image as ImageIcon } from 'lucide-react';
import Counter from './Counter';

interface PrintingSectionProps {
  category: ServiceCategory;
  quantities: Record<string, number>;
  onQuantityChange: (id: string, qty: number) => void;
}

const PrintingSection: React.FC<PrintingSectionProps> = ({ category, quantities, onQuantityChange }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 overflow-hidden mb-8">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg shadow-blue-200">
            <ImageIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{category.title}</h2>
            <p className="text-slate-500 text-sm">Выберите размер и количество фотографий</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {category.items.map((item) => {
            const qty = quantities[item.id] || 0;
            const subtotal = qty * item.price;
            
            return (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-blue-50 flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-200">
                <div className="mb-2 text-slate-400">
                   {/* Aspect Ratio Visual Representation */}
                   <div 
                     className="bg-slate-100 border-2 border-slate-200 rounded-sm mx-auto mb-3"
                     style={{
                        width: '60px',
                        height: item.name.includes('10 x 15') ? '40px' : item.name.includes('15 x 20') ? '45px' : '50px' 
                     }}
                   />
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">{item.name.replace('Печать ', '')}</h3>
                <p className="text-slate-500 mb-4 font-medium">{item.price} ₽ / шт</p>
                
                <div className="w-full flex justify-center mb-3">
                  <Counter 
                    value={qty} 
                    onChange={(newQty) => onQuantityChange(item.id, newQty)} 
                  />
                </div>

                {qty > 0 && (
                  <div className="w-full pt-3 border-t border-slate-100">
                    <span className="text-blue-600 font-bold text-lg">{subtotal} ₽</span>
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