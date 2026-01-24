
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Upload, Check, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Maximize2, Minimize2, RotateCcw, RotateCw, RotateCcw as RotateLeftIcon, Grid } from 'lucide-react';
import { PHOTO_VARIANTS, PhotoSpecs } from '../constants';

interface PhotoCutterProps {
  onClose: () => void;
  isDarkMode?: boolean;
  onNotify?: (msg: string, type?: 'success' | 'info') => void;
}

const PhotoCutter: React.FC<PhotoCutterProps> = ({ onClose, isDarkMode, onNotify }) => {
  const [image, setImage] = useState<string | null>(null);
  const [originalFilename, setOriginalFilename] = useState<string>('photo');
  
  const [selectedVariant, setSelectedVariant] = useState<PhotoSpecs>(PHOTO_VARIANTS[0]);
  
  // Состояние: x, y в процентах от размера ИЗОБРАЖЕНИЯ (50 = центр), scale (зум), rotation (градусы)
  const [crop, setCrop] = useState({ x: 50, y: 50, scale: 1, rotation: 0 });
  const [showGrid, setShowGrid] = useState(false); // New: Grid state
  
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
      // Сохраняем имя файла без расширения
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setOriginalFilename(nameWithoutExt);

      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setIsImgLoaded(false);
        setCrop({ x: 50, y: 50, scale: 1, rotation: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Функция перемещения.
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
    
    // Чувствительность движения (инвертированная, чтобы "тянуть" фото)
    // При зуме нужно уменьшать скорость
    const sensitivity = 0.15 / crop.scale; 
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // Корректируем вектор движения в зависимости от угла поворота
    const rad = -crop.rotation * Math.PI / 180;
    const rotDx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const rotDy = dx * Math.sin(rad) + dy * Math.cos(rad);

    move(-rotDx * sensitivity, -rotDy * sensitivity);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // ==========================================
  // УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ОТРИСОВКИ (Optimized with useCallback)
  // ==========================================
  const drawToCanvas = useCallback((
    ctx: CanvasRenderingContext2D, 
    img: HTMLImageElement, 
    width: number, 
    height: number, 
    // scaleFactor больше не используется напрямую для рисования линий, так как размеры уже в пикселях
    drawGuides: boolean,
    drawGrid: boolean,
    previewScaleFactor: number = 1 // Используется только для расчета толщины линий в превью
  ) => {
    // 1. Очистка и белый фон
    // Используем alpha: false при создании контекста, но на всякий случай заливаем
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    if (activeSpecs.isGrayscale) {
       ctx.filter = 'grayscale(100%)';
    }

    ctx.save();

    // 2. Трансформация координат
    ctx.translate(width / 2, height / 2);
    ctx.rotate((crop.rotation * Math.PI) / 180);
    ctx.scale(crop.scale, crop.scale);

    // 3. Рисуем изображение
    const offsetX = (crop.x / 100) * img.width;
    const offsetY = (crop.y / 100) * img.height;
    
    // Базовый масштаб: чтобы картинка по высоте влезала в рамку (примерно) при scale=1
    // Используем Math.ceil для предотвращения субпиксельных артефактов при расчетах
    const baseScale = Math.max(
      width / img.width,
      height / img.height
    );

    ctx.scale(baseScale, baseScale);

    // Рисуем с максимальным качеством
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(img, -offsetX, -offsetY);

    ctx.restore();
    ctx.filter = 'none';

    // 4. Уголок (если нужен)
    if (activeSpecs.cornerSide) {
        const cornerSize = width * 0.28; 
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        if (activeSpecs.cornerSide === 'left') {
          ctx.moveTo(0, height - cornerSize);
          ctx.quadraticCurveTo(cornerSize, height - cornerSize, cornerSize, height);
          ctx.lineTo(0, height);
        } else {
          ctx.moveTo(width, height - cornerSize);
          ctx.quadraticCurveTo(width - cornerSize, height - cornerSize, width - cornerSize, height);
          ctx.lineTo(width, height);
        }
        ctx.closePath();
        ctx.fill();
    }

    // 5. Сетка (Grid) - Новая фича
    if (drawGrid) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1 * previewScaleFactor * 0.5;
        
        // Трети
        ctx.moveTo(width / 3, 0);
        ctx.lineTo(width / 3, height);
        ctx.moveTo(width * 2 / 3, 0);
        ctx.lineTo(width * 2 / 3, height);
        
        ctx.moveTo(0, height / 3);
        ctx.lineTo(width, height / 3);
        ctx.moveTo(0, height * 2 / 3);
        ctx.lineTo(width, height * 2 / 3);
        
        ctx.stroke();
    }

    // 6. Линии разметки биометрии (только для превью)
    if (drawGuides && activeSpecs.faceHeightMin > 0) {
      // Вычисляем коэффициент перевода мм в пиксели для ТЕКУЩЕГО холста
      const pxPerMm = width / activeSpecs.widthMm;

      const drawLine = (yMm: number, color: string, isDashed: boolean = false) => {
        const yPx = yMm * pxPerMm;
        ctx.beginPath();
        if (isDashed) ctx.setLineDash([5, 5]);
        else ctx.setLineDash([]);
        
        ctx.moveTo(0, yPx);
        ctx.lineTo(width, yPx);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
      };

      // Верхняя граница (Красные)
      drawLine(activeSpecs.topMarginMin, 'rgba(255, 0, 0, 0.8)'); 
      drawLine(activeSpecs.topMarginMax, 'rgba(255, 0, 0, 0.4)', true);
      
      // Нижняя граница (Синие)
      drawLine(activeSpecs.topMarginMin + activeSpecs.faceHeightMin, 'rgba(0, 0, 255, 0.8)');
      drawLine(activeSpecs.topMarginMax + activeSpecs.faceHeightMax, 'rgba(0, 0, 255, 0.4)', true);

      // Центр
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [activeSpecs, crop]);

  // Рендеринг превью
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !isImgLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Для превью используем меньшее разрешение, чтобы не грузить процессор
    const PREVIEW_PPCM = 10;
    const targetWidth = Math.round(activeSpecs.widthMm * PREVIEW_PPCM);
    const targetHeight = Math.round(activeSpecs.heightMm * PREVIEW_PPCM);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    drawToCanvas(ctx, img, targetWidth, targetHeight, true, showGrid, PREVIEW_PPCM);

  }, [crop, activeSpecs, isImgLoaded, showGrid, drawToCanvas]);


  // ==========================================
  // Функция фильтра резкости (Unsharp Mask emulation)
  // ==========================================
  const applySharpening = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Настройка силы эффекта (0.0 - нет эффекта, 1.0 - максимальный "Фотошопный" эффект)
    // 0.22 - сбалансированная резкость
    const strength = 0.22; 
    
    // Вычисляем веса ядра свертки на основе силы эффекта
    // Формула: Central pixel gets (1 + 4*strength), neighbors get (-strength)
    // Sum of weights is always 1, preserving brightness.
    const n = -strength;
    const c = 1 + (4 * strength);

    // [ 0, n, 0 ]
    // [ n, c, n ]
    // [ 0, n, 0 ]
    const weights = [0, n, 0, n, c, n, 0, n, 0];
    
    const imageData = ctx.getImageData(0, 0, w, h);
    const dstData = ctx.createImageData(w, h);
    const srcBuff = imageData.data;
    const dstBuff = dstData.data;

    const katet = 3;
    const half = 1;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dstOff = (y * w + x) * 4;
        let r = 0, g = 0, b = 0;

        for (let ky = 0; ky < katet; ky++) {
          for (let kx = 0; kx < katet; kx++) {
            const cy = y + ky - half;
            const cx = x + kx - half;

            if (cy >= 0 && cy < h && cx >= 0 && cx < w) {
              const srcOff = (cy * w + cx) * 4;
              const wt = weights[ky * katet + kx];
              
              r += srcBuff[srcOff] * wt;
              g += srcBuff[srcOff + 1] * wt;
              b += srcBuff[srcOff + 2] * wt;
            }
          }
        }
        
        dstBuff[dstOff] = Math.min(255, Math.max(0, r));
        dstBuff[dstOff + 1] = Math.min(255, Math.max(0, g));
        dstBuff[dstOff + 2] = Math.min(255, Math.max(0, b));
        dstBuff[dstOff + 3] = srcBuff[dstOff + 3]; // сохраняем альфа-канал
      }
    }
    
    ctx.putImageData(dstData, 0, 0);
  };


  // Сохранение
  const downloadResult = () => {
    const img = imgRef.current;
    if (!img) return;

    // 1. СТАНДАРТ ФОТОЛАБОРАТОРИЙ: 600 DPI
    const PPCM = 23.622; // 600 DPI

    const targetWidth = Math.round(activeSpecs.widthMm * PPCM);
    const targetHeight = Math.round(activeSpecs.heightMm * PPCM);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext('2d', { alpha: false }); 
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 2. Рисуем изображение (Downscaling)
    drawToCanvas(ctx, img, targetWidth, targetHeight, false, false, PPCM);

    // 3. ПРИМЕНЯЕМ МЯГКИЙ SHARPENING
    applySharpening(ctx, targetWidth, targetHeight);

    // 4. Генерация файла
    const sizeStr = `${activeSpecs.widthMm}x${activeSpecs.heightMm}`;
    const dateStr = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
    const filename = `${originalFilename}_${sizeStr}_${dateStr}.jpg`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/jpeg', 1.0); 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (onNotify) onNotify(`Фото сохранено (Natural Look)`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[95vh] ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
        
        {/* Рабочая область */}
        <div className="flex-grow p-4 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950/50 relative overflow-hidden select-none">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10">
            <X size={24} />
          </button>

          {!image ? (
            <label className="cursor-pointer group flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <Upload size={40} className="text-white" />
              </div>
              <p className="font-black uppercase tracking-tighter text-lg">Загрузить фото</p>
              <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
            </label>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full h-full justify-center">
              
              {/* Canvas Container */}
              <div 
                className="relative shadow-2xl border-[10px] border-white dark:border-slate-800 cursor-move overflow-hidden bg-white"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
              >
                <canvas ref={canvasRef} style={{ maxHeight: '60vh', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                <img 
                  ref={imgRef}
                  src={image} 
                  className="hidden" 
                  onLoad={() => setIsImgLoaded(true)} 
                />
              </div>

              {/* Controls Bar */}
              <div className={`flex flex-wrap items-center justify-center gap-4 p-3 rounded-2xl border shadow-lg animate-in slide-in-from-bottom-4 duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                
                {/* Scale */}
                <div className="flex items-center gap-2 px-2">
                  <Minimize2 size={16} className="text-slate-400"/>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="5" 
                    step="0.01" 
                    value={crop.scale} 
                    onChange={(e) => setCrop(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                    className="w-24 sm:w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <Maximize2 size={16} className="text-slate-400"/>
                </div>

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

                {/* Rotation */}
                <div className="flex items-center gap-2 px-2">
                   <RotateLeftIcon size={16} className="text-slate-400" />
                   <input 
                    type="range" 
                    min="-45" 
                    max="45" 
                    step="0.5" 
                    value={crop.rotation} 
                    onChange={(e) => setCrop(prev => ({ ...prev, rotation: parseFloat(e.target.value) }))}
                    className="w-24 sm:w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <RotateCw size={16} className="text-slate-400" />
                </div>

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

                <button 
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-2 rounded-xl transition-all ${showGrid ? 'bg-blue-600 text-white' : (isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100')}`}
                  title="Сетка"
                >
                  <Grid size={20} />
                </button>

                <button 
                  onClick={() => setCrop({ x: 50, y: 50, scale: 1, rotation: 0 })}
                  className={`p-2 rounded-xl transition-all hover:bg-red-500 hover:text-white ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                  title="Сброс"
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Панель настроек */}
        <div className={`w-full md:w-80 p-0 flex flex-col border-l z-20 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
          <div className="p-6 border-b dark:border-slate-800 border-slate-100 flex-shrink-0">
             <h3 className={`text-lg font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Формат</h3>
             {image && <p className="text-xs text-slate-500 font-bold mt-1 truncate" title={originalFilename}>Файл: {originalFilename}</p>}
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-2">
            {PHOTO_VARIANTS.map(v => (
              <button 
                key={v.id}
                onClick={() => setSelectedVariant(v)}
                className={`w-full p-3 rounded-xl text-left border-2 transition-all group ${
                  !isCustom && selectedVariant.id === v.id 
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex justify-between items-center">
                   <span className={`font-black text-sm uppercase tracking-tight ${selectedVariant.id === v.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                     {v.label.split('(')[0]}
                   </span>
                   {selectedVariant.id === v.id && <Check size={16} className="text-blue-600" />}
                </div>
                <p className={`text-[10px] font-bold mt-1 ${selectedVariant.id === v.id ? 'text-blue-400' : 'text-slate-400'}`}>
                  {v.widthMm} x {v.heightMm} мм
                  {v.label.includes('(') && <span className="block opacity-75 font-normal">{v.label.split('(')[1].replace(')', '')}</span>}
                </p>
              </button>
            ))}
          </div>

          <div className="p-6 border-t dark:border-slate-800 border-slate-100 space-y-3 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
            <button 
              onClick={() => setImage(null)}
              className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-white border text-slate-500 hover:text-slate-800'}`}
            >
              Загрузить другое
            </button>
            <button 
              onClick={downloadResult}
              disabled={!image}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-tighter shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center space-x-2"
            >
              <Check size={20} />
              <span>Сохранить JPG</span>
            </button>
            <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-wider">
               600 DPI • Photoshop Quality
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCutter;
