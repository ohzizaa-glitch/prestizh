import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Check, Loader2, Maximize, Move, Info, ChevronDown } from 'lucide-react';
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const VIEWPORT_SCALE = 8; 

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const dataUrl = readerEvent.target?.result as string;
        setImage(dataUrl);
        autoAlign(dataUrl, selectedVariant);
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
        const targetFaceMm = (specs.faceHeightMin + specs.faceHeightMax) / 2;
        const targetTopMm = (specs.topMarginMin + specs.topMarginMax) / 2;
        
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

  const draw = () => {
    if (!canvasRef.current || !imgRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const canvas = canvasRef.current;
    const img = imgRef.current;
    const aspectRatio = selectedVariant.widthMm / selectedVariant.heightMm;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (selectedVariant.isGrayscale) {
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

    // GUIDELINES
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    const tmRatio = (selectedVariant.topMarginMin + selectedVariant.topMarginMax) / 2 / selectedVariant.heightMm;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * tmRatio);
    ctx.lineTo(canvas.width, canvas.height * tmRatio);
    ctx.stroke();

    const headRatio = (selectedVariant.faceHeightMin + selectedVariant.faceHeightMax) / 2 / selectedVariant.heightMm;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * (tmRatio + headRatio));
    ctx.lineTo(canvas.width, canvas.height * (tmRatio + headRatio));
    ctx.stroke();

    // Corner Overlay
    if (selectedVariant.cornerSide) {
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const cornerSize = canvas.width * 0.25;
      
      ctx.beginPath();
      if (selectedVariant.cornerSide === 'left') {
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
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  };

  useEffect(() => {
    if (image) {
      const img = new Image();
      img.src = image;
      img.onload = () => {
        imgRef.current = img;
        draw();
      };
    }
  }, [image, crop, selectedVariant]);

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
    setCrop(prev => ({ ...prev, scale: Math.max(0.1, Math.min(30, prev.scale * delta)) }));
  };

  const savePhoto = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `prestige_${selectedVariant.id}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex flex-col md:flex-row overflow-hidden max-h-[95vh]">
        
        {/* Workspace */}
        <div className="flex-[3] bg-slate-100 flex items-center justify-center p-6 relative group cursor-move overflow-hidden"
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
                width={selectedVariant.widthMm * VIEWPORT_SCALE} 
                height={selectedVariant.heightMm * VIEWPORT_SCALE}
                className="bg-white max-h-[70vh] w-auto"
                style={{
                   width: selectedVariant.widthMm * (VIEWPORT_SCALE / 2) + 'px'
                }}
              />
              <div className="absolute inset-0 pointer-events-none border border-blue-500/10"></div>
              
              {isProcessing && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="relative">
                    <Loader2 className="text-blue-600 animate-spin mb-4" size={48} />
                    <div className="absolute inset-0 text-blue-100/30 animate-pulse"><Loader2 size={48} /></div>
                  </div>
                  <span className="text-blue-700 font-black text-sm uppercase tracking-widest animate-pulse">ИИ рассчитывает пропорции...</span>
                </div>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-4 border-dashed border-slate-300 rounded-[2rem] p-12 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer w-full h-80 sm:h-[500px]">
              <div className="bg-blue-100 p-6 rounded-full mb-6 text-blue-600 shadow-inner">
                 <Upload size={48} />
              </div>
              <span className="text-slate-700 font-bold text-lg">Загрузите фотографию</span>
              <span className="text-slate-400 text-sm mt-2">AI сам найдет лицо и выставит отступы</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          )}

          {image && !isProcessing && (
            <div className="absolute top-6 left-6 bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-2">
               <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
               <span>Направляющие ГОСТ включены</span>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl px-6 py-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
            <div className="flex items-center space-x-1">
               <button onClick={() => setCrop(p => ({ ...p, scale: p.scale * 0.9 }))} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><Maximize size={16} /></button>
               <span className="text-[10px] font-black text-slate-400 w-8 text-center">{Math.round(crop.scale * 100)}%</span>
               <button onClick={() => setCrop(p => ({ ...p, scale: p.scale * 1.1 }))} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><Maximize size={20} /></button>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex items-center space-x-2">
               <Move size={18} className="text-blue-500" />
               <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter leading-none">Тащите мышь<br/>для сдвига</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex-[1.2] p-8 flex flex-col border-l border-slate-100 bg-white overflow-y-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center">
                ПРЕСТИЖ <span className="ml-2 text-blue-600">РЕЗАК</span>
              </h2>
              <div className="flex items-center mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2"></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Vision Powered</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6 flex-grow">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Тип документа</label>
               <div className="relative">
                 <select 
                    value={selectedVariant.id}
                    onChange={(e) => {
                       const v = PHOTO_VARIANTS.find(x => x.id === e.target.value);
                       if (v) {
                          setSelectedVariant(v);
                          if (image) autoAlign(image, v);
                       }
                    }}
                    className="w-full appearance-none bg-slate-50 border-2 border-slate-100 text-slate-900 font-bold py-3 px-4 pr-10 rounded-2xl focus:outline-none focus:border-blue-500 transition-all cursor-pointer text-sm"
                 >
                   {PHOTO_VARIANTS.map(v => (
                     <option key={v.id} value={v.id}>{v.label}</option>
                   ))}
                 </select>
                 <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
               <div className="flex items-center text-blue-600 mb-2">
                 <Info size={16} className="mr-2" />
                 <span className="text-xs font-black uppercase tracking-wider">Параметры ГОСТ</span>
               </div>
               
               <div className="grid grid-cols-2 gap-y-3">
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Размер</p>
                    <p className="text-xs font-bold text-slate-700">{selectedVariant.widthMm} x {selectedVariant.heightMm} мм</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Лицо</p>
                    <p className="text-xs font-bold text-slate-700">{selectedVariant.faceHeightMin === selectedVariant.faceHeightMax ? selectedVariant.faceHeightMin : `${selectedVariant.faceHeightMin}-${selectedVariant.faceHeightMax}`} мм</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Отступ сверху</p>
                    <p className="text-xs font-bold text-slate-700">{selectedVariant.topMarginMin === selectedVariant.topMarginMax ? selectedVariant.topMarginMin : `${selectedVariant.topMarginMin}-${selectedVariant.topMarginMax}`} мм</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Стиль</p>
                    <p className="text-xs font-bold text-slate-700">{selectedVariant.isGrayscale ? 'Черно-белое' : 'Цветное'}</p>
                  </div>
               </div>

               <p className="text-[10px] text-slate-400 leading-relaxed italic border-t border-slate-200 pt-3">
                 {selectedVariant.description}
               </p>
            </div>

            <div className="space-y-3">
               <label className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl border-2 border-slate-100 text-slate-600 font-black text-xs hover:bg-slate-50 transition-all cursor-pointer uppercase tracking-tighter">
                  <Upload size={16} />
                  <span>Другое фото</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
               </label>
               {image && (
                 <button 
                   onClick={() => autoAlign(image, selectedVariant)}
                   className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl bg-blue-50 text-blue-600 font-black text-xs hover:bg-blue-100 transition-all uppercase tracking-tighter"
                 >
                    <Loader2 className={isProcessing ? "animate-spin" : ""} size={16} />
                    <span>AI-Перерасчет</span>
                 </button>
               )}
            </div>
          </div>

          <div className="pt-8 mt-4 border-t border-slate-100">
            <button 
              onClick={savePhoto}
              disabled={!image || isProcessing}
              className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black shadow-xl hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center space-x-3"
            >
              <Check size={24} />
              <span className="text-lg tracking-tighter uppercase">СКАЧАТЬ ФАЙЛ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCutter;