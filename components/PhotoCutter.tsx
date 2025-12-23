import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Upload, Check, Loader2, Maximize, Move, Info, ChevronDown, Settings2, Ruler } from 'lucide-react';
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

  const VIEWPORT_SCALE = 10; 
  const PRINT_DPI_SCALE = 23.622; 

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
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const targetAspectRatio = specs.widthMm / specs.heightMm;
    
    // Reset and Fill
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (specs.isGrayscale) {
      ctx.filter = 'grayscale(100%) contrast(1.1)';
    } else {
      ctx.filter = 'none';
    }

    // Coordinate Math
    const safeScale = Math.max(0.01, crop.scale);
    const sHeight = img.height / safeScale;
    const sWidth = sHeight * targetAspectRatio;
    const sx = (img.width * (crop.x / 100)) - (sWidth / 2);
    const sy = (img.height * (crop.y / 100)) - (sHeight / 2);

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

    // Corner (part of the document)
    if (specs.cornerSide) {
      const cornerSize = canvas.width * 0.25;
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
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(1, canvas.width * 0.003);
      ctx.stroke();
    }

    // Guidelines (Visual only)
    if (showGuidelines && !isCustom) {
      const tmRatio = (specs.topMarginMin + specs.topMarginMax) / 2 / specs.heightMm;
      const headRatio = (specs.faceHeightMin + specs.faceHeightMax) / 2 / specs.heightMm;
      
      const drawVisibleLine = (y: number) => {
        const lineY = canvas.height * y;
        // Outer Shadow
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(canvas.width, lineY);
        ctx.stroke();

        // Inner Glow
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 6]);
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(canvas.width, lineY);
        ctx.stroke();
      };

      if (tmRatio > 0) drawVisibleLine(tmRatio);
      if (headRatio > 0) drawVisibleLine(tmRatio + headRatio);
      ctx.setLineDash([]);
    }
  }, [crop]);

  // Main Draw Effect
  useEffect(() => {
    if (image && canvasRef.current && imgRef.current) {
      const frame = requestAnimationFrame(() => {
        if (canvasRef.current && imgRef.current) {
          renderFrame(canvasRef.current, imgRef.current, activeSpecs, true);
        }
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [image, crop, activeSpecs, renderFrame]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          imgRef.current = img;
          setImage(dataUrl);
          if (!isCustom) autoAlign(dataUrl, activeSpecs);
        };
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
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const savePhoto = () => {
    if (!imgRef.current) return;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = activeSpecs.widthMm * PRINT_DPI_SCALE;
    exportCanvas.height = activeSpecs.heightMm * PRINT_DPI_SCALE;
    renderFrame(exportCanvas, imgRef.current, activeSpecs, false);
    
    exportCanvas.toBlob((blob) => {
      if (blob) {
        const link = document.createElement('a');
        link.download = `photo_${activeSpecs.id}_${Date.now()}.jpg`;
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    }, 'image/jpeg', 1.0);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4">
      <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[95vh]">
        
        {/* Canvas Area */}
        <div className="flex-[2.5] bg-slate-200 flex items-center justify-center p-6 relative group cursor-move overflow-hidden"
             onMouseDown={(e) => { setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); }}
             onMouseMove={(e) => {
               if (!isDragging) return;
               const dx = (e.clientX - dragStart.x) / 5;
               const dy = (e.clientY - dragStart.y) / 5;
               setCrop(p => ({ ...p, x: p.x - dx / p.scale, y: p.y - dy / p.scale }));
               setDragStart({ x: e.clientX, y: e.clientY });
             }}
             onMouseUp={() => setIsDragging(false)}
             onMouseLeave={() => setIsDragging(false)}
             onWheel={(e) => {
               e.preventDefault();
               const delta = e.deltaY > 0 ? 0.95 : 1.05;
               setCrop(p => ({ ...p, scale: Math.max(0.1, Math.min(50, p.scale * delta)) }));
             }}
        >
          {image ? (
            <div className="relative border-[12px] border-white shadow-2xl bg-white">
              <canvas 
                ref={canvasRef} 
                width={activeSpecs.widthMm * VIEWPORT_SCALE} 
                height={activeSpecs.heightMm * VIEWPORT_SCALE}
                className="block bg-white shadow-lg"
                style={{ width: activeSpecs.widthMm * (VIEWPORT_SCALE / 2) + 'px' }}
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                  <Loader2 className="text-blue-600 animate-spin mb-3" size={40} />
                  <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest">AI Анализ...</span>
                </div>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-4 border-dashed border-slate-300 rounded-[2rem] p-12 hover:border-blue-500 hover:bg-white transition-all cursor-pointer w-full h-80">
              <Upload size={48} className="text-blue-500 mb-4" />
              <span className="text-slate-600 font-bold">Выберите фото для обрезки</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex-[1.2] p-8 flex flex-col bg-white border-l border-slate-100 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Престиж <span className="text-blue-600">Резак</span></h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24} /></button>
          </div>

          <div className="space-y-6 flex-grow">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Формат</label>
               <select 
                  value={isCustom ? 'custom' : selectedVariant.id}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') { setIsCustom(true); } 
                    else {
                      setIsCustom(false);
                      const v = PHOTO_VARIANTS.find(x => x.id === val);
                      if (v) { setSelectedVariant(v); if (image) autoAlign(image, v); }
                    }
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:border-blue-500"
               >
                 {PHOTO_VARIANTS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                 <option value="custom">Произвольный размер...</option>
               </select>
            </div>

            {isCustom && (
              <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div>
                  <label className="text-[9px] font-bold text-blue-400 uppercase">Ширина (мм)</label>
                  <input type="number" value={customWidth} onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)} className="w-full bg-white rounded-xl px-3 py-2 text-sm font-bold" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-blue-400 uppercase">Высота (мм)</label>
                  <input type="number" value={customHeight} onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)} className="w-full bg-white rounded-xl px-3 py-2 text-sm font-bold" />
                </div>
              </div>
            )}

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
               <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest"><Settings2 size={14} className="mr-2"/> Настройка</div>
               
               <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Масштаб</label>
                    <span className="text-[10px] font-black text-blue-600">{Math.round(crop.scale * 100)}%</span>
                  </div>
                  <input type="range" min="0.1" max="10" step="0.01" value={crop.scale} onChange={(e) => setCrop(p => ({ ...p, scale: parseFloat(e.target.value) }))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none accent-blue-600" />
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Сдвиг X (%)</label>
                    <input type="number" step="0.5" value={crop.x.toFixed(1)} onChange={(e) => setCrop(p => ({ ...p, x: parseFloat(e.target.value) || 0 }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-center" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Сдвиг Y (%)</label>
                    <input type="number" step="0.5" value={crop.y.toFixed(1)} onChange={(e) => setCrop(p => ({ ...p, y: parseFloat(e.target.value) || 0 }))} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-center" />
                  </div>
               </div>
            </div>

            <button onClick={savePhoto} disabled={!image || isProcessing} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black shadow-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center space-x-2">
              <Check size={24} />
              <span className="text-lg uppercase tracking-tight">Скачать для печати</span>
            </button>
          </div>
          
          <p className="text-[9px] text-center text-slate-400 mt-4 uppercase font-bold tracking-tighter">Линии разметки не будут видны на файле • 600 DPI</p>
        </div>
      </div>
    </div>
  );
};

export default PhotoCutter;