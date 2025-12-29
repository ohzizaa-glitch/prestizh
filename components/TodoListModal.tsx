
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
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [inputStart, setInputStart] = useState('');
  const [inputEnd, setInputEnd] = useState('');

  // Загрузка данных
  useEffect(() => {
    const saved = localStorage.getItem('prestige_todo_list_v2');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        setTasks([]);
      }
    }
  }, []);

  // Сохранение данных
  useEffect(() => {
    localStorage.setItem('prestige_todo_list_v2', JSON.stringify(tasks));
  }, [tasks]);

  // Добавление задачи
  const handleAdd = (section: 'start' | 'end') => {
    const val = section === 'start' ? inputStart : inputEnd;
    if (!val.trim()) return;

    const newTask: TodoTask = {
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      text: val.trim(),
      completed: false,
      section: section
    };

    setTasks(prev => [...prev, newTask]);
    if (section === 'start') setInputStart('');
    else setInputEnd('');
  };

  // Удаление задачи (БЕЗ подтверждения для гарантии работы)
  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Переключение статуса
  const handleToggle = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Сброс смены (БЕЗ подтверждения для гарантии работы)
  const handleReset = () => {
    setTasks(prev => prev.map(t => ({ ...t, completed: false })));
  };

  const renderSection = (title: string, section: 'start' | 'end', icon: React.ReactNode) => {
    const currentTasks = tasks.filter(t => t.section === section);
    const inputValue = section === 'start' ? inputStart : inputEnd;
    const setInputValue = section === 'start' ? setInputStart : setInputEnd;

    return (
      <div className={`flex-1 flex flex-col rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-2">
            {icon}
            <span className={`font-black uppercase text-xs tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{title}</span>
          </div>
          <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full">
            {currentTasks.filter(t => t.completed).length} / {currentTasks.length}
          </span>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[450px] custom-scrollbar">
          {currentTasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
              <p className="text-xs font-bold uppercase">Список пуст</p>
            </div>
          ) : (
            currentTasks.map(task => (
              <div 
                key={task.id} 
                className={`flex items-center gap-2 transition-all`}
              >
                {/* Кнопка переключения (Основная часть) */}
                <button
                  type="button"
                  onClick={() => handleToggle(task.id)}
                  className={`flex-grow flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                    task.completed 
                    ? (isDarkMode ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
                    : (isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-200 hover:border-blue-500' : 'bg-white border-slate-100 text-slate-700 hover:border-blue-400 shadow-sm')
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-400'}`}>
                    {task.completed && <Check size={12} strokeWidth={4} />}
                  </div>
                  <span className={`text-sm font-bold ${task.completed ? 'line-through opacity-50' : ''}`}>
                    {task.text}
                  </span>
                </button>

                {/* Кнопка удаления (Абсолютно независимая) */}
                <button
                  type="button"
                  onClick={() => handleDelete(task.id)}
                  className={`p-3 rounded-2xl transition-colors flex-shrink-0 ${
                    isDarkMode ? 'bg-slate-700 text-slate-400 hover:bg-red-900/40 hover:text-red-400' : 'bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500'
                  }`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className={`p-4 border-t ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
          <form 
            onSubmit={(e) => { e.preventDefault(); handleAdd(section); }}
            className="flex gap-2"
          >
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Что нужно сделать?"
              className={`flex-grow px-4 py-3 rounded-xl text-sm font-bold outline-none border-2 transition-all ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'
              }`}
            />
            <button 
              type="submit"
              disabled={!inputValue.trim()}
              className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Plus size={24} />
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className={`w-full max-w-5xl rounded-[2.5rem] shadow-2xl flex flex-col h-[85vh] overflow-hidden ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        
        <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-xl shadow-blue-500/30">
              <CheckSquare size={28} />
            </div>
            <div>
              <h2 className={`text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Чек-лист смены</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Контроль процессов</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleReset}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                isDarkMode 
                ? 'border-slate-700 text-slate-300 hover:border-orange-500 hover:text-orange-400 hover:bg-orange-500/10' 
                : 'border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50'
              }`}
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Новая смена</span>
            </button>
            <button 
              type="button"
              onClick={onClose}
              className={`p-3 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <X size={28} />
            </button>
          </div>
        </div>

        <div className={`flex-grow p-4 md:p-8 overflow-hidden ${isDarkMode ? 'bg-slate-950/40' : 'bg-slate-50'}`}>
          <div className="flex flex-col md:flex-row gap-8 h-full">
            {renderSection('Открытие', 'start', <Sun className="text-orange-500" size={20}/>)}
            {renderSection('Закрытие', 'end', <MoonIcon className="text-blue-500" size={20}/>)}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TodoListModal;
