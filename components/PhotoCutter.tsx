import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Upload, Check, Loader2, Settings2, Ruler, ChevronDown, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { PHOTO_VARIANTS, PhotoSpecs } from '../constants';

interface PhotoCutterProps {
  onClose: () => void;
}

const PhotoCutter: React.FC<PhotoCutterProps> = ({ onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<PhotoSpecs>(PHOTO_VARIANTS[0]);
  const [crop, setCrop] = useState({ x: 50, y: 50, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [isCustom, setIsCustom] = useState(false);
  const [customWidth, setCustomWidth] = useState(30);
  const [customHeight, setCustomHeight] = useState(40);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isImgLoaded, setIsImgLoaded] = useState(false);

  const VIEWPORT_SCALE = 12; 
  const PRINT_DPI_SCALE = 23.622; // 600 DPI conversion for mm to pixels

  const activeSpecs = isCustom ? {
    ...selectedVariant,
    id: 'custom',
    label: 'Свой размер',
    widthMm: customWidth || 1,
    heightMm: customHeight || 1,
    faceHeightMin: 0, faceHeightMax: 0, topMarginMin: 0, topMarginMax: 0
  } : selectedVariant;

  const renderFrame = useCallback((
    canvas: HTMLCanvasElement, 
    img: HTMLImageElement, 
    specs: PhotoSpecs, 
    showGuidelines: boolean = true
  ) => {
    const ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    });
    if (!ctx) return;

    const targetAspectRatio = specs.widthMm / specs.heightMm;
    
    // Setup high quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply filters ONLY for specific document requirements (like B&W military)
    // Removed the "contrast(1.1)" to preserve native quality as requested
    if (specs.isGrayscale) {
      ctx.filter = 'grayscale(100%)';
    } else {
      ctx.filter = 'none';
    }

    // Calculation with safety checks
    const safeScale = Math.max(0.01, crop.scale);
    const sHeight = img.height / safeScale;
    const sWidth = sHeight * targetAspectRatio;
    const sx = (img.width * (crop.x / 100)) - (sWidth / 2);
    const sy = (img.height * (crop.y / 100)) - (sHeight / 2);

    // Draw the actual image
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
    
    // Reset filter for UI overlays
    ctx.filter = 'none';

    // Corner mask (e.g. for specific tractor licenses)
    if (specs.cornerSide) {
      const cornerSize = canvas.width * 0.28;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      if (specs.cornerSide === 'left') {
        ctx.moveTo(0, canvas.height - cornerSize);
        ctx.quadraticCurveTo(cornerSize, canvas.height - cornerSize, cornerSize, canvas.height);
        ctx.lineTo(0, canvas.height);
      } else {
        ctx.moveTo(canvas.width, canvas.height - cornerSize);
        ctx.quadraticCurveTo(canvas.width - cornerSize, canvas.height - cornerSize, canvas.width - cornerSize, canvas.height);
        ctx.lineTo(canvas.width, canvas.height);
      }
      ctx.closePath();
      ctx.fill();
      
      // Outline of the corner
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(1, canvas.width * 0.004);
      ctx.stroke();
    }

    // Guidelines - High visibility neon style
    if (showGuidelines && !isCustom) {
      const tmRatio = (specs.topMarginMin + specs.topMarginMax) / 2 / specs.heightMm;
      const headRatio = (specs.faceHeightMin + specs.faceHeightMax) / 2 / specs.heightMm;
      
      const drawLine = (y: number, color: string) => {
        const lineY = canvas.height * y;
        
        // Dark outer shadow for contrast on light backgrounds
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 4;
        ctx.moveTo(0, lineY);
        ctx.lineTo(canvas.width, lineY);
        ctx.stroke();

        // Neon core dashed line
        ctx.beginPath();
        ctx.setLineDash([10, 5]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.moveTo(0, lineY);
        ctx.lineTo(canvas.width, lineY);
        ctx.stroke();
      };

      if (tmRatio > 0) drawLine(tmRatio, '#00FFFF'); // Top margin
      if (headRatio > 0) drawLine(tmRatio + headRatio, '#FF00FF'); // Chin line
      ctx.setLineDash([]);
    }
  }, [crop]);

  // Reactive draw effect
  useEffect(() => {
    if (isImgLoaded && image && canvasRef.current && imgRef.current) {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      
      const draw = () => {
        renderFrame(canvas, img, activeSpecs, true);
      };

      const frameId = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(frameId);
    }
  }, [isImgLoaded, image, crop, activeSpecs, renderFrame]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImgLoaded(false);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          imgRef.current = img;
          setImage(dataUrl);
          setIsImgLoaded(true);
          if (!isCustom) autoAlign(dataUrl, activeSpecs);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const autoAlign = async (dataUrl: string, specs: PhotoSpecs) => {
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = dataUrl.split(',')[1];
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [
          { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
          { text: "Analyze person's head for document photo. Return only JSON [ymin, xmin, ymax, xmax] for CROWN to CHIN." }
        ]}]
      });

      const match = response.text?.match(/\[.*\]/);
      if (match) {
        const [ymin, xmin, ymax, xmax] = JSON.parse(match[0]);
        const headH = ymax - ymin;
        const targetFace = specs.faceHeightMin ? (specs.faceHeightMin + specs.faceHeightMax) / 2 : specs.heightMm * 0.7;
        const targetTop = specs.topMarginMin ? (specs.topMarginMin + specs.topMarginMax) / 2 : specs.heightMm * 0.1;
        
        const totalH = headH * (specs.heightMm / targetFace);
        const topM = totalH * (targetTop / specs.heightMm);
        
        setCrop({ 
          x: ((xmin + xmax) / 2) * 100, 
          y: (ymin - topM + (totalH / 2)) * 100, 
          scale: 1 / totalH 
        });
      }
    } catch (e) {
      console.error("AI Alignment failed", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const savePhoto = () => {
    if (!imgRef.current) return;
    const exportCanvas = document.createElement('canvas');
    // High-fidelity export dimensions (600 DPI)
    exportCanvas.width = Math.round(activeSpecs.widthMm * PRINT_DPI_SCALE);
    exportCanvas.height = Math.round(activeSpecs.heightMm * PRINT_DPI_SCALE);
    
    renderFrame(exportCanvas, imgRef.current, activeSpecs, false);
    
    // Use maximum quality for JPEG
    exportCanvas.toBlob((blob) => {
      if (blob) {
        const link = document.createElement('a');
        link.download = `prestige_photo_${activeSpecs.id}_${Date.now()}.jpg`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }
    }, 'image/jpeg', 1.0);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/98 backdrop-blur-2xl p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[95vh]">
        
        {/* Canvas / Viewport */}
        <div className="flex-[2.5] bg-[#eef2f6] flex items-center justify-center p-8 relative group cursor-move overflow-hidden"
             onMouseDown={(e) => { setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); }}
             onMouseMove={(e) => {
               if (!isDragging) return;
               const sensitivity = 4;
               const dx = (e.clientX - dragStart.x) / sensitivity;
               const dy = (e.clientY - dragStart.y) / sensitivity;
               setCrop(p => ({ ...p, x: p.x - dx / p.scale, y: p.y - dy / p.scale }));
               setDragStart({ x: e.clientX, y: e.clientY });
             }}
             onMouseUp={() => setIsDragging(false)}
             onMouseLeave={() => setIsDragging(false)}
             onWheel={(e) => {
               e.preventDefault();
               const delta = e.deltaY > 0 ? 0.96 : 1.04;
               setCrop(p => ({ ...p, scale: Math.max(0.1, Math.min(60, p.scale * delta)) }));
             }}
        >
          {image ? (
            <div className="relative border-[16px] border-white shadow-2xl bg-white rounded-sm overflow-hidden transition-all duration-300">
              <canvas 
                ref={canvasRef} 
                width={activeSpecs.widthMm * VIEWPORT_SCALE} 
                height={activeSpecs.heightMm * VIEWPORT_SCALE}
                className="block bg-white"
                style={{ width: activeSpecs.widthMm * (VIEWPORT_SCALE / 1.8) + 'px' }}
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <Loader2 className="text-blue-600 animate-spin mb-4" size={48} />
                  <span className="text-blue-700 font-black text-xs uppercase tracking-widest animate-pulse">Анализ лица...</span>
                </div>
              )}
              {/* Quality Indicator */}
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/10 rounded text-[8px] font-bold text-slate-400 pointer-events-none uppercase">
                Raw 600DPI Render
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-4 border-dashed border-slate-300 rounded-[3rem] p-16 hover:border-blue-500 hover:bg-white transition-all cursor-pointer w-full max-w-lg aspect-square">
              <div className="bg-blue-50 p-6 rounded-full mb-6 text-blue-500 shadow-inner">
                 <Upload size={56} />
              </div>
              <span className="text-slate-700 font-black text-xl text-center">Загрузите фотографию</span>
              <span className="text-slate-400 font-medium text-sm mt-2">AI автоматически настроит масштаб</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          )}

          {/* Guidelines Legend (Hidden on Mobile) */}
          {!isCustom && image && (
            <div className="absolute top-6 left-6 hidden lg:block space-y-2">
               <div className="flex items-center space-x-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                 <div className="w-3 h-0.5 bg-[#00FFFF]"></div>
                 <span className="text-[10px] font-bold text-slate-600 uppercase">Верх поля</span>
               </div>
               <div className="flex items-center space-x-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                 <div className="w-3 h-0.5 bg-[#FF00FF]"></div>
                 <span className="text-[10px] font-bold text-slate-600 uppercase">Линия подбородка</span>
               </div>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="flex-[1.2] p-8 flex flex-col bg-white border-l border-slate-100 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-xl">
                 <RefreshCw size={20} className={isProcessing ? "animate-spin" : ""} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Резак <span className="text-blue-600">Pro</span></h2>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
          </div>

          <div className="space-y-6 flex-grow">
            {/* Format Dropdown */}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Формат документа</label>
               <div className="relative">
                 <select 
                    value={isCustom ? 'custom' : selectedVariant.id}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') { 
                        setIsCustom(true); 
                      } else {
                        setIsCustom(false);
                        const v = PHOTO_VARIANTS.find(x => x.id === val);
                        if (v) { 
                          setSelectedVariant(v); 
                          if (image) autoAlign(image, v); 
                        }
                      }
                    }}
                    className="w-full appearance-none bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] py-4 px-5 font-black text-slate-800 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                 >
                   {PHOTO_VARIANTS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                   <option value="custom">Произвольный размер...</option>
                 </select>
                 <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>
            </div>

            {/* Custom Dimensions */}
            {isCustom && (
              <div className="grid grid-cols-2 gap-4 p-5 bg-blue-50/50 rounded-2xl border-2 border-blue-100 animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center">
                    <Ruler size={12} className="mr-1" /> Ширина (мм)
                  </label>
                  <input 
                    type="number" 
                    value={customWidth} 
                    onChange={(e) => setCustomWidth(Math.max(1, parseInt(e.target.value) || 0))} 
                    className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center">
                    <Ruler size={12} className="mr-1" /> Высота (мм)
                  </label>
                  <input 
                    type="number" 
                    value={customHeight} 
                    onChange={(e) => setCustomHeight(Math.max(1, parseInt(e.target.value) || 0))} 
                    className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" 
                  />
                </div>
              </div>
            )}

            {/* Precision Adjustment Panel */}
            <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-6">
               <div className="flex items-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                 <Settings2 size={16} className="mr-2 text-blue-500"/> Ручная настройка
               </div>
               
               <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Масштаб (%)</label>
                    <span className="text-xs font-black px-2 py-1 bg-white border border-slate-200 rounded-lg text-blue-600 shadow-sm">
                      {Math.round(crop.scale * 100)}%
                    </span>
                  </div>
                  <input 
                    type="range" min="0.1" max="15" step="0.01" 
                    value={crop.scale} 
                    onChange={(e) => setCrop(p => ({ ...p, scale: parseFloat(e.target.value) }))} 
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none accent-blue-600 cursor-pointer" 
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Центр X (%)</label>
                    <input 
                      type="number" step="0.5" 
                      value={crop.x.toFixed(1)} 
                      onChange={(e) => setCrop(p => ({ ...p, x: parseFloat(e.target.value) || 0 }))} 
                      className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-black text-slate-800 outline-none focus:border-blue-500 shadow-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Центр Y (%)</label>
                    <input 
                      type="number" step="0.5" 
                      value={crop.y.toFixed(1)} 
                      onChange={(e) => setCrop(p => ({ ...p, y: parseFloat(e.target.value) || 0 }))} 
                      className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-black text-slate-800 outline-none focus:border-blue-500 shadow-sm" 
                    />
                  </div>
               </div>
            </div>

            <button 
              onClick={savePhoto} 
              disabled={!image || isProcessing} 
              className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-2xl shadow-slate-200 hover:bg-black disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center space-x-3 active:scale-95"
            >
              <Check size={28} />
              <span className="text-xl uppercase tracking-tighter">Скачать результат</span>
            </button>
          </div>
          
          <div className="mt-6 flex flex-col items-center space-y-2">
             <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hi-Res Export • 600 DPI</span>
             </div>
             <p className="text-[9px] text-center text-slate-300 font-medium max-w-[200px] leading-tight uppercase">
                Разметка не отображается на скачанном файле
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCutter;