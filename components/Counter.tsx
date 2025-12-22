import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface CounterProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
}

const Counter: React.FC<CounterProps> = ({ value, onChange, min = 0 }) => {
  const decrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const increase = () => {
    onChange(value + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (inputValue === '') {
      onChange(min);
      return;
    }
    
    const newValue = parseInt(inputValue, 10);
    
    if (!isNaN(newValue)) {
      onChange(Math.max(min, newValue));
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent non-numeric characters that might be allowed in type="number"
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
      <button 
        onClick={decrease}
        disabled={value <= min}
        className="p-1.5 rounded-md hover:bg-white text-slate-600 disabled:opacity-30 transition-colors flex-shrink-0"
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>
      
      <input
        type="number"
        min={min}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className="w-12 text-center font-medium text-slate-900 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-md transition-all appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      
      <button 
        onClick={increase}
        className="p-1.5 rounded-md hover:bg-white text-blue-600 transition-colors flex-shrink-0"
        aria-label="Increase quantity"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

export default Counter;