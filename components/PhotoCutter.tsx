
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Upload, Check, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Maximize2, Minimize2, RotateCcw, RotateCw, RotateCcw as RotateLeftIcon } from 'lucide-react';
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
  // dx, dy - смещение мыши.
  // Мы меняем crop.x/crop.y. 
  // crop.x - это точка на изображении (в %), которая должна быть в центре рамки.
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
    
    // Важно: при повороте оси X/Y визуально меняются, но crop.x/y привязаны к исходному изображению.
    // Для простого использования оставляем движение по осям экрана, 
    // но корректируем вектор движения в зависимости от угла поворота, чтобы "вверх" всегда было "вверх".
    
    const rad = -crop.rotation * Math.PI / 180;
    const rotDx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const rotDy = dx * Math.sin(rad) + dy * Math.cos(rad);

    move(-rotDx * sensitivity, -rotDy * sensitivity);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // ==========================================
  // УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ОТРИСОВКИ
  // ==========================================
  const drawToCanvas = (
    ctx: CanvasRenderingContext2D, 
    img: HTMLImageElement, 
    width: number, 
    height: number, 
    scaleFactor: number, // Множитель разрешения (10 для превью, 32 для экспорта)
    drawGuides: boolean
  ) => {
    // 1. Очистка и белый фон
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    if (activeSpecs.isGrayscale) {
       ctx.filter = 'grayscale(100%)';
    }

    ctx.save();

    // 2. Трансформация координат
    // Переносим начало координат в ЦЕНТР канваса (рамки)
    ctx.translate(width / 2, height / 2);
    
    // Вращаем пространство
    ctx.rotate((crop.rotation * Math.PI) / 180);
    
    // Масштабируем
    ctx.scale(crop.scale, crop.scale);

    // 3. Рисуем изображение
    // Нам нужно нарисовать изображение так, чтобы точка (crop.x, crop.y) оказалась в (0,0) (центре канваса)
    // crop.x - процент от ширины изображения (0..100)
    
    // Вычисляем смещение центра изображения относительно точки (0,0) текущей системы координат
    // Если crop.x = 50%, смещение = 0.
    // Если crop.x = 0%, нам нужно сдвинуть изображение вправо на 50% ширины.
    
    const imgCenterX = img.width / 2;
    const imgCenterY = img.height / 2;
    
    // Смещение внутри изображения до точки crop
    const offsetX = (crop.x / 100) * img.width;
    const offsetY = (crop.y / 100) * img.height;
    
    // Сдвигаем изображение так, чтобы точка offset оказалась в 0,0
    const drawX = -offsetX;
    const drawY = -offsetY;
    
    // Учитываем соотношение сторон и зум для рендеринга.
    // В drawImage размеры задаются в исходных пикселях изображения.
    // Но нам нужно подстроить размер изображения под "физические" размеры рамки.
    
    // Базовый масштаб: чтобы картинка по высоте влезала в рамку (примерно) при scale=1
    // Это эвристика для начального отображения.
    const targetAspectRatio = activeSpecs.widthMm / activeSpecs.heightMm;
    // const imgAspectRatio = img.width / img.height;
    
    // Вычисляем базовый коэффициент масштабирования, чтобы изображение заполнило рамку
    // (логика cover: берем меньшую сторону)
    // При scale=1 изображение должно примерно заполнять рамку
    const baseScale = Math.max(
      width / img.width,
      height / img.height
    );

    // Применяем этот базовый масштаб к текущему контексту
    ctx.scale(baseScale, baseScale);

    // Рисуем с высоким качеством
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Рисуем картинку
    // Поскольку мы уже сделали translate/rotate/scale для контекста, просто рисуем картинку смещенную на offset
    // Но нам нужно рисовать ВЕСЬ image, смещенный на (imgWidth * cropX/100).
    // Поправка: при translate(width/2, height/2) мы в центре.
    // Мы хотим, чтобы пиксель (cropX, cropY) был в (0,0).
    // Значит левый верхний угол картинки должен быть в (-cropX, -cropY).
    
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

    // 5. Линии разметки (только для превью)
    if (drawGuides && activeSpecs.faceHeightMin > 0) {
      const drawLine = (yMm: number, color: string, isDashed: boolean = false) => {
        const yPx = yMm * scaleFactor;
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
  };

  // Рендеринг превью
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !isImgLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const PREVIEW_SCALE = 10;
    const targetWidth = activeSpecs.widthMm * PREVIEW_SCALE;
    const targetHeight = activeSpecs.heightMm * PREVIEW_SCALE;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    drawToCanvas(ctx, img, targetWidth, targetHeight, PREVIEW_SCALE, true);

  }, [crop, activeSpecs, isImgLoaded]);


  // Сохранение
  const downloadResult = () => {
    const img = imgRef.current;
    if (!img) return;

    const offCanvas = document.createElement('canvas');
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return;

    // 800 DPI (приближенно).
    // 32 пикселя на 1 мм = ~812 DPI.
    const EXPORT_SCALE = 32;

    const targetWidth = activeSpecs.widthMm * EXPORT_SCALE;
    const targetHeight = activeSpecs.heightMm * EXPORT_SCALE;

    offCanvas.width = targetWidth;
    offCanvas.height = targetHeight;

    // Рисуем без линий разметки
    drawToCanvas(ctx, img, targetWidth, targetHeight, EXPORT_SCALE, false);

    // Генерация имени файла
    const sizeStr = `${activeSpecs.widthMm}x${activeSpecs.heightMm}`;
    const dateStr = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
    const filename = `${originalFilename}_${sizeStr}_${dateStr}.jpg`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = offCanvas.toDataURL('image/jpeg', 1.0); 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (onNotify) onNotify(`Фото сохранено: ${filename}`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
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
                    className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <Maximize2 size={16} className="text-slate-400"/>
                </div>

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>

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
                    className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <RotateCw size={16} className="text-slate-400" />
                </div>

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>

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
          <div className="p-6 border-b dark:border-slate-800 border-slate-100">
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

          <div className="p-6 border-t dark:border-slate-800 border-slate-100 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
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
               800 DPI • High Quality
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCutter;
