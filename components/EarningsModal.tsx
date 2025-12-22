import React, { useMemo } from 'react';
import { X, TrendingUp, CreditCard, Banknote, Calendar, Wallet } from 'lucide-react';
import { Order } from '../types';

interface EarningsModalProps {
  orders: Order[];
  onClose: () => void;
}

const EarningsModal: React.FC<EarningsModalProps> = ({ orders, onClose }) => {
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

    // Convert to array and sort by date descending (newest first)
    return Object.entries(dailyStats)
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [orders]);

  const todayKey = new Date().toLocaleDateString('ru-RU');
  const todayStats = stats.find(s => s.key === todayKey);
  const historyStats = stats.filter(s => s.key !== todayKey);

  const StatCard = ({ label, value, icon: Icon, colorClass, bgClass }: any) => (
    <div className={`${bgClass} p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm`}>
      <div className={`mb-2 p-2 rounded-full ${colorClass} bg-opacity-10`}>
        <Icon size={20} className={colorClass.replace('text-', 'text-')} />
      </div>
      <div className="text-sm text-slate-500 mb-1 font-medium">{label}</div>
      <div className="text-xl font-bold text-slate-800">{value} ₽</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <h2 className="font-bold text-xl text-slate-800">Статистика доходов</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 flex-grow bg-slate-50/50">
          
          {/* Today's Section */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
              Сегодня ({todayKey})
            </h3>
            
            {todayStats ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl text-white shadow-lg shadow-blue-200 sm:col-span-3 flex justify-between items-center">
                   <div>
                      <p className="text-blue-100 text-sm font-medium mb-1">Всего заработано</p>
                      <p className="text-3xl font-bold">{todayStats.total} ₽</p>
                   </div>
                   <div className="text-right">
                      <p className="text-blue-100 text-xs font-medium bg-blue-400/30 px-3 py-1 rounded-full">
                        {todayStats.count} заказов
                      </p>
                   </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center space-x-3 shadow-sm">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                        <Banknote size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Наличные</p>
                        <p className="text-lg font-bold text-slate-800">{todayStats.cash} ₽</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-purple-100 flex items-center space-x-3 shadow-sm sm:col-span-2">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">По карте</p>
                        <p className="text-lg font-bold text-slate-800">{todayStats.card} ₽</p>
                    </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500">
                Заказов сегодня еще не было
              </div>
            )}
          </div>

          {/* History Section */}
          {historyStats.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">История по дням</h3>
              <div className="space-y-3">
                {historyStats.map((stat) => (
                  <div key={stat.key} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{stat.key}</p>
                        <p className="text-xs text-slate-500">{stat.count} заказов</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-end">
                       <div className="text-right">
                          <div className="flex items-center space-x-1 text-xs text-emerald-600 font-medium">
                            <Banknote size={12} />
                            <span>{stat.cash}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-purple-600 font-medium mt-1">
                            <CreditCard size={12} />
                            <span>{stat.card}</span>
                          </div>
                       </div>
                       <div className="text-xl font-bold text-blue-600 min-w-[80px] text-right">
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
        <div className="p-4 bg-white border-t border-slate-200 rounded-b-2xl flex justify-end">
             <button 
                onClick={onClose}
                className="bg-slate-100 text-slate-700 px-6 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
             >
                Закрыть
             </button>
        </div>
      </div>
    </div>
  );
};

export default EarningsModal;