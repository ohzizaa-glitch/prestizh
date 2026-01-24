
import React, { useRef } from 'react';
import { X, Download, LayoutTemplate, Ruler } from 'lucide-react';
import { PHOTO_VARIANTS, PhotoSpecs } from '../constants';

interface TemplatesModalProps {
  onClose: () => void;
  isDarkMode: boolean;
  onNotify: (msg: string, type?: 'success' | 'info') => void;
}

const TemplatesModal: React.FC<TemplatesModalProps> = ({ onClose, isDarkMode, onNotify }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateAndDownload = (variant: PhotoSpecs) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 600 DPI Setting
    const PPCM = 23.622;
    const widthPx = Math.round(variant.widthMm * PPCM);
    const heightPx = Math.round(variant.heightMm * PPCM);

    canvas.width = widthPx;
    canvas.height = heightPx;

    // Clear canvas (Transparent background)
    ctx.clearRect(0, 0, widthPx, heightPx);

    // Settings for lines
    const lineWidth = Math.max(2, Math.round(0.2 * PPCM)); // Bold lines
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'butt';

    // 1. Draw Border (Black)
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(0, 0, widthPx, heightPx);

    // Helper to draw dashed line
    const drawLine = (yMm: number, color: string) => {
      const yPx = Math.round(yMm * PPCM);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.setLineDash([lineWidth * 2, lineWidth * 2]); // Dashed
      ctx.moveTo(0, yPx);
      ctx.lineTo(widthPx, yPx);
      ctx.stroke();
      ctx.setLineDash([]); // Reset
    };

    // 2. Draw Guides
    if (variant.faceHeightMin > 0) {
      // Top Margin Area (Red)
      drawLine(variant.topMarginMin, '#ff0000');
      drawLine(variant.topMarginMax, '#ff0000');

      // Face Height Area (from top margin min/max + face height)
      // Bottom line of face (Chin position relative to top margin)
      // We draw lines representing where the chin should be ideally relative to crown
      
      // Crown line is the Top Margin lines.
      // Chin lines:
      const chinMinY = variant.topMarginMin + variant.faceHeightMin;
      const chinMaxY = variant.topMarginMax + variant.faceHeightMax;

      drawLine(chinMinY, '#0000ff');
      drawLine(chinMaxY, '#0000ff');
    }

    // 3. Center Line
    ctx.beginPath();
    ctx.strokeStyle = '#000000';
    ctx.setLineDash([lineWidth * 3, lineWidth * 3]);
    ctx.moveTo(widthPx / 2, 0);
    ctx.lineTo(widthPx / 2, heightPx);
    ctx.stroke();
    
    // 4. Corner (if applicable)
    if (variant.cornerSide) {
        const cornerSize = widthPx * 0.28; 
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; // Semi-transparent fill for corner
        ctx.beginPath();
        if (variant.cornerSide === 'left') {
          ctx.moveTo(0, heightPx - cornerSize);
          ctx.quadraticCurveTo(cornerSize, heightPx - cornerSize, cornerSize, heightPx);
          ctx.lineTo(0, heightPx);
        } else {
          ctx.moveTo(widthPx, heightPx - cornerSize);
          ctx.quadraticCurveTo(widthPx - cornerSize, heightPx - cornerSize, widthPx - cornerSize, heightPx);
          ctx.lineTo(widthPx, heightPx);
        }
        ctx.closePath();
        ctx.fill();
    }

    // Download
    const filename = `Template_${variant.widthMm}x${variant.heightMm}_${variant.id}.png`;
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onNotify(`Шаблон ${variant.widthMm}x${variant.heightMm} скачан`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] transition-colors ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex justify-between items-center rounded-t-2xl ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-pink-900/30 text-pink-400' : 'bg-pink-100 text-pink-600'}`}>
              <LayoutTemplate size={20} />
            </div>
            <div>
              <h2 className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Шаблоны для Photoshop</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Прозрачные PNG (600 DPI) с разметкой</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className={`overflow-y-auto p-5 flex-grow custom-scrollbar ${isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50/50'}`}>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PHOTO_VARIANTS.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => generateAndDownload(variant)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all group text-left ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 hover:border-pink-500 hover:bg-slate-700' 
                      : 'bg-white border-slate-200 hover:border-pink-500 hover:shadow-lg hover:shadow-pink-500/5'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 border-dashed ${isDarkMode ? 'border-slate-600 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
                        <Ruler size={18} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-sm ${isDarkMode ? 'text-slate-200 group-hover:text-white' : 'text-slate-700 group-hover:text-pink-600'}`}>
                        {variant.label.split('(')[0]}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {variant.widthMm} x {variant.heightMm} мм {variant.label.includes('(') ? `• ${variant.label.split('(')[1].replace(')', '')}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-400 group-hover:text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-600'}`}>
                    <Download size={20} />
                  </div>
                </button>
              ))}
           </div>
           
           <div className={`mt-6 p-4 rounded-xl text-xs leading-relaxed ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-blue-50 text-blue-800'}`}>
              <strong>Справка:</strong> Скачивается прозрачный PNG файл. 
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li><span className="text-red-500 font-bold">Красные линии</span> — минимальный и максимальный отступ от макушки.</li>
                <li><span className="text-blue-500 font-bold">Синие линии</span> — зона подбородка (при соблюдении отступа макушки).</li>
                <li>Черная рамка — границы обрезки.</li>
              </ul>
              Используйте как слой-наложение в графическом редакторе.
           </div>
        </div>

        {/* Hidden Canvas for generation */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default TemplatesModal;
