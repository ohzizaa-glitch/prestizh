import React, { useState, useEffect } from 'react';
import { X, QrCode, Upload, Download, FileText, Trash2, CheckCircle, Settings, MessageCircle, Mail, Smartphone, Save } from 'lucide-react';

interface ReceivedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  timestamp: number;
}

interface CloudInboxProps {
  onClose: () => void;
  isDarkMode: boolean;
  onNotify: (msg: string, type?: 'success' | 'info') => void;
}

type ContactMethod = 'telegram' | 'whatsapp' | 'email' | 'link';

const CloudInbox: React.FC<CloudInboxProps> = ({ onClose, isDarkMode, onNotify }) => {
  const [files, setFiles] = useState<ReceivedFile[]>([]);
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  // Settings State
  const [method, setMethod] = useState<ContactMethod>('telegram');
  const [contactValue, setContactValue] = useState('');

  // Load settings on mount
  useEffect(() => {
    const savedMethod = localStorage.getItem('prestige_contact_method') as ContactMethod;
    const savedValue = localStorage.getItem('prestige_contact_value');
    if (savedMethod) setMethod(savedMethod);
    if (savedValue) setContactValue(savedValue);
    
    // If no settings, open config mode automatically
    if (!savedValue) setIsConfiguring(true);
  }, []);

  const saveSettings = () => {
    localStorage.setItem('prestige_contact_method', method);
    localStorage.setItem('prestige_contact_value', contactValue);
    setIsConfiguring(false);
    onNotify('Настройки QR-кода сохранены');
  };

  const getQrData = () => {
    if (!contactValue) return '';
    switch (method) {
      case 'telegram':
        // Удаляем @ если есть
        const tgUser = contactValue.replace('@', '').replace('https://t.me/', '');
        return `https://t.me/${tgUser}`;
      case 'whatsapp':
        // Оставляем только цифры
        const waPhone = contactValue.replace(/\D/g, '');
        return `https://wa.me/${waPhone}`;
      case 'email':
        return `mailto:${contactValue}`;
      case 'link':
        return contactValue.startsWith('http') ? contactValue : `https://${contactValue}`;
      default:
        return '';
    }
  };

  const qrData = getQrData();
  const qrImageUrl = qrData 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&bgcolor=${isDarkMode ? '1e293b' : 'ffffff'}&color=${isDarkMode ? 'ffffff' : '000000'}&margin=10`
    : '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []) as File[];
    if (newFiles.length === 0) return;

    const received: ReceivedFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type,
      url: URL.createObjectURL(file),
      timestamp: Date.now()
    }));

    setFiles(prev => [...received, ...prev]);
    onNotify(`Добавлено файлов: ${received.length}`, 'success');
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const downloadFile = (file: ReceivedFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] transition-colors ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
        
        {/* Left: QR & Configuration */}
        <div className={`flex-[1.2] p-8 flex flex-col items-center justify-center text-center relative ${isDarkMode ? 'bg-slate-900/50' : 'bg-blue-50/50'}`}>
          
          <button 
            onClick={() => setIsConfiguring(!isConfiguring)}
            className={`absolute top-4 left-4 p-2 rounded-xl transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-500 hover:bg-white hover:text-blue-600'}`}
            title="Настроить QR-код"
          >
            <Settings size={20} />
          </button>

          {isConfiguring ? (
            <div className="w-full max-w-xs animate-in fade-in zoom-in duration-200">
              <h3 className={`text-lg font-black uppercase tracking-tighter mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Настройка приема</h3>
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                <button 
                  onClick={() => setMethod('telegram')} 
                  className={`p-3 rounded-xl flex items-center justify-center transition-all ${method === 'telegram' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}
                  title="Telegram"
                >
                  <MessageCircle size={24} />
                </button>
                <button 
                  onClick={() => setMethod('whatsapp')} 
                  className={`p-3 rounded-xl flex items-center justify-center transition-all ${method === 'whatsapp' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}
                  title="WhatsApp"
                >
                  <Smartphone size={24} />
                </button>
                <button 
                  onClick={() => setMethod('email')} 
                  className={`p-3 rounded-xl flex items-center justify-center transition-all ${method === 'email' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}
                  title="Email"
                >
                  <Mail size={24} />
                </button>
                <button 
                  onClick={() => setMethod('link')} 
                  className={`p-3 rounded-xl flex items-center justify-center transition-all ${method === 'link' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}
                  title="Своя ссылка"
                >
                  <QrCode size={24} />
                </button>
              </div>

              <div className="mb-6">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1 block text-left">
                  {method === 'telegram' && 'Имя пользователя (@username)'}
                  {method === 'whatsapp' && 'Номер телефона (7999...)'}
                  {method === 'email' && 'Email адрес'}
                  {method === 'link' && 'Ссылка на файлообменник'}
                </label>
                <input 
                  type="text" 
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  placeholder={method === 'telegram' ? '@prestige_photo' : method === 'whatsapp' ? '79001234567' : 'studio@mail.ru'}
                  className={`w-full px-4 py-3 rounded-xl font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 focus:border-blue-500 text-white' : 'bg-white border-slate-200 focus:border-blue-500 text-slate-800'}`}
                />
              </div>

              <button 
                onClick={saveSettings}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-tighter shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />
                <span>Сохранить код</span>
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 relative group">
                {qrData ? (
                   <div className={`p-4 rounded-3xl inline-block mb-4 shadow-xl overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                     <img src={qrImageUrl} alt="QR Code" className="w-48 h-48 object-contain rounded-xl" />
                   </div>
                ) : (
                   <div className={`w-56 h-56 rounded-3xl flex flex-col items-center justify-center mb-4 border-4 border-dashed ${isDarkMode ? 'border-slate-700 text-slate-600' : 'border-slate-300 text-slate-400'}`}>
                      <QrCode size={64} className="mb-2 opacity-50" />
                      <span className="font-bold text-sm">QR не настроен</span>
                      <button onClick={() => setIsConfiguring(true)} className="text-blue-500 text-xs font-black uppercase mt-2 hover:underline">Настроить</button>
                   </div>
                )}
                
                <h3 className={`text-xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {method === 'telegram' && 'Telegram'}
                  {method === 'whatsapp' && 'WhatsApp'}
                  {method === 'email' && 'Почта'}
                  {method === 'link' && 'Ссылка'}
                </h3>
                <p className="text-xs text-slate-500 font-medium max-w-[240px] mt-2 mx-auto">
                   Клиент сканирует код → Отправляет фото в чат → Вы сохраняете их на ПК → Добавляете в заказ кнопкой ниже.
                </p>
              </div>

              <label className="w-full max-w-xs">
                <div className={`flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer group ${isDarkMode ? 'border-slate-600 hover:border-blue-500 hover:bg-slate-800 text-slate-300' : 'border-blue-300 hover:border-blue-600 hover:bg-white text-blue-700 bg-white/50'}`}>
                  <Upload size={20} className="group-hover:-translate-y-1 transition-transform" />
                  <span className="font-black uppercase tracking-tighter text-sm">Выбрать файлы с ПК</span>
                </div>
                <input type="file" multiple className="hidden" onChange={handleFileChange} />
              </label>
            </>
          )}
        </div>

        {/* Right: Inbox List */}
        <div className={`flex-[2] p-6 flex flex-col overflow-hidden relative ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-6 z-10">
             <div className="flex items-center space-x-2">
                <CheckCircle className="text-emerald-500" size={20} />
                <h2 className={`text-xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Загруженные файлы</h2>
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{files.length}</span>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
               <X size={24} />
             </button>
          </div>

          <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar z-10">
            {files.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 dark:text-white">
                 <FileText size={48} className="mb-4" />
                 <p className="font-black uppercase tracking-tighter">Ожидание файлов...</p>
                 <p className="text-xs max-w-[200px]">Нажмите кнопку выбора файлов после того, как клиент пришлет их вам</p>
              </div>
            ) : (
              files.map(file => (
                <div key={file.id} className={`group flex items-center justify-between p-3 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900/50 border-slate-700 hover:border-blue-500' : 'bg-slate-50 border-slate-100 hover:border-blue-500 hover:bg-white hover:shadow-lg hover:shadow-blue-500/5'}`}>
                   <div className="flex items-center space-x-3 overflow-hidden">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        {file.type.startsWith('image/') ? (
                           <img src={file.url} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                           <FileText size={20} className="text-slate-400" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{file.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{file.size}</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => downloadFile(file)}
                        className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}
                        title="Скачать"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => removeFile(file.id)}
                        className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-500 hover:text-red-500' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}
                        title="Удалить"
                      >
                        <Trash2 size={18} />
                      </button>
                   </div>
                </div>
              ))
            )}
          </div>
          
          <div className={`mt-6 pt-6 border-t z-10 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
               Файлы хранятся временно до закрытия вкладки
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudInbox;