
import React, { useState } from 'react';
import { ServiceCategory, ServiceItem } from '../types';
import { PHOTO_VARIANTS } from '../constants';
import Counter from './Counter';
import { ChevronDown, Pencil } from 'lucide-react';

interface ServiceCardProps {
  category: ServiceCategory;
  quantities: Record<string, number>;
  customPrices: Record<string, number>;
  onQuantityChange: (id: string, qty: number) => void;
  onPriceChange: (id: string, price: number) => void;
  isDarkMode: boolean;
  id?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  category, 
  quantities, 
  customPrices, 
  onQuantityChange, 
  onPriceChange,
  isDarkMode,
  id
}) => {
  const Icon = category.icon;
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const getVariantKey = (itemId: string, variantId: string) => `${itemId}__${variantId}`;

  const handleVariantChange = (itemId: string, variantId: string) => {
    setSelectedVariants(prev => ({ ...prev, [itemId]: variantId }));
  };

  return (
    <div id={id} className={`scroll-mt-28 rounded-2xl shadow-sm border overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
      <div className={`p-4 border-b flex items-center space-x-3 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
        <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
          <Icon size={24} />
        </div>
        <h2 className={`text-lg font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{category.title}</h2>
      </div>
      
      <div className="p-4 flex-grow flex flex-col space-y-6">
        {category.items.map((item) => {
          const currentVariantId = item.hasVariants 
            ? (selectedVariants[item.id] || PHOTO_VARIANTS[0].id)
            : '';
          
          const quantityKey = item.hasVariants 
            ? getVariantKey(item.id, currentVariantId)
            : item.id;

          const currentQty = quantities[quantityKey] || 0;

          return (
            <div key={item.id} className={`flex flex-col gap-3 group border-b pb-4 last:border-0 last:pb-0 ${isDarkMode ? 'border-slate-700' : 'border-slate-50'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex-grow">
                  <div className="flex items-baseline justify-between w-full">
                    <span className={`font-bold transition-colors ${isDarkMode ? 'text-slate-200 group-hover:text-blue-400' : 'text-slate-700 group-hover:text-blue-700'}`}>
                      {item.name}
                    </span>
                  </div>
                  
                  <div className="mt-1">
                    {item.isPriceEditable ? (
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <input
                            type="number"
                            value={customPrices[item.id] || ''}
                            onChange={(e) => onPriceChange(item.id, parseInt(e.target.value) || 0)}
                            placeholder="Цена..."
                            className={`w-24 font-black text-sm px-2 py-1 rounded transition-all outline-none focus:ring-2 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-blue-400 focus:ring-blue-900 placeholder:text-slate-500' : 'bg-blue-50 border-blue-100 text-blue-700 focus:ring-blue-200 placeholder:text-blue-300'}`}
                          />
                          <Pencil size={10} className={`absolute right-1 top-1 ${isDarkMode ? 'text-slate-500' : 'text-blue-300'}`} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">₽ {item.unit && `/ ${item.unit}`}</span>
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-slate-500">
                        {item.isVariablePrice && 'от '}
                        <span className={isDarkMode ? 'text-slate-300' : 'text-slate-800'}>{item.price} ₽</span> {item.unit && `/ ${item.unit}`}
                      </div>
                    )}
                  </div>
                </div>
                
                {item.hasVariants && (
                  <div className="w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="relative">
                      <select
                        value={currentVariantId}
                        onChange={(e) => handleVariantChange(item.id, e.target.value)}
                        className={`w-full sm:w-48 appearance-none border text-xs py-2.5 pl-3 pr-8 rounded-xl font-bold leading-tight focus:outline-none transition-colors ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-200 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:border-blue-500'}`}
                      >
                        {PHOTO_VARIANTS.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-1">
                <Counter 
                  value={currentQty} 
                  onChange={(newQty) => onQuantityChange(quantityKey, newQty)} 
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceCard;
