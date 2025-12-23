
import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface CounterProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  isDarkMode?: boolean;
}

const Counter: React.FC<CounterProps> = ({ value, onChange, min = 0, isDarkMode }) => {
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

  return (
    <div className={`flex items-center space-x-1 rounded-xl p-1 shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
      <button 
        onClick={decrease}
        disabled={value <= min}
        className={`p-1.5 rounded-lg transition-colors flex-shrink-0 disabled:opacity-30 ${isDarkMode ? 'hover:bg-slate-600 text-slate-400' : 'hover:bg-white text-slate-600'}`}
        aria-label="Decrease"
      >
        <Minus size={16} />
      </button>
      
      <input
        type="number"
        min={min}
        value={value}
        onChange={handleInputChange}
        className={`w-12 text-center font-black text-sm bg-transparent outline-none rounded-lg appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
      />
      
      <button 
        onClick={increase}
        className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isDarkMode ? 'hover:bg-slate-600 text-blue-400' : 'hover:bg-white text-blue-600'}`}
        aria-label="Increase"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

export default Counter;
