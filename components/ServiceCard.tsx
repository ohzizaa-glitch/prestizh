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
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  category, 
  quantities, 
  customPrices, 
  onQuantityChange, 
  onPriceChange 
}) => {
  const Icon = category.icon;
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const getVariantKey = (itemId: string, variantId: string) => `${itemId}__${variantId}`;

  const handleVariantChange = (itemId: string, variantId: string) => {
    setSelectedVariants(prev => ({ ...prev, [itemId]: variantId }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-300">
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center space-x-3">
        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
          <Icon size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-800">{category.title}</h2>
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
          const displayPrice = item.isPriceEditable ? (customPrices[item.id] ?? 0) : item.price;

          return (
            <div key={item.id} className="flex flex-col gap-3 group border-b border-slate-50 pb-4 last:border-0 last:pb-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex-grow">
                  <div className="flex items-baseline justify-between w-full">
                    <span className="text-slate-700 font-medium group-hover:text-blue-700 transition-colors">
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
                            className="w-24 bg-blue-50 border border-blue-100 text-blue-700 font-bold text-sm px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder:text-blue-300 placeholder:font-normal transition-all"
                          />
                          <Pencil size={10} className="absolute right-1 top-1 text-blue-300" />
                        </div>
                        <span className="text-sm text-slate-400">₽ {item.unit && `/ ${item.unit}`}</span>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">
                        {item.isVariablePrice && 'от '}
                        {item.price} ₽ {item.unit && `/ ${item.unit}`}
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
                        className="w-full sm:w-48 appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
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
                    <div className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-tight">
                       {PHOTO_VARIANTS.find(v => v.id === currentVariantId)?.description}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-1">
                <Counter 
                  value={currentQty} 
                  onChange={(newQty) => onQuantityChange(quantityKey, newQty)} 
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