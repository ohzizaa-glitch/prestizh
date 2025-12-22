import React from 'react';
import { ServiceCategory, ServiceItem } from '../types';
import Counter from './Counter';

interface ServiceCardProps {
  category: ServiceCategory;
  quantities: Record<string, number>;
  onQuantityChange: (id: string, qty: number) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ category, quantities, onQuantityChange }) => {
  const Icon = category.icon;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-300">
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center space-x-3">
        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
          <Icon size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-800">{category.title}</h2>
      </div>
      
      <div className="p-4 flex-grow flex flex-col space-y-4">
        {category.items.map((item) => (
          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
            <div className="flex-grow">
              <div className="flex items-baseline justify-between w-full">
                <span className="text-slate-700 font-medium group-hover:text-blue-700 transition-colors">
                  {item.name}
                </span>
              </div>
              <div className="text-sm text-slate-500">
                {item.isVariablePrice && 'от '}
                {item.price} ₽ {item.unit && `/ ${item.unit}`}
              </div>
            </div>
            
            <div className="flex-shrink-0 self-end sm:self-center">
              <Counter 
                value={quantities[item.id] || 0} 
                onChange={(newQty) => onQuantityChange(item.id, newQty)} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceCard;