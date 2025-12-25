import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Upload, Check, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { PHOTO_VARIANTS, PhotoSpecs } from '../constants';

interface PhotoCutterProps {
  onClose: () => void;
  isDarkMode?: boolean;
  onNotify?: (msg: string, type?: 'success' | 'info') => void;
}

const PhotoCutter: React.FC<PhotoCutterProps> = ({ onClose, isDarkMode }) => {
  const [image, setImage] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<PhotoSpecs>(PHOTO_VARIANTS[0]);
  
  // Состояние кадрирования: x, y в процентах (0-100), scale (зум)
  const [crop, setCrop] = useState({ x: 50, y: 50, scale: 1 });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [isCustom] = useState(false);
  const [customWidth] = useState(30);
  const [customHeight] = useState(40);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isImgLoaded, setIsImgLoaded] = useState(false);

  const activeSpecs = useMemo(() => {
    return isCustom ? {
      ...selectedVariant,
      id: 'custom',
      label: 'Свой размер',
      widthMm: customWidth || 1,
      heightMm: customHeight || 1,
      faceHeightMin: 0, faceHeightMax: 0, topMarginMin: 0, topMarginMax: 0
    } : selectedVariant;
  }, [isCustom, selectedVariant, customWidth, customHeight]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setIsImgLoaded(false);
        setCrop({ x: 50, y: 50, scale: 1 });
      };
      reader.readAsDataURL(file);
    }
  };

  const move = (dx: number, dy: number) => {
    setCrop(prev => ({
      ...prev,
      x: Math.min(100, Math.max(0, prev.x + dx)),
      y: Math.min(100, Math.max(0, prev.y + dy))
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    move(-dx * 0.15, -dy * 0.15); // Чувствительность
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // ==========================================
  // 1. ФУНКЦИЯ ОТРИСОВКИ ДЛЯ ЭКРАНА (PREVIEW)
  // ==========================================
  // Здесь рисуем линии разметки, используем низкое разрешение для быстродействия
  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !isImgLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Масштаб для экрана (достаточно 10 пикселей на 1 мм)
    const PREVIEW_SCALE = 10; 
    
    const targetWidth = activeSpecs.widthMm * PREVIEW_SCALE;
    const targetHeight = activeSpecs.heightMm * PREVIEW_SCALE;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Фон
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    if (activeSpecs.isGrayscale) ctx.filter = 'grayscale(100%)';

    // Расчет координат (одинаковый для превью и экспорта)
    const targetAspectRatio = activeSpecs.widthMm / activeSpecs.heightMm;
    const sHeight = img.height / crop.scale;
    const sWidth = sHeight * targetAspectRatio;
    const sx = (img.width * (crop.x / 100)) - (sWidth / 2);
    const sy = (img.height * (crop.y / 100)) - (sHeight / 2);

    // Рисуем изображение
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
    
    ctx.filter = 'none';

    // Рисуем уголок
    if (activeSpecs.cornerSide) {
        const cornerSize = targetWidth * 0.28; 
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        if (activeSpecs.cornerSide === 'left') {
          ctx.moveTo(0, targetHeight - cornerSize);
          ctx.quadraticCurveTo(cornerSize, targetHeight - cornerSize, cornerSize, targetHeight);
          ctx.lineTo(0, targetHeight);
        } else {
          ctx.moveTo(targetWidth, targetHeight - cornerSize);
          ctx.quadraticCurveTo(targetWidth - cornerSize, targetHeight - cornerSize, targetWidth - cornerSize, targetHeight);
          ctx.lineTo(targetWidth, targetHeight);
        }
        ctx.closePath();
        ctx.fill();
    }

    // === ЛИНИИ РАЗМЕТКИ (ТОЛЬКО ЗДЕСЬ) ===
    const drawLine = (yMm: number, color: string, isDashed: boolean = false) => {
      const yPx = yMm * PREVIEW_SCALE;
      ctx.beginPath();
      if (isDashed) ctx.setLineDash([5, 5]);
      else ctx.setLineDash([]);
      
      ctx.moveTo(0, yPx);
      ctx.lineTo(targetWidth, yPx);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    };

    if (activeSpecs.faceHeightMin > 0) {
      // Верхняя граница (Красные)
      drawLine(activeSpecs.topMarginMin, 'rgba(255, 0, 0, 0.8)'); 
      drawLine(activeSpecs.topMarginMax, 'rgba(255, 0, 0, 0.4)', true);
      
      // Нижняя граница (Синие)
      drawLine(activeSpecs.topMarginMin + activeSpecs.faceHeightMin, 'rgba(0, 0, 255, 0.8)');
      drawLine(activeSpecs.topMarginMax + activeSpecs.faceHeightMax, 'rgba(0, 0, 255, 0.4)', true);

      // Центр
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.moveTo(targetWidth / 2, 0);
      ctx.lineTo(targetWidth / 2, targetHeight);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [crop, activeSpecs, isImgLoaded]);

  useEffect(() => {
    requestAnimationFrame(renderPreview);
  }, [renderPreview]);


  // ==========================================
  // 2. ФУНКЦИЯ СОХРАНЕНИЯ В ФАЙЛ (EXPORT)
  // ==========================================
  // ЭТОТ КОД ПОЛНОСТЬЮ ИЗОЛИРОВАН. Сюда НЕВОЗМОЖНО добавить линии случайно.
  const downloadResult = () => {
    const img = imgRef.current;
    if (!img) return;

    const offCanvas = document.createElement('canvas');
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return;

    // МАСШТАБ ЭКСПОРТА (КАЧЕСТВО)
    // 32 пикселя на 1 мм = ~800+ DPI. Это очень высокое качество.
    const EXPORT_SCALE = 32;

    const targetWidth = activeSpecs.widthMm * EXPORT_SCALE;
    const targetHeight = activeSpecs.heightMm * EXPORT_SCALE;

    offCanvas.width = targetWidth;
    offCanvas.height = targetHeight;

    // Белый фон (критично для JPEG)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    if (activeSpecs.isGrayscale) ctx.filter = 'grayscale(100%)';

    // Расчет координат (копия логики из превью, но без рисовки)
    const targetAspectRatio = activeSpecs.widthMm / activeSpecs.heightMm;
    const sHeight = img.height / crop.scale;
    const sWidth = sHeight * targetAspectRatio;
    const sx = (img.width * (crop.x / 100)) - (sWidth / 2);
    const sy = (img.height * (crop.y / 100)) - (sHeight / 2);

    // Рисуем изображение с максимальным сглаживанием
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
    
    ctx.filter = 'none';

    // Рисуем уголок (он нужен на фото)
    if (activeSpecs.cornerSide) {
        const cornerSize = targetWidth * 0.28;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        if (activeSpecs.cornerSide === 'left') {
          ctx.moveTo(0, targetHeight - cornerSize);
          ctx.quadraticCurveTo(cornerSize, targetHeight - cornerSize, cornerSize, targetHeight);
          ctx.lineTo(0, targetHeight);
        } else {
          ctx.moveTo(targetWidth, targetHeight - cornerSize);
          ctx.quadraticCurveTo(targetWidth - cornerSize, targetHeight - cornerSize, targetWidth - cornerSize, targetHeight);
          ctx.lineTo(targetWidth, targetHeight);
        }
        ctx.closePath();
        ctx.fill();
    }

    // !!! В ЭТОЙ ФУНКЦИИ НЕТ КОДА ДЛЯ РИСОВАНИЯ ЛИНИЙ !!!

    // Сохранение
    const link = document.createElement('a');
    link.download = `photo_${activeSpecs.id}_${Date.now()}.jpg`;
    // Качество 1.0 (максимум), формат JPEG
    link.href = offCanvas.toDataURL('image/jpeg', 1.0); 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className={`w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
        
        {/* Рабочая область */}
        <div className="flex-grow p-6 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950/50 relative overflow-hidden">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10">
            <X size={24} />
          </button>

          {!image ? (
            <label className="cursor-pointer group flex flex-col items-center">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <Upload size={40} className="text-white" />
              </div>
              <p className="font-black uppercase tracking-tighter">Загрузить фото</p>
              <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
            </label>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div 
                className="relative shadow-2xl border-4 border-white cursor-move overflow-hidden bg-white"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <canvas ref={canvasRef} style={{ maxHeight: '50vh', maxWidth: '100%', objectFit: 'contain' }} />
                <img 
                  ref={imgRef}
                  src={image} 
                  className="hidden" 
                  onLoad={() => setIsImgLoaded(true)} 
                />
              </div>

              {/* Управление */}
              <div className="flex flex-wrap justify-center gap-4 w-full max-w-md">
                <div className={`p-2 rounded-2xl flex items-center gap-2 border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                   <button onClick={() => move(0, -0.5)} className="p-2 hover:bg-blue-600 hover:text-white rounded-xl transition-all"><ChevronUp size={20} /></button>
                   <button onClick={() => move(0, 0.5)} className="p-2 hover:bg-blue-600 hover:text-white rounded-xl transition-all"><ChevronDown size={20} /></button>
                   <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                   <button onClick={() => move(-0.5, 0)} className="p-2 hover:bg-blue-600 hover:text-white rounded-xl transition-all"><ChevronLeft size={20} /></button>
                   <button onClick={() => move(0.5, 0)} className="p-2 hover:bg-blue-600 hover:text-white rounded-xl transition-all"><ChevronRight size={20} /></button>
                </div>

                <div className={`p-2 rounded-2xl flex items-center gap-3 border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <button 
                    onClick={() => setCrop(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.02) }))}
                    className="p-2 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                  ><Minimize2 size={20}/></button>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="3" 
                    step="0.001" 
                    value={crop.scale} 
                    onChange={(e) => setCrop(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                    className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <button 
                    onClick={() => setCrop(prev => ({ ...prev, scale: prev.scale + 0.02 }))}
                    className="p-2 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                  ><Maximize2 size={20}/></button>
                </div>

                <button 
                  onClick={() => setCrop({ x: 50, y: 50, scale: 1 })}
                  className={`p-3 rounded-2xl border shadow-sm transition-all hover:bg-orange-500 hover:text-white ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                  title="Сброс позиции"
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Панель настроек */}
        <div className={`w-full md:w-80 p-6 flex flex-col border-l ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
          <div className="mb-8 flex-grow">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Формат документа</h3>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
              {PHOTO_VARIANTS.map(v => (
                <button 
                  key={v.id}
                  onClick={() => {
                    setSelectedVariant(v);
                  }}
                  className={`w-full p-3 rounded-xl text-left border-2 transition-all ${
                    !isCustom && selectedVariant.id === v.id 
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className={`font-bold text-sm ${selectedVariant.id === v.id ? 'text-blue-600 dark:text-blue-400' : ''}`}>{v.label}</p>
                  <p className="text-[10px] text-slate-500">{v.widthMm} x {v.heightMm} мм</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t dark:border-slate-800 border-slate-100 space-y-3">
            <button 
              onClick={() => setImage(null)}
              className={`w-full py-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors`}
            >
              Сменить фотографию
            </button>
            <button 
              onClick={downloadResult}
              disabled={!image}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-tighter shadow-xl shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              <Check size={20} />
              <span>Сохранить JPG (HQ)</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 font-bold">
               Размер файла: ~800 DPI (Максимальное качество)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCutter;