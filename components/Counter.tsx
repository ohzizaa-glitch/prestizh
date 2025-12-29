
import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface CounterProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  isDarkMode?: boolean;
}

const Counter: React.FC<CounterProps> = ({ value, onChange, min = 0, isDarkMode }) => {
  
  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10); // Легкая вибрация 10мс
    }
  };

  const decrease = () => {
    if (value > min) {
      onChange(value - 1);
      triggerHaptic();
    }
  };

  const increase = () => {
    onChange(value + 1);
    triggerHaptic();
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
        className={`p-2 sm:p-1.5 rounded-lg transition-colors flex-shrink-0 disabled:opacity-30 active:scale-95 ${isDarkMode ? 'hover:bg-slate-600 text-slate-400 active:bg-slate-600' : 'hover:bg-white text-slate-600 active:bg-white'}`}
        aria-label="Decrease"
      >
        <Minus size={18} />
      </button>
      
      <input
        type="number"
        min={min}
        value={value}
        onChange={handleInputChange}
        className={`w-10 sm:w-12 text-center font-black text-sm sm:text-base bg-transparent outline-none rounded-lg appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
      />
      
      <button 
        onClick={increase}
        className={`p-2 sm:p-1.5 rounded-lg transition-colors flex-shrink-0 active:scale-95 ${isDarkMode ? 'hover:bg-slate-600 text-blue-400 active:bg-slate-600' : 'hover:bg-white text-blue-600 active:bg-white'}`}
        aria-label="Increase"
      >
        <Plus size={18} />
      </button>
    </div>
  );
};

export default Counter;
