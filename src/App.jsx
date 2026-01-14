import React, { useState, useRef, useEffect } from 'react';
import { Camera, Trash2, Download, RefreshCw, Palette, Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const App = () => {
  const [images, setImages] = useState(Array(9).fill(null));
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileInputRefs = useRef([]);

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

  const resetGrid = () => {
    if (window.confirm("確定要清空所有圖片嗎？")) {
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
      setError('請至少上傳一張圖片');
      return;
    }
    setIsGenerating(true);
    setProgress(0);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const cellSize = 500; 
      const gap = 20;
      const totalSize = (cellSize * 3) + (gap * 4);
      canvas.width = totalSize;
      canvas.height = totalSize;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = gap + col * (cellSize + gap);
        const y = gap + row * (cellSize + gap);
        if (!images[i]) {
          ctx.fillStyle = '#F8FAFC';
          drawRoundedRect(ctx, x, y, cellSize, cellSize, 30);
          ctx.fill();
        } else {
          try {
            const img = await loadImage(images[i]);
            ctx.save();
            drawRoundedRect(ctx, x, y, cellSize, cellSize, 30);
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
            drawRoundedRect(ctx, x, y, cellSize, cellSize, 30);
            ctx.fill();
          }
        }
        setProgress(Math.round(((i + 1) / 9) * 100));
      }
      const dataUrl = canvas.toDataURL('image/png', 0.9);
      setPreviewUrl(dataUrl);
    } catch (err) {
      setError('保存失敗，請重試');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col items-center">
      {error && (
        <div className="fixed top-6 mx-4 z-[200] bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertCircle size={24} />
          <span className="font-bold">{error}</span>
        </div>
      )}
      <div className="w-full max-w-md p-6 flex flex-col items-center min-h-screen">
        <header className="text-center mt-6 mb-10">
          <div className="inline-flex p-3 bg-indigo-600 rounded-2xl shadow-lg mb-4">
            <Palette className="text-white w-7 h-7" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">COLOR WALK</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">尋找街道上的色彩節奏</p>
        </header>
        <div className="w-full aspect-square bg-white p-3 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 grid grid-cols-3 gap-3">
          {images.map((img, i) => (
            <div
              key={i}
              onClick={() => fileInputRefs.current[i].click()}
              className="relative overflow-hidden rounded-2xl border-2 border-dashed transition-all flex items-center justify-center border-slate-200 active:bg-slate-100 hover:border-indigo-300"
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
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <div className="absolute top-1 right-1 p-1 bg-black/20 text-white rounded-full md:hidden">
                    <X size={10} />
                  </div>
                </>
              ) : (
                <Camera className="text-slate-300" size={28} strokeWidth={1.5} />
              )}
            </div>
          ))}
        </div>
        <div className="w-full mt-12 flex flex-col gap-4">
          <button
            onClick={generateImage}
            disabled={isGenerating}
            className="w-full h-16 bg-indigo-600 text-white rounded-[1.25rem] font-bold text-lg shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-indigo-400"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Download size={22} />}
            {isGenerating ? `正在生成 ${progress}%` : '保存成果'}
          </button>
          <button onClick={resetGrid} className="text-slate-400 font-bold text-sm py-2 flex items-center justify-center gap-2">
            <RefreshCw size={14} /> 重設九宮格
          </button>
        </div>
      </div>
      {previewUrl && (
        <div className="fixed inset-0 z-[150] bg-slate-900/95 flex flex-col items-center justify-center p-6 backdrop-blur-md">
          <div className="w-full max-w-sm flex flex-col items-center gap-6">
            <div className="bg-indigo-500 text-white px-5 py-4 rounded-[1.5rem] flex items-start gap-3 w-full">
              <CheckCircle2 size={24} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-lg">製作完成！</p>
                <p className="text-indigo-100 text-sm">請長按下方圖片並選擇「儲存影像」。</p>
              </div>
            </div>
            <img src={previewUrl} className="w-full h-auto rounded-2xl border-[8px] border-white shadow-2xl" alt="Result" style={{ WebkitTouchCallout: 'default' }} />
            <button onClick={() => setPreviewUrl(null)} className="w-full py-4 bg-white/10 text-white font-bold rounded-2xl border border-white/20">關閉預覽</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
