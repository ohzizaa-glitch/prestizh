
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
     return selectedVariant;
  }, [selectedVariant]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      // Extract filename without extension
      const name = file.name.replace(/\.[^/.]+$/, "");
      setOriginalFilename(name);

      reader.addEventListener('load', () => {
        setImage(reader.result as string);
        setCrop({ x: 50, y: 50, scale: 1, rotation: 0 }); // Reset crop
        setIsImgLoaded(false);
      });
      reader.readAsDataURL(file);
    }
  };

  // Отрисовка
  const draw = useCallback(() => {
    if (!image || !canvasRef.current || !imgRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Настройка размеров Canvas (Высокое разрешение для печати)
    // 300 DPI = ~11.8 пикселей на мм. Для запаса берем 32 px/mm.
    const PPCM = 32; 
    const widthPx = activeSpecs.widthMm * PPCM;
    const heightPx = activeSpecs.heightMm * PPCM;

    canvas.width = widthPx;
    canvas.height = heightPx;

    // Заливка белым (на случай прозрачности)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Параметры изображения
    const img = imgRef.current;
    
    // Центр холста
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.save();
    
    // Переносим начало координат в центр холста
    ctx.translate(cx, cy);
    
    // Применяем поворот (в радианах)
    ctx.rotate((crop.rotation * Math.PI) / 180);

    // Масштабирование
    // Базовый масштаб: чтобы картинка покрывала область кропа по меньшей стороне, но вписывалась
    // Вычисляем scale factor чтобы картинка "вписалась" или "покрыла" область
    // Реализуем "cover" логику относительно минимальной стороны
    
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = widthPx / heightPx;
    
    let baseScale;
    if (imgRatio > canvasRatio) {
        baseScale = heightPx / img.naturalHeight;
    } else {
        baseScale = widthPx / img.naturalWidth;
    }
    
    const finalScale = baseScale * crop.scale;
    ctx.scale(finalScale, finalScale);

    // Смещение (crop.x/y - это проценты от размеров изображения)
    // 50% - это центр изображения должен быть в центре холста.
    // Если crop.x = 60%, значит мы сдвинули центр картинки влево.
    // Координаты рисуются от центра картинки (-img.width/2).
    
    const offsetX = (crop.x - 50) / 100 * img.naturalWidth;
    const offsetY = (crop.y - 50) / 100 * img.naturalHeight;

    // Рисуем картинку, сдвигая её так, чтобы нужная точка (crop.x, crop.y) оказалась в центре (0,0 текущих координат)
    ctx.translate(-offsetX, -offsetY);

    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    ctx.restore();

  }, [image, crop, activeSpecs]);

  useEffect(() => {
    if (image && isImgLoaded) {
        draw();
    }
  }, [image, isImgLoaded, crop, activeSpecs, draw]);

  // Handle Dragging for Pan
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !imgRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    
    // Чувствительность перемещения зависит от зума
    const sensitivity = 0.15 / crop.scale; 

    setCrop(prev => ({
      ...prev,
      x: prev.x - dx * sensitivity,
      y: prev.y - dy * sensitivity
    }));

    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom Control
  const handleZoom = (delta: number) => {
    setCrop(prev => ({
      ...prev,
      scale: Math.max(0.1, prev.scale + delta)
    }));
  };

  // Rotate Control
  const handleRotate = (angle: number) => {
    setCrop(prev => ({
      ...prev,
      rotation: Math.round((prev.rotation + angle) / 90) * 90 // Snap to 90 degrees
    }));
  };

  const handleSave = () => {
    if (!canvasRef.current || !image) return;
    
    // Create a temporary link to download
    const link = document.createElement('a');
    // Save as JPEG per user request
    link.download = `${originalFilename}_${activeSpecs.widthMm}x${activeSpecs.heightMm}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95); // High quality JPEG
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (onNotify) onNotify('Фото сохранено (JPEG)', 'success');
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-6xl h-[90vh] rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
        
        {/* Left Sidebar: Controls */}
        <div className={`w-full md:w-80 flex-shrink-0 p-6 border-b md:border-b-0 md:border-r flex flex-col overflow-y-auto ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'}`}>
           <div className="flex justify-between items-center mb-6">
             <h2 className={`text-xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Резак</h2>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
               <X size={24} />
             </button>
           </div>

           {!image ? (
             <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 py-12 border-2 border-dashed rounded-2xl border-slate-300 dark:border-slate-700">
                <div className={`p-4 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-blue-50 text-blue-500'}`}>
                  <Upload size={32} />
                </div>
                <div>
                  <p className="font-bold text-sm mb-1">Загрузите фото</p>
                  <p className="text-xs text-slate-500">JPG, PNG</p>
                </div>
                <label className="cursor-pointer">
                  <span className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-black uppercase text-xs tracking-wider transition-colors shadow-lg shadow-blue-500/30">
                    Выбрать файл
                  </span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
             </div>
           ) : (
             <div className="flex flex-col h-full space-y-6">
                
                {/* Variant Selector */}
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Формат</label>
                   <div className="grid grid-cols-1 gap-2">
                      <div className="relative">
                        <select 
                          value={selectedVariant.id}
                          onChange={(e) => {
                             const v = PHOTO_VARIANTS.find(vv => vv.id === e.target.value);
                             if (v) setSelectedVariant(v);
                          }}
                          className={`w-full appearance-none px-4 py-3 rounded-xl font-bold text-sm outline-none border-2 transition-all ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'}`}
                        >
                          {PHOTO_VARIANTS.map(v => (
                            <option key={v.id} value={v.id}>{v.label}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                   </div>
                   <div className="mt-2 text-xs text-slate-500 font-medium px-1">
                      {selectedVariant.description}
                   </div>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Масштаб</label>
                     <span className="text-xs font-bold text-blue-500">{Math.round(crop.scale * 100)}%</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <button onClick={() => handleZoom(-0.1)} className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}><Minimize2 size={16}/></button>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="5" 
                        step="0.1" 
                        value={crop.scale}
                        onChange={(e) => setCrop(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                        className="flex-grow h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <button onClick={() => handleZoom(0.1)} className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}><Maximize2 size={16}/></button>
                   </div>
                   
                   <div className="flex items-center justify-between pt-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Поворот</label>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleRotate(-90)} className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                         <RotateCcw size={16} /> -90°
                      </button>
                      <button onClick={() => handleRotate(90)} className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                         <RotateCw size={16} /> +90°
                      </button>
                   </div>

                   <button 
                      onClick={() => setShowGrid(!showGrid)}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-colors mt-2 ${showGrid ? 'bg-blue-600 text-white' : (isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600')}`}
                   >
                      <Grid size={16} /> {showGrid ? 'Скрыть сетку' : 'Показать сетку'}
                   </button>
                </div>

                <div className="flex-grow"></div>

                <div className="pt-6 border-t border-dashed border-slate-300 dark:border-slate-700">
                   <div className="flex gap-2">
                     <label className="flex-grow cursor-pointer">
                        <div className={`flex items-center justify-center space-x-2 py-3 rounded-xl border-2 border-dashed transition-all ${isDarkMode ? 'border-slate-600 hover:border-slate-500 text-slate-400' : 'border-slate-300 hover:border-slate-400 text-slate-500'}`}>
                          <Upload size={16} />
                          <span className="font-bold text-xs uppercase">Другое фото</span>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                     </label>
                   </div>
                   <button 
                     onClick={handleSave}
                     className="w-full mt-3 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-tighter shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                   >
                     <Check size={20} />
                     <span>Сохранить</span>
                   </button>
                </div>
             </div>
           )}
        </div>

        {/* Right Area: Canvas Preview */}
        <div className={`flex-grow relative overflow-hidden flex items-center justify-center ${isDarkMode ? 'bg-[#0f172a]' : 'bg-slate-100'}`}
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}
             onTouchStart={handleMouseDown}
             onTouchMove={handleMouseMove}
             onTouchEnd={handleMouseUp}
        >
           {/* Background Grid Pattern */}
           <div className="absolute inset-0 opacity-10 pointer-events-none" 
                style={{ 
                    backgroundImage: `linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%)`,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' 
                }} 
           />

           {image && (
             <div className="relative shadow-2xl" style={{ width: 'fit-content', height: 'fit-content' }}>
               <canvas 
                 ref={canvasRef} 
                 className="max-w-full max-h-[80vh] block cursor-move touch-none"
                 style={{ 
                   width: 'auto', 
                   height: 'auto', 
                   maxHeight: '80vh', 
                   maxWidth: '100%' 
                 }}
               />
               <img 
                 ref={imgRef}
                 src={image}
                 className="hidden"
                 alt="source"
                 onLoad={() => { setIsImgLoaded(true); }}
               />
               
               {/* Overlay Guidelines (The "Cut" lines) */}
               {showGrid && (
                 <div className="absolute inset-0 pointer-events-none border border-red-500/30 z-10">
                    <div className="absolute top-0 left-[4mm] bottom-0 border-l border-red-500/20"></div>
                    <div className="absolute top-[2mm] left-0 right-0 border-t border-red-500/20"></div>
                    {/* Center Cross */}
                    <div className="absolute top-1/2 left-0 right-0 border-t border-cyan-500/30"></div>
                    <div className="absolute top-0 bottom-0 left-1/2 border-l border-cyan-500/30"></div>
                 </div>
               )}
             </div>
           )}

           {!image && (
              <div className="text-slate-400 flex flex-col items-center select-none pointer-events-none">
                 <Maximize2 size={48} className="opacity-20 mb-4" />
                 <p className="font-black uppercase tracking-widest opacity-30">Область предпросмотра</p>
              </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default PhotoCutter;
