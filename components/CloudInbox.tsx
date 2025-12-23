
import React, { useState } from 'react';
import { X, QrCode, Upload, Download, FileText, ImageIcon, Trash2, CheckCircle } from 'lucide-react';

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

const CloudInbox: React.FC<CloudInboxProps> = ({ onClose, isDarkMode, onNotify }) => {
  const [files, setFiles] = useState<ReceivedFile[]>([]);
  const [isQrVisible, setIsQrVisible] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // FIX: Cast to File[] to ensure the compiler recognizes the properties of individual file objects
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
      <div className={`w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] transition-colors ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
        
        {/* Left: QR & Upload (Simulating Client Side) */}
        <div className={`flex-[1.2] p-8 flex flex-col items-center justify-center text-center ${isDarkMode ? 'bg-slate-900/50' : 'bg-blue-50/50'}`}>
          <div className="mb-6">
            <div className={`p-4 rounded-3xl inline-block mb-4 shadow-xl ${isDarkMode ? 'bg-white' : 'bg-white border-8 border-white'}`}>
              {/* Fake QR Code */}
              <div className="w-32 h-32 bg-slate-100 flex items-center justify-center relative overflow-hidden group">
                 <QrCode size={100} className="text-slate-800" />
                 <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-transparent transition-colors"></div>
              </div>
            </div>
            <h3 className={`text-lg font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Загрузка по QR</h3>
            <p className="text-xs text-slate-500 font-medium max-w-[200px] mt-2">Клиент может сканировать код и скинуть файлы сразу со своего телефона</p>
          </div>

          <label className="w-full">
            <div className={`flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${isDarkMode ? 'border-slate-700 hover:border-blue-500 hover:bg-slate-800 text-slate-400' : 'border-blue-200 hover:border-blue-500 hover:bg-white text-blue-600'}`}>
              <Upload size={20} />
              <span className="font-black uppercase tracking-tighter text-sm">Выбрать файлы</span>
            </div>
            <input type="file" multiple className="hidden" onChange={handleFileChange} />
          </label>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">Поддержка массовой загрузки</p>
        </div>

        {/* Right: Inbox List */}
        <div className="flex-[2] p-6 flex flex-col bg-transparent overflow-hidden">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center space-x-2">
                <CheckCircle className="text-emerald-500" size={20} />
                <h2 className={`text-xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Принятые файлы</h2>
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{files.length}</span>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
               <X size={24} />
             </button>
          </div>

          <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {files.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 dark:text-white">
                 <FileText size={48} className="mb-4" />
                 <p className="font-black uppercase tracking-tighter">Ожидание файлов...</p>
                 <p className="text-xs">Здесь появятся фото после загрузки</p>
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
                   
                   <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => downloadFile(file)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Скачать на диск"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => removeFile(file.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={18} />
                      </button>
                   </div>
                </div>
              ))
            )}
          </div>

          {files.length > 0 && (
            <div className="mt-4 pt-4 border-t dark:border-slate-700 border-slate-100">
               <button 
                onClick={() => {
                  files.forEach(f => downloadFile(f));
                  onNotify('Все файлы отправлены в загрузку', 'success');
                }}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-tighter shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
               >
                 <Download size={18} />
                 <span>Скачать всё архивом</span>
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloudInbox;
