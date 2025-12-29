
import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Plus, Trash2, RotateCcw, Sun, Moon as MoonIcon, Check } from 'lucide-react';

interface TodoTask {
  id: string;
  text: string;
  completed: boolean;
  section: 'start' | 'end';
}

interface TodoListModalProps {
  onClose: () => void;
  isDarkMode: boolean;
}

const TodoListModal: React.FC<TodoListModalProps> = ({ onClose, isDarkMode }) => {
  const [tasks, setTasks] = useState<TodoTask[]>(() => {
    try {
      const saved = localStorage.getItem('prestige_todo_list');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [inputStart, setInputStart] = useState('');
  const [inputEnd, setInputEnd] = useState('');

  useEffect(() => {
    localStorage.setItem('prestige_todo_list', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (section: 'start' | 'end', text: string) => {
    if (!text.trim()) return;
    const newTask: TodoTask = {
      id: Date.now().toString() + Math.random(),
      text: text.trim(),
      completed: false,
      section
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleKeyDown = (e: React.KeyboardEvent, section: 'start' | 'end') => {
    if (e.key === 'Enter') {
      if (section === 'start') {
        addTask('start', inputStart);
        setInputStart('');
      } else {
        addTask('end', inputEnd);
        setInputEnd('');
      }
    }
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    if (confirm('Удалить этот пункт навсегда?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const resetDaily = () => {
    if (confirm('Сбросить выполнение всех задач? (Список останется, галочки снимутся)')) {
      setTasks(prev => prev.map(t => ({ ...t, completed: false })));
    }
  };

  const renderSection = (title: string, section: 'start' | 'end', inputValue: string, setInput: (v: string) => void, icon: React.ReactNode) => {
    const sectionTasks = tasks.filter(t => t.section === section);
    const completedCount = sectionTasks.filter(t => t.completed).length;
    const totalCount = sectionTasks.length;
    const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

    return (
      <div className={`flex-1 flex flex-col rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
        {/* Section Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
           <div className="flex items-center gap-2">
             {icon}
             <h3 className={`font-black uppercase tracking-tight text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
           </div>
           <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
             {completedCount} / {totalCount}
           </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 w-full bg-slate-200 dark:bg-slate-700">
           <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>

        {/* List */}
        <div className="flex-grow overflow-y-auto p-2 space-y-2 min-h-[200px] max-h-[400px] custom-scrollbar">
          {sectionTasks.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-slate-400 opacity-50">
               <p className="text-xs font-bold uppercase">Список пуст</p>
            </div>
          ) : (
            sectionTasks.map(task => (
              <div 
                key={task.id} 
                className={`group flex items-center gap-3 p-3 rounded-xl transition-all border ${
                  task.completed 
                    ? (isDarkMode ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100') 
                    : (isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 hover:border-blue-200')
                }`}
              >
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    task.completed 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : (isDarkMode ? 'border-slate-600 hover:border-blue-400' : 'border-slate-300 hover:border-blue-400')
                  }`}
                >
                  {task.completed && <Check size={14} strokeWidth={4} />}
                </button>
                
                <span className={`flex-grow text-sm font-medium transition-all ${
                  task.completed 
                    ? 'text-emerald-600/70 dark:text-emerald-400/50 line-through decoration-2' 
                    : (isDarkMode ? 'text-slate-200' : 'text-slate-700')
                }`}>
                  {task.text}
                </span>

                <button 
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all"
                  title="Удалить пункт"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className={`p-3 border-t ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
           <div className="relative">
             <input 
               type="text" 
               value={inputValue}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => handleKeyDown(e, section)}
               placeholder="Добавить задачу..."
               className={`w-full pl-3 pr-10 py-2.5 rounded-xl text-sm font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'}`}
             />
             <button 
               onClick={() => {
                 if (section === 'start') { addTask('start', inputStart); setInputStart(''); }
                 else { addTask('end', inputEnd); setInputEnd(''); }
               }}
               className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
             >
               <Plus size={16} />
             </button>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col h-[85vh] transition-colors ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex justify-between items-center rounded-t-2xl flex-shrink-0 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-violet-900/30 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
              <CheckSquare size={20} />
            </div>
            <h2 className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Список дел (Чек-лист)</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={resetDaily}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${isDarkMode ? 'border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-400' : 'border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-600'}`}
              title="Снять все галочки"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Новая смена</span>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content - Two Columns */}
        <div className={`flex-grow overflow-y-auto p-4 sm:p-6 ${isDarkMode ? 'bg-slate-950/30' : 'bg-slate-50/50'}`}>
           <div className="flex flex-col md:flex-row gap-6 h-full">
              {renderSection(
                'Начало смены', 
                'start', 
                inputStart, 
                setInputStart, 
                <Sun size={18} className="text-orange-500" />
              )}
              {renderSection(
                'Конец смены', 
                'end', 
                inputEnd, 
                setInputEnd, 
                <MoonIcon size={18} className="text-blue-500" />
              )}
           </div>
        </div>
        
      </div>
    </div>
  );
};

export default TodoListModal;
