
import React, { useMemo } from 'react';
import { X, TrendingUp, CreditCard, Banknote, Calendar } from 'lucide-react';
import { Order } from '../types';

interface EarningsModalProps {
  orders: Order[];
  onClose: () => void;
  isDarkMode: boolean;
}

const EarningsModal: React.FC<EarningsModalProps> = ({ orders, onClose, isDarkMode }) => {
  const stats = useMemo(() => {
    const dailyStats: Record<string, { total: number; cash: number; card: number; count: number; date: Date }> = {};

    orders.forEach(order => {
      const date = new Date(order.timestamp);
      const dateKey = date.toLocaleDateString('ru-RU');
      
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { total: 0, cash: 0, card: 0, count: 0, date };
      }
      
      dailyStats[dateKey].total += order.totalAmount;
      dailyStats[dateKey].count += 1;
      if (order.paymentMethod === 'cash') dailyStats[dateKey].cash += order.totalAmount;
      if (order.paymentMethod === 'card') dailyStats[dateKey].card += order.totalAmount;
    });

    return Object.entries(dailyStats)
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [orders]);

  const todayKey = new Date().toLocaleDateString('ru-RU');
  const todayStats = stats.find(s => s.key === todayKey);
  const historyStats = stats.filter(s => s.key !== todayKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] transition-colors ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex justify-between items-center rounded-t-2xl ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
              <TrendingUp size={20} />
            </div>
            <h2 className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Статистика доходов</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className={`overflow-y-auto p-5 flex-grow ${isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50/50'}`}>
          
          {/* Today's Section */}
          <div className="mb-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
              Сегодня ({todayKey})
            </h3>
            
            {todayStats ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl text-white shadow-xl shadow-blue-500/20 sm:col-span-3 flex justify-between items-center">
                   <div>
                      <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Всего заработано</p>
                      <p className="text-4xl font-black tracking-tighter">{todayStats.total} ₽</p>
                   </div>
                   <div className="text-right">
                      <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest bg-blue-400/30 px-3 py-1.5 rounded-full">
                        {todayStats.count} заказов
                      </p>
                   </div>
                </div>

                <div className={`p-4 rounded-xl flex items-center space-x-3 shadow-sm border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-50'}`}>
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                        <Banknote size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Наличные</p>
                        <p className={`text-lg font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{todayStats.cash} ₽</p>
                    </div>
                </div>

                <div className={`p-4 rounded-xl flex items-center space-x-3 shadow-sm border transition-colors sm:col-span-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-purple-50'}`}>
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">По карте</p>
                        <p className={`text-lg font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{todayStats.card} ₽</p>
                    </div>
                </div>
              </div>
            ) : (
              <div className={`p-8 rounded-2xl border border-dashed text-center transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-white border-slate-300 text-slate-400'}`}>
                <p className="font-black uppercase tracking-tighter">Заказов сегодня еще не было</p>
              </div>
            )}
          </div>

          {/* History Section */}
          {historyStats.length > 0 && (
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">История по дням</h3>
              <div className="space-y-3">
                {historyStats.map((stat) => (
                  <div key={stat.key} className={`p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 hover:shadow-md transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className={`font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{stat.key}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{stat.count} заказов</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-end">
                       <div className="text-right">
                          <div className="flex items-center space-x-1 text-xs text-emerald-600 font-bold">
                            <Banknote size={12} />
                            <span>{stat.cash}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-purple-600 font-bold mt-1">
                            <CreditCard size={12} />
                            <span>{stat.card}</span>
                          </div>
                       </div>
                       <div className={`text-xl font-black min-w-[80px] text-right tracking-tighter ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          {stat.total} ₽
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t rounded-b-2xl flex justify-end transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
             <button 
                onClick={onClose}
                className={`px-8 py-2 rounded-xl font-black uppercase tracking-tighter text-sm transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
             >
                Закрыть
             </button>
        </div>
      </div>
    </div>
  );
};

export default EarningsModal;
