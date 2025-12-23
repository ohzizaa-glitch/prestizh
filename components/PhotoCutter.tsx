import React, { useState, useRef, useEffect } from 'react';
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
  
  // Custom dimensions state
  const [isCustom, setIsCustom] = useState(false);
  const [customWidth, setCustomWidth] = useState(30);
  const [customHeight, setCustomHeight] = useState(40);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const VIEWPORT_SCALE = 8; 
  const PRINT_DPI_SCALE = 23.622; 

  const activeSpecs = isCustom ? {
    ...selectedVariant,
    id: 'custom',
    label: 'Произвольный размер',
    widthMm: customWidth,
    heightMm: customHeight,
    faceHeightMin: 0, faceHeightMax: 0, topMarginMin: 0, topMarginMax: 0
  } : selectedVariant;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const dataUrl = readerEvent.target?.result as string;
        setImage(dataUrl);
        autoAlign(dataUrl, activeSpecs);
      };
      reader.readAsDataURL(file);
    }
  };

  const autoAlign = async (dataUrl: string, specs: PhotoSpecs) => {
    if (isCustom) return; // Skip AI for purely custom sizes as requirements are unknown
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = dataUrl.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
              { text: `Analyze this person's head for a document photo. Return only JSON with normalized coordinates [ymin, xmin, ymax, xmax] for the HEAD (crown to chin). No text.` }
            ]
          }
        ],
      });

      const text = response.text || "";
      const match = text.match(/\[.*\]/);
      if (match) {
        const [ymin, xmin, ymax, xmax] = JSON.parse(match[0]);
        
        const headHeightNorm = ymax - ymin;
        const targetFaceMm = specs.faceHeightMin ? (specs.faceHeightMin + specs.faceHeightMax) / 2 : specs.heightMm * 0.6;
        const targetTopMm = specs.topMarginMin ? (specs.topMarginMin + specs.topMarginMax) / 2 : specs.heightMm * 0.1;
        
        const totalHeightNorm = headHeightNorm * (specs.heightMm / targetFaceMm);
        const topMarginNorm = totalHeightNorm * (targetTopMm / specs.heightMm);
        
        const cropYMin = ymin - topMarginNorm;
        const cropYMax = cropYMin + totalHeightNorm;
        const centerX = (xmin + xmax) / 2;
        const aspectRatio = specs.widthMm / specs.heightMm;
        const totalWidthNorm = totalHeightNorm * aspectRatio;
        
        const cropXMin = centerX - (totalWidthNorm / 2);

        setCrop({ 
          x: (cropXMin + (cropXMin + totalWidthNorm)) / 2 * 100, 
          y: (cropYMin + cropYMax) / 2 * 100, 
          scale: 1 / totalHeightNorm 
        });
      }
    } catch (err) {
      console.error("AI Auto-align failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderFrame = (
    canvas: HTMLCanvasElement, 
    img: HTMLImageElement, 
    specs: PhotoSpecs, 
    showGuidelines: boolean = true
  ) => {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const aspectRatio = specs.widthMm / specs.heightMm;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (specs.isGrayscale) {
      ctx.filter = 'grayscale(100%) contrast(1.1)';
    } else {
      ctx.filter = 'none';
    }

    const sHeight = img.height / crop.scale;
    const sWidth = sHeight * aspectRatio;
    const sx = (img.width * (crop.x / 100)) - (sWidth / 2);
    const sy = (img.height * (crop.y / 100)) - (sHeight / 2);

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

    if (specs.cornerSide) {
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      const cornerSize = canvas.width * 0.25;
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
      ctx.strokeStyle = '#000';
      ctx.lineWidth = canvas.width * 0.002;
      ctx.stroke();
    }

    if (showGuidelines && !isCustom) {
      // High contrast guidelines (Black outline + Cyan dash)
      const tmRatio = (specs.topMarginMin + specs.topMarginMax) / 2 / specs.heightMm;
      const headRatio = (specs.faceHeightMin + specs.faceHeightMax) / 2 / specs.heightMm;
      
      const drawLine = (y: number) => {
        // Shadow line for contrast
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();

        // Main colored dashed line
        ctx.setLineDash([8, 4]);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      };

      drawLine(canvas.height * tmRatio);
      drawLine(canvas.height * (tmRatio + headRatio));
      ctx.setLineDash([]);
    }
  };

  useEffect(() => {
    if (image && canvasRef.current && imgRef.current) {
      renderFrame(canvasRef.current, imgRef.current, activeSpecs, true);
    }
  }, [image, crop, selectedVariant, customWidth, customHeight, isCustom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imgRef.current) return;
    const dx = (e.clientX - dragStart.x) / 5;
    const dy = (e.clientY - dragStart.y) / 5;
    
    setCrop(prev => ({
      ...prev,
      x: prev.x - dx / prev.scale,
      y: prev.y - dy / prev.scale
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    setCrop(prev => ({ ...prev, scale: Math.max(0.1, Math.min(50, prev.scale * delta)) }));
  };

  const savePhoto = () => {
    if (!imgRef.current) return;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = activeSpecs.widthMm * PRINT_DPI_SCALE;
    exportCanvas.height = activeSpecs.heightMm * PRINT_DPI_SCALE;
    renderFrame(exportCanvas, imgRef.current, activeSpecs, false);
    exportCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `prestige_${activeSpecs.id}_highres.jpg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/jpeg', 1.0);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[95vh]">
        
        {/* Workspace */}
        <div className="flex-[2.5] bg-slate-100 flex items-center justify-center p-6 relative group cursor-move overflow-hidden"
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseUp={() => setIsDragging(false)}
             onMouseLeave={() => setIsDragging(false)}
             onWheel={handleWheel}
        >
          {image ? (
            <div className="relative border-[12px] border-white shadow-2xl bg-white transition-all duration-300">
              <canvas 
                ref={canvasRef} 
                width={activeSpecs.widthMm * VIEWPORT_SCALE} 
                height={activeSpecs.heightMm * VIEWPORT_SCALE}
                className="bg-white max-h-[70vh] w-auto"
                style={{ width: activeSpecs.widthMm * (VIEWPORT_SCALE / 2) + 'px' }}
              />
              <div className="absolute inset-0 pointer-events-none border border-blue-500/10"></div>
              
              {isProcessing && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  <Loader2 className="text-blue-600 animate-spin mb-4" size={48} />
                  <span className="text-blue-700 font-black text-sm uppercase tracking-widest animate-pulse">Анализ лица...</span>
                </div>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-4 border-dashed border-slate-300 rounded-[2rem] p-12 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer w-full h-80 sm:h-[500px]">
              <div className="bg-blue-100 p-6 rounded-full mb-6 text-blue-600 shadow-inner">
                 <Upload size={48} />
              </div>
              <span className="text-slate-700 font-bold text-lg text-center leading-tight">Загрузите фото<br/><span className="text-slate-400 font-medium text-sm">AI автоматически выставит масштаб</span></span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex-[1.2] p-6 flex flex-col border-l border-slate-100 bg-white overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tighter flex items-center uppercase">
                ПРЕСТИЖ <span className="ml-1.5 text-blue-600">РЕЗАК</span>
              </h2>
              <div className="flex items-center mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vision Engine v2.0</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-5 flex-grow">
            {/* Format Selector */}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Тип документа</label>
               <div className="relative">
                 <select 
                    value={isCustom ? 'custom' : selectedVariant.id}
                    onChange={(e) => {
                       if (e.target.value === 'custom') {
                         setIsCustom(true);
                       } else {
                         setIsCustom(false);
                         const v = PHOTO_VARIANTS.find(x => x.id === e.target.value);
                         if (v) {
                            setSelectedVariant(v);
                            if (image) autoAlign(image, v);
                         }
                       }
                    }}
                    className="w-full appearance-none bg-slate-50 border-2 border-slate-100 text-slate-900 font-bold py-3 px-4 pr-10 rounded-2xl focus:outline-none focus:border-blue-500 transition-all cursor-pointer text-sm"
                 >
                   {PHOTO_VARIANTS.map(v => (
                     <option key={v.id} value={v.id}>{v.label}</option>
                   ))}
                   <option value="custom">Произвольный размер...</option>
                 </select>
                 <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>
            </div>

            {/* Custom Inputs */}
            {isCustom && (
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center text-blue-700 mb-3 text-[10px] font-black uppercase tracking-widest">
                  <Ruler size={14} className="mr-2" /> Свои размеры (мм)
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-[9px] text-slate-400 font-bold mb-1 block">Ширина</label>
                     <input 
                       type="number" 
                       value={customWidth} 
                       onChange={(e) => setCustomWidth(Math.max(1, parseInt(e.target.value) || 0))}
                       className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                   <div>
                     <label className="text-[9px] text-slate-400 font-bold mb-1 block">Высота</label>
                     <input 
                       type="number" 
                       value={customHeight} 
                       onChange={(e) => setCustomHeight(Math.max(1, parseInt(e.target.value) || 0))}
                       className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                </div>
              </div>
            )}

            {/* Manual Adjustments Block */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
               <div className="flex items-center text-slate-600 mb-1 text-[10px] font-black uppercase tracking-widest">
                 <Settings2 size={14} className="mr-2" /> Точная настройка
               </div>
               
               <div className="space-y-3">
                  {/* Scale Input */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase">Масштаб (%)</label>
                      <span className="text-[10px] font-black text-blue-600">{Math.round(crop.scale * 100)}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                       <input 
                         type="range" min="0.1" max="10" step="0.01"
                         value={crop.scale} 
                         onChange={(e) => setCrop(p => ({ ...p, scale: parseFloat(e.target.value) }))}
                         className="flex-grow accent-blue-600 h-1"
                       />
                       <input 
                         type="number" step="1"
                         value={Math.round(crop.scale * 100)} 
                         onChange={(e) => setCrop(p => ({ ...p, scale: (parseInt(e.target.value) || 0) / 100 }))}
                         className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center"
                       />
                    </div>
                  </div>

                  {/* Offset Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold mb-1 block uppercase">Сдвиг X (%)</label>
                      <input 
                         type="number" step="0.1"
                         value={crop.x.toFixed(1)} 
                         onChange={(e) => setCrop(p => ({ ...p, x: parseFloat(e.target.value) || 0 }))}
                         className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold mb-1 block uppercase">Сдвиг Y (%)</label>
                      <input 
                         type="number" step="0.1"
                         value={crop.y.toFixed(1)} 
                         onChange={(e) => setCrop(p => ({ ...p, y: parseFloat(e.target.value) || 0 }))}
                         className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center"
                      />
                    </div>
                  </div>
               </div>
            </div>

            {/* AI Align Button (only for presets) */}
            {!isCustom && image && (
               <button 
                 onClick={() => autoAlign(image, selectedVariant)}
                 className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl bg-blue-50 text-blue-600 font-black text-[10px] hover:bg-blue-100 transition-all uppercase tracking-widest border border-blue-100"
               >
                  <Loader2 className={isProcessing ? "animate-spin" : ""} size={14} />
                  <span>Пересчитать ИИ</span>
               </button>
            )}

            <label className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-black text-[10px] hover:bg-slate-50 transition-all cursor-pointer uppercase tracking-widest">
               <Upload size={14} />
               <span>Другое фото</span>
               <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100">
            <button 
              onClick={savePhoto}
              disabled={!image || isProcessing}
              className="w-full py-4 bg-blue-600 text-white rounded-3xl font-black shadow-xl hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center space-x-3"
            >
              <Check size={22} />
              <span className="text-base tracking-tighter uppercase">СКАЧАТЬ JPG</span>
            </button>
            <p className="text-[9px] text-slate-400 text-center mt-3 font-medium uppercase tracking-tighter">Линии разметки не будут видны на файле</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCutter;