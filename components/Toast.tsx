
import React from 'react';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';

interface ToastProps {
  toasts: { id: number; message: string; type: 'success' | 'info' | 'error' }[];
}

const Toast: React.FC<ToastProps> = ({ toasts }) => {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none flex flex-col items-center space-y-3 w-full max-w-sm px-4">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`
            w-full flex items-center space-x-4 p-4 rounded-2xl shadow-2xl border-2 pointer-events-auto
            animate-in slide-in-from-top-4 duration-300
            ${toast.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : ''}
            ${toast.type === 'info' ? 'bg-blue-600 border-blue-500 text-white' : ''}
            ${toast.type === 'error' ? 'bg-red-600 border-red-500 text-white' : ''}
          `}
        >
          <div className="flex-shrink-0">
            {toast.type === 'success' && <CheckCircle2 size={24} />}
            {toast.type === 'info' && <Info size={24} />}
            {toast.type === 'error' && <AlertCircle size={24} />}
          </div>
          <p className="font-black text-sm uppercase tracking-tighter flex-grow">
            {toast.message}
          </p>
        </div>
      ))}
    </div>
  );
};

export default Toast;
