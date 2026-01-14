import React, { useState, useRef, useEffect } from 'react';
import { Camera, Trash2, Download, RefreshCw, Palette, Loader2, X, AlertCircle, CheckCircle2, Share2, Info } from 'lucide-react';

const App = () => {
  const [images, setImages] = useState(Array(9).fill(null));
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileInputRefs = useRef([]);

  // 自動隱藏錯誤訊息
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleImageChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('圖片檔案過大，請選擇縮小後的圖片');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const newImages = [...images];
      newImages[index] = event.target.result;
      setImages(newImages);
    };
    reader.onerror = () => setError('圖片讀取失敗');
    reader.readAsDataURL(file);
  };

  const removeImage = (index, e) => {
    e.stopPropagation();
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  };

  const resetGrid = () => {
    if (window.confirm("確定要清空所有圖片，重新開始尋找色彩嗎？")) {
      setImages(Array(9).fill(null));
      setPreviewUrl(null);
    }
  };

  const drawRoundedRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  };

  const generateImage = async () => {
    const hasImage = images.some(img => img !== null);
    if (!hasImage) {
      setError('請至少捕捉一種色彩');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const cellSize = 600; 
      const gap = 30;
      const margin = 80; // 增加邊距讓產出更精緻
      const totalSize = (cellSize * 3) + (gap * 2) + (margin * 2);
      
      canvas.width = totalSize;
      canvas.height = totalSize;

      // 背景
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = margin + col * (cellSize + gap);
        const y = margin + row * (cellSize + gap);

        if (!images[i]) {
          ctx.fillStyle = '#F1F5F9';
          drawRoundedRect(ctx, x, y, cellSize, cellSize, 40);
          ctx.fill();
        } else {
          try {
            const img = await loadImage(images[i]);
            ctx.save();
            drawRoundedRect(ctx, x, y, cellSize, cellSize, 40);
            ctx.clip();

            const aspect = img.width / img.height;
            let dw, dh, dx, dy;
            if (aspect > 1) {
              dh = cellSize;
              dw = cellSize * aspect;
              dx = x - (dw - cellSize) / 2;
              dy = y;
            } else {
              dw = cellSize;
              dh = cellSize / aspect;
              dx = x;
              dy = y - (dh - cellSize) / 2;
            }
            ctx.drawImage(img, dx, dy, dw, dh);
            ctx.restore();
          } catch (e) {
            ctx.fillStyle = '#FEE2E2';
            drawRoundedRect(ctx, x, y, cellSize, cellSize, 40);
            ctx.fill();
          }
        }
        setProgress(Math.round(((i + 1) / 9) * 100));
      }

      const dataUrl = canvas.toDataURL('image/png', 0.95);
      setPreviewUrl(dataUrl);
    } catch (err) {
      setError('生成藝術畫失敗，請重試');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 flex flex-col items-center">
      {/* 頂部柔和漸層背景裝飾 */}
      <div className="absolute top-0 w-full h-64 bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />

      {/* 錯誤提示 */}
      {error && (
        <div className="fixed top-8 mx-4 z-[200] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertCircle size={20} className="text-rose-400" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="w-full max-w-md p-8 flex flex-col items-center min-h-screen">
        {/* Header */}
        <header className="text-center mt-8 mb-12">
          <div className="relative group inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative p-3.5 bg-white rounded-2xl shadow-sm border border-slate-100">
              <Palette className="text-indigo-600 w-8 h-8" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter mt-6">COLOR WALK</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px w-4 bg-slate-300" />
            <p className="text-slate-400 text-xs font-bold tracking-[0.3em] uppercase">Street Observation</p>
            <div className="h-px w-4 bg-slate-300" />
          </div>
        </header>

        {/* 網格 */}
        <div className="w-full aspect-square bg-white p-4 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 grid grid-cols-3 gap-4">
          {images.map((img, i) => (
            <div
              key={i}
              onClick={() => fileInputRefs.current[i].click()}
              className={`relative overflow-hidden rounded-3xl border transition-all duration-500 flex items-center justify-center group cursor-pointer
                ${img ? 'border-transparent shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50'}`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={el => fileInputRefs.current[i] = el}
                onChange={e => handleImageChange(i, e)}
              />
              {img ? (
                <>
                  <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <button
                    onClick={(e) => removeImage(i, e)}
                    className="absolute top-2 right-2 p-2 bg-white/90 text-slate-900 rounded-full shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
                  >
                    <Trash2 size={14} strokeWidth={2.5} />
                  </button>
                  {/* 手機端顯示的小叉叉 */}
                  <div className="absolute top-1.5 right-1.5 p-1 bg-white/60 text-slate-800 rounded-full md:hidden">
                    <X size={10} />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera className="text-slate-300 group-hover:text-indigo-400 transition-colors" size={26} strokeWidth={1.5} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 底部按鈕區 */}
        <div className="w-full mt-14 space-y-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            <button
              onClick={generateImage}
              disabled={isGenerating}
              className="relative w-full h-18 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-bold text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:bg-indigo-400 disabled:scale-100"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  <span className="tracking-wide">正在調配色彩 {progress}%</span>
                </>
              ) : (
                <>
                  <Download size={20} strokeWidth={2.5} />
                  <span className="tracking-wide text-white">匯出我的色彩節奏</span>
                </>
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-between px-2">
            <button
              onClick={resetGrid}
              className="text-slate-400 font-bold text-xs py-2 hover:text-rose-500 transition-colors flex items-center gap-2 group"
            >
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              重新開始
            </button>
            
            <button className="text-slate-400 font-bold text-xs py-2 hover:text-indigo-600 transition-colors flex items-center gap-2">
              <Info size={14} />
              關於計畫
            </button>
          </div>
        </div>

        <footer className="mt-auto pt-12 pb-6 flex flex-col items-center gap-2">
          <p className="text-[10px] text-slate-300 tracking-[0.4em] uppercase font-black">
            Minimalist Art Tool
          </p>
          <div className="flex gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-slate-200" />
            ))}
          </div>
        </footer>
      </div>

      {/* 成果預覽 Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[150] bg-slate-900/90 flex flex-col items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-sm flex flex-col items-center gap-8">
            
            <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-12 duration-500">
              <div className="flex items-start gap-4 mb-6 px-1">
                <div className="p-3 bg-green-50 rounded-2xl">
                  <CheckCircle2 size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-800 tracking-tight">捕捉完成</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mt-0.5">
                    請<strong>長按下方作品</strong>並選擇「儲存影像」，將這份色彩節奏收藏至相簿。
                  </p>
                </div>
              </div>

              <div className="relative group rounded-2xl overflow-hidden border-[12px] border-white shadow-inner bg-white">
                <img 
                  src={previewUrl} 
                  className="w-full h-auto rounded-lg"
                  alt="Result"
                  style={{ WebkitTouchCallout: 'default' }}
                />
              </div>
            </div>

            <div className="flex flex-col w-full gap-3 animate-in fade-in slide-in-from-bottom-4 delay-300 duration-700">
              <button 
                onClick={() => setPreviewUrl(null)}
                className="w-full py-5 bg-white text-slate-900 font-black rounded-2xl shadow-lg active:scale-95 transition-transform"
              >
                關閉並返回
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .h-18 { height: 4.5rem; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in-top { from { transform: translateY(-1rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-in { animation: fade-in 0.3s ease-out; }
        .slide-in-from-top-4 { animation: slide-in-top 0.4s ease-out; }
      `}} />
    </div>
  );
};

export default App;
