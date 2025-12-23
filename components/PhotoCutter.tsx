
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Upload, Check, Loader2, Settings2, Ruler, ChevronDown, RefreshCw, Layers, Monitor } from 'lucide-react';
import { PHOTO_VARIANTS, PhotoSpecs } from '../constants';

interface PhotoCutterProps {
  onClose: () => void;
  isDarkMode?: boolean;
  onNotify?: (msg: string, type?: 'success' | 'info') => void;
}

const PhotoCutter: React.FC<PhotoCutterProps> = ({ onClose, isDarkMode, onNotify }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<PhotoSpecs>(PHOTO_VARIANTS[0]);
  const [crop, setCrop] = useState({ x: 50, y: 50, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [isCustom, setIsCustom] = useState(false);
  const [customWidth, setCustomWidth] = useState(30);
  const [customHeight, setCustomHeight] = useState(40);
  
  const [isSheetMode, setIsSheetMode] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isImgLoaded, setIsImgLoaded] = useState(false);

  const VIEWPORT_SCALE = 8; 

  const activeSpecs = isCustom ? {
    ...selectedVariant,
    id: 'custom',
    label: 'Свой размер',
    widthMm: customWidth || 1,
    heightMm: customHeight || 1,
    faceHeightMin: 0, faceHeightMax: 0, topMarginMin: 0, topMarginMax: 0
  } : selectedVariant;

  const estimatedDPI = useMemo(() => {
    if (!imgRef.current) return 0;
    const pixelsPerMm = imgRef.current.height / (activeSpecs.heightMm / crop.scale);
    return Math.round(pixelsPerMm * 25.4);
  }, [crop.scale, activeSpecs, isImgLoaded]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setIsImgLoaded(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setCrop(prev => ({
      ...prev,
      x: Math.min(100, Math.max(0, prev.x - (dx / 5))), // Simple inverse for natural feel
      y: Math.min(100, Math.max(0, prev.y - (dy / 5)))
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !isImgLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const specs = activeSpecs;
    const targetWidth = specs.widthMm * VIEWPORT_SCALE;
    const targetHeight = specs.heightMm * VIEWPORT_SCALE;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    if (specs.isGrayscale) ctx.filter = 'grayscale(100%)';

    const targetAspectRatio = specs.widthMm / specs.heightMm;
    const sHeight = img.height / crop.scale;
    const sWidth = sHeight * targetAspectRatio;
    const sx = (img.width * (crop.x / 100)) - (sWidth / 2);
    const sy = (img.height * (crop.y / 100)) - (sHeight / 2);

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
    ctx.filter = 'none';

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
  }, [crop, activeSpecs, isImgLoaded]);

  useEffect(() => {
    if (isImgLoaded) renderFrame();
  }, [renderFrame, isImgLoaded]);

  const downloadResult = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `photo_${activeSpecs.id}.png`;
    link.href = canvasRef.current.toDataURL('image/png', 1.0);
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className={`w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
        
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
            <div 
              className="relative shadow-2xl border-4 border-white cursor-move overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <canvas ref={canvasRef} />
              <img 
                ref={imgRef}
                src={image} 
                className="hidden" 
                onLoad={() => {
                  setIsImgLoaded(true);
                }} 
              />
            </div>
          )}

          {image && (
            <div className="mt-6 flex items-center space-x-4 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10">
              <button 
                onClick={() => setCrop(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.1) }))}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors font-bold w-10 text-xl"
              >-</button>
              <input 
                type="range" 
                min="0.1" 
                max="3" 
                step="0.01" 
                value={crop.scale} 
                onChange={(e) => setCrop(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
              />
              <button 
                onClick={() => setCrop(prev => ({ ...prev, scale: prev.scale + 0.1 }))}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors font-bold w-10 text-xl"
              >+</button>
            </div>
          )}
        </div>

        <div className={`w-full md:w-80 p-6 flex flex-col border-l ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
          <div className="mb-8 flex-grow">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Выбор формата</h3>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
              {PHOTO_VARIANTS.map(v => (
                <button 
                  key={v.id}
                  onClick={() => {
                    setSelectedVariant(v);
                    setIsCustom(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left border-2 transition-all ${
                    !isCustom && selectedVariant.id === v.id 
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="font-bold text-sm">{v.label}</p>
                  <p className="text-[10px] text-slate-500">{v.widthMm} x {v.heightMm} мм</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t dark:border-slate-800 border-slate-100">
            <button 
              onClick={downloadResult}
              disabled={!image}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-tighter shadow-xl shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              <Check size={20} />
              <span>Сохранить результат</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCutter;
