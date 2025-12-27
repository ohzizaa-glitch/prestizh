
import React, { useEffect, useState } from 'react';
import { Users, Clock, Zap, CheckCircle2, PlusCircle, MinusCircle, Play, Trash2 } from 'lucide-react';

export interface ActiveClient {
  id: string;
  type: 'regular' | 'urgent';
  finishTime: number; // Время окончания в ms (Unix timestamp)
  totalDurationMs: number;
  label: string;
}

interface WorkloadWidgetProps {
  clients: ActiveClient[];
  onAddClient: (type: 'regular' | 'urgent') => void;
  onRemoveClient: (id: string) => void;
  onAddMinutes: (id: string, minutes: number) => void;
  onClearAll: () => void;
  isDarkMode: boolean;
}

const WorkloadWidget: React.FC<WorkloadWidgetProps> = ({ 
  clients, 
  onAddClient, 
  onRemoveClient, 
  onAddMinutes,
  onClearAll, 
  isDarkMode 
}) => {
  // Локальное состояние для обновления интерфейса каждую секунду
  // Мы не меняем глобальный стейт, только перерисовываем UI
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (finishTime: number) => {
    const remaining = finishTime - now;
    if (remaining <= 0) return "ГОТОВО";

    const totalSeconds = Math.floor(remaining / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`w-full rounded-3xl border p-5 mb-8 transition-all shadow-sm ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100'}`}>
      
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Боковая панель управления */}
        <div className="flex flex-col gap-4 w-full lg:w-72 flex-shrink-0">
          <div className={`p-6 rounded-2xl border flex flex-col gap-1 transition-all shadow-inner ${isDarkMode ? 'bg-slate-900/50 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-blue-500" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Активных заказов</p>
            </div>
            <p className="text-4xl font-black tracking-tighter leading-none">
              {clients.length}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={() => onAddClient('regular')}
              className={`flex items-center justify-between px-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-tight transition-all border shadow-sm ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-blue-600 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-500'}`}
            >
              <div className="flex items-center gap-2"><PlusCircle size={18} /><span>+ Обычный</span></div>
              <span className="opacity-50">15/10м</span>
            </button>
            <button 
              onClick={() => onAddClient('urgent')}
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-tight transition-all border border-orange-500/30 bg-orange-500/5 text-orange-500 hover:bg-orange-500 hover:text-white shadow-sm"
            >
              <div className="flex items-center gap-2"><Zap size={18} /><span>+ Тяжелый</span></div>
              <span className="opacity-50">20/15м</span>
            </button>
          </div>
          
          {clients.length > 0 && (
            <button 
              onClick={onClearAll} 
              className={`mt-2 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest group ${isDarkMode ? 'border-slate-700 text-slate-500 hover:border-red-500/50 hover:text-red-500 hover:bg-red-500/5' : 'border-slate-100 text-slate-400 hover:border-red-100 hover:text-red-500 hover:bg-red-50'}`}
            >
              <Trash2 size={14} className="group-hover:animate-bounce" /> 
              <span>Очистить список</span>
            </button>
          )}
        </div>

        {/* Сетка параллельных таймеров */}
        <div className="flex-grow w-full">
          <div className="flex items-center justify-between mb-5">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
               <Users size={16} /> Мониторинг готовности
             </h3>
             <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                <Play size={12} className={clients.length > 0 ? "animate-pulse" : "opacity-20"} />
                <span>{clients.length > 0 ? "Все таймеры активны" : "Ожидание клиентов"}</span>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.length === 0 ? (
              <div className={`col-span-full py-20 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center ${isDarkMode ? 'border-slate-700 text-slate-600' : 'border-slate-200 text-slate-300'}`}>
                <p className="font-black uppercase tracking-tighter text-lg">Заказов в работе нет</p>
                <p className="text-[10px] uppercase tracking-widest mt-1">Добавьте клиента для запуска таймера</p>
              </div>
            ) : (
              clients.map((client, index) => {
                const remaining = client.finishTime - now;
                const isOverdue = remaining <= 0;
                
                // Прогресс бар (обратный, уменьшается со временем)
                // (Остаток / Всего) * 100
                const progress = Math.max(0, Math.min(100, (remaining / client.totalDurationMs) * 100));
                
                // Если просрочено, прогресс бар полный (100%) но другого цвета, либо 0. 
                // Сделаем 0 чтобы исчез.
                
                return (
                  <div 
                    key={client.id}
                    className={`relative overflow-hidden rounded-3xl border p-5 transition-all shadow-sm ${
                      isOverdue 
                        ? 'border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/10' 
                        : (isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-slate-50/50 border-slate-200')
                    }`}
                  >
                    {/* Прогресс-бар */}
                    {!isOverdue && (
                      <div 
                        className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${client.type === 'urgent' ? 'bg-orange-500' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-white border border-slate-200 text-slate-500'}`}>
                            #{index + 1}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${client.type === 'urgent' ? 'text-orange-500' : 'text-slate-500'}`}>
                            {client.label}
                          </span>
                        </div>
                        <div className={`text-4xl font-black tabular-nums tracking-tighter ${isOverdue ? 'text-emerald-500' : (isDarkMode ? 'text-white' : 'text-slate-900')}`}>
                          {formatTime(client.finishTime)}
                        </div>
                      </div>

                      <button 
                        onClick={() => onRemoveClient(client.id)}
                        className={`p-3 rounded-2xl transition-all ${
                          isOverdue
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20' 
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 hover:text-red-500 hover:bg-red-500/10'
                        }`}
                      >
                        <CheckCircle2 size={24} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                       <button 
                          onClick={() => onAddMinutes(client.id, -1)}
                          className={`flex-1 py-1.5 rounded-xl border flex items-center justify-center transition-all ${isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-500 hover:text-white' : 'border-slate-200 bg-white text-slate-400 hover:text-slate-900'}`}
                       >
                         <MinusCircle size={14} />
                       </button>
                       <button 
                          onClick={() => onAddMinutes(client.id, 1)}
                          className={`flex-1 py-1.5 rounded-xl border flex items-center justify-center transition-all ${isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-500 hover:text-white' : 'border-slate-200 bg-white text-slate-400 hover:text-slate-900'}`}
                       >
                         <PlusCircle size={14} />
                       </button>
                    </div>

                    {isOverdue && (
                      <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500 animate-in fade-in slide-in-from-bottom-1">
                        <CheckCircle2 size={12} /> <span>Заказ можно выдавать</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default WorkloadWidget;
