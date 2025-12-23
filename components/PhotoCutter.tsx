
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Upload, Check, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Maximize2, Minimize2, RotateCcw, RotateCw, Move } from 'lucide-react';
import { PHOTO_VARIANTS, PhotoSpecs } from '../constants';

interface PhotoCutterProps {
  onClose: () => void;
  isDarkMode?: boolean;
  onNotify?: (msg: string, type?: 'success' | 'info') => void;
}

const PhotoCutter: React.FC<PhotoCutterProps> = ({ onClose, isDarkMode, onNotify }) => {
  const [image, setImage] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<PhotoSpecs>(PHOTO_VARIANTS[0]);
  const [crop, setCrop] = useState({ x: 50, y: 50, scale: 1 });
  const [rotation, setRotation] = useState(0); // Базовый поворот (0, 90, 180, 270)
  const [tilt, setTilt] = useState(0); // Тонкий наклон (-45...45)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isImgLoaded, setIsImgLoaded] = useState(false);

  const PREVIEW_SCALE = 8; // Пикселей на мм для интерфейса
  const EXPORT_DPI = 600;  // Высокое качество для печати

  const activeSpecs = useMemo(() => selectedVariant, [selectedVariant]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setIsImgLoaded(false);
        setCrop({ x: 50, y: 50, scale: 1 });
        setRotation(0);
        setTilt(0);
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

  const rotate90 = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const sensitivity = 0.12;
    move(-dx * sensitivity, -dy * sensitivity);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const drawToCanvas = useCallback((canvas: HTMLCanvasElement, specs: PhotoSpecs, currentCrop: typeof crop, baseRotation: number, currentTilt: number, qualityScale: number) => {
    const img = imgRef.current;
    if (!img) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const targetWidth = specs.widthMm * qualityScale;
    const targetHeight = specs.heightMm * qualityScale;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    ctx.save();
    ctx.translate(targetWidth / 2, targetHeight / 2);
    
    // Итоговый угол = базовый поворот + тонкий наклон
    const totalAngle = (baseRotation + currentTilt) * (Math.PI / 180);
    ctx.rotate(totalAngle);

    // Только для ЧБ форматов включаем фильтр (например, военный билет)
    if (specs.isGrayscale) ctx.filter = 'grayscale(100%)';

    const targetAspectRatio = specs.widthMm / specs.heightMm;
    const sHeight = img.height / currentCrop.scale;
    const sWidth = sHeight * targetAspectRatio;
    const sx = (img.width * (currentCrop.x / 100)) - (sWidth / 2);
    const sy = (img.height * (currentCrop.y / 100)) - (sHeight / 2);

    ctx.drawImage(img, sx, sy, sWidth, sHeight, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
    
    ctx.restore();
    ctx.filter = 'none';

    // Линии биометрии (рисуем только на превью)
    if (qualityScale === PREVIEW_SCALE && specs.faceHeightMin > 0) {
      const drawLine = (yMm: number, color: string, isDashed: boolean = false) => {
        const yPx = yMm * qualityScale;
        ctx.beginPath();
        if (isDashed) ctx.setLineDash([4, 4]);
        else ctx.setLineDash([]);
        ctx.moveTo(0, yPx);
        ctx.lineTo(targetWidth, yPx);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      };

      drawLine(specs.topMarginMin, 'rgba(255, 0, 0, 0.7)'); 
      drawLine(specs.topMarginMax, 'rgba(255, 0, 0, 0.3)', true);
      drawLine(specs.topMarginMin + specs.faceHeightMin, 'rgba(0, 0, 255, 0.7)');
      drawLine(specs.topMarginMax + specs.faceHeightMax, 'rgba(0, 0, 255, 0.3)', true);

      // Осевая линия для выравнивания носа/наклона
      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.moveTo(targetWidth / 2, 0);
      ctx.lineTo(targetWidth / 2, targetHeight);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (specs.cornerSide) {
      const cornerSize = targetWidth * 0.28;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      if (specs.cornerSide === 'left') {
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
  }, [imgRef, isImgLoaded]);

  useEffect(() => {
    if (isImgLoaded && canvasRef.current) {
      drawToCanvas(canvasRef.current, activeSpecs, crop, rotation, tilt, PREVIEW_SCALE);
    }
  }, [drawToCanvas, isImgLoaded, activeSpecs, crop, rotation, tilt]);

  const downloadResult = () => {
    const exportCanvas = document.createElement('canvas');
    const exportScale = EXPORT_DPI / 25.4;
    drawToCanvas(exportCanvas, activeSpecs, crop, rotation, tilt, exportScale);
    
    const link = document.createElement('a');
    link.download = `photo_${activeSpecs.id}_${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png', 1.0);
    link.click();
    if (onNotify) onNotify('Фото сохранено в 600 DPI');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className={`w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[95vh] ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
        
        <div className="flex-grow p-4 md:p-8 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950/50 relative overflow-hidden">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10 text-slate-400">
            <X size={28} />
          </button>

          {!image ? (
            <label className="cursor-pointer group flex flex-col items-center">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <Upload size={40} className="text-white" />
              </div>
              <p className="font-black uppercase tracking-tighter">Загрузить фотографию</p>
              <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
            </label>
          ) : (
            <div className="flex flex-col items-center gap-6 w-full">
              <div 
                className="relative shadow-2xl border-4 border-white cursor-move overflow-hidden bg-white"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <canvas ref={canvasRef} />
                <img ref={imgRef} src={image} className="hidden" onLoad={() => setIsImgLoaded(true)} />
              </div>

              {/* ПАНЕЛЬ ТОЧНОЙ НАСТРОЙКИ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                
                {/* Левая часть: Навигация и Поворот */}
                <div className={`p-3 rounded-2xl border flex flex-col gap-3 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Позиция и Поворот</span>
                     <button onClick={rotate90} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-tighter">
                        <RotateCw size={14} /> 90°
                     </button>
                  </div>
                  <div className="flex justify-center gap-2">
                     <button onClick={() => move(0, -0.5)} className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white rounded-xl transition-all"><ChevronUp size={20}/></button>
                     <button onClick={() => move(0, 0.5)} className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white rounded-xl transition-all"><ChevronDown size={20}/></button>
                     <button onClick={() => move(-0.5, 0)} className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white rounded-xl transition-all"><ChevronLeft size={20}/></button>
                     <button onClick={() => move(0.5, 0)} className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white rounded-xl transition-all"><ChevronRight size={20}/></button>
                  </div>
                </div>

                {/* Правая часть: Масштаб и Наклон */}
                <div className={`p-3 rounded-2xl border flex flex-col gap-4 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                   <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Масштаб</span>
                        <span className="text-[10px] font-bold text-blue-500">{Math.round(crop.scale * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Minimize2 size={16} className="text-slate-400" />
                        <input type="range" min="0.1" max="5" step="0.001" value={crop.scale} onChange={(e) => setCrop(prev => ({ ...prev, scale: parseFloat(e.target.value) }))} className="flex-grow h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        <Maximize2 size={16} className="text-slate-400" />
                      </div>
                   </div>
                   
                   <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Угол наклона</span>
                        <span className="text-[10px] font-bold text-blue-500">{tilt}°</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <RotateCcw size={16} className="text-slate-400" />
                        <input type="range" min="-45" max="45" step="0.5" value={tilt} onChange={(e) => setTilt(parseFloat(e.target.value))} className="flex-grow h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        <RotateCw size={16} className="text-slate-400" />
                      </div>
                   </div>
                </div>
              </div>

              <button onClick={() => { setCrop({ x: 50, y: 50, scale: 1 }); setRotation(0); setTilt(0); }} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-500 transition-colors flex items-center gap-2">
                <RotateCcw size={12} /> Сбросить все настройки
              </button>
            </div>
          )}
        </div>

        {/* ПАНЕЛЬ ФОРМАТОВ */}
        <div className={`w-full md:w-80 p-6 flex flex-col border-l ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
          <div className="mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Формат документа</h3>
            <div className="space-y-2 max-h-[40vh] md:max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
              {PHOTO_VARIANTS.map(v => (
                <button 
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`w-full p-3 rounded-xl text-left border-2 transition-all ${
                    selectedVariant.id === v.id 
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
            <button onClick={() => setImage(null)} className="w-full py-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Сменить фото</button>
            <button 
              onClick={downloadResult}
              disabled={!image}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-tighter shadow-xl shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Check size={20} /> Сохранить (600 DPI)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCutter;
