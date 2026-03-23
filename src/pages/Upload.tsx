import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { processImage, queue } from '../lib/ai';

export function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const { addAssets, assets, setProcessing } = useStore();
  const navigate = useNavigate();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => 
      file.type.match(/^image\/(jpeg|png|webp|jpg)$/)
    );

    if (validFiles.length > 0) {
      addAssets(validFiles);
      
      // Start processing automatically
      setProcessing(true);
      
      // We need to get the newly added assets from the store
      // Since addAssets is synchronous, we can just get the latest state
      setTimeout(() => {
        const store = useStore.getState();
        const pendingAssets = store.assets.filter(a => a.status === 'pending');
        
        pendingAssets.forEach(asset => {
          queue.add(() => processImage(asset.id));
        });
        
        queue.onEmpty().then(() => {
          useStore.getState().setProcessing(false);
        });
      }, 0);
      
      navigate('/queue');
    }
  };

  const recentAssets = [...assets].reverse().slice(0, 4);

  return (
    <div className="flex-1 flex flex-col p-6 md:p-12 gap-12 bg-[#050505]">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-12">
        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-light tracking-tight text-white">Upload Assets</h1>
          <p className="text-white/50 text-sm">Automated visual metadata generation powered by Tagify</p>
        </div>

        {/* Drag and Drop Area */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-white/5 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          <label
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "relative flex flex-col items-center justify-center gap-10 rounded-2xl border px-10 py-28 transition-all duration-500 cursor-pointer overflow-hidden",
              isDragging 
                ? "border-white/40 bg-white/10" 
                : "border-white/10 bg-white/[0.015] hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
            )}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none opacity-40"></div>
            
            <div className="flex flex-col items-center gap-8 text-center relative z-10">
              <div className="size-16 bg-white/5 rounded-full border border-white/10 flex items-center justify-center text-white/40 group-hover:text-white/80 group-hover:scale-105 transition-all duration-500">
                <span className="material-symbols-outlined text-3xl font-light">add</span>
              </div>
              
              <div className="flex flex-col gap-3 max-w-sm">
                <h3 className="text-xl font-medium tracking-tight text-white">Drop files here</h3>
                <p className="text-white/50 text-xs leading-relaxed uppercase tracking-widest">
                  PNG, JPG, WEBP — MAX 50MB
                </p>
              </div>
            </div>
            
            <div className="relative z-10 px-10 py-3 bg-white hover:bg-slate-200 text-black rounded text-[11px] font-bold tracking-widest uppercase transition-all">
              Select Files
            </div>
            
            <input 
              type="file" 
              multiple 
              accept="image/jpeg, image/png, image/webp" 
              className="hidden" 
              onChange={handleFileInput}
            />
          </label>
        </div>

        {/* Recent Uploads Preview */}
        {recentAssets.length > 0 && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h4 className="font-medium text-sm tracking-tight text-white/40">Library Preview</h4>
              <button 
                onClick={() => navigate('/')}
                className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
              >
                View All
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recentAssets.map((asset, i) => (
                <div key={asset.id} className="group relative aspect-square bg-white/5 rounded border border-white/5 overflow-hidden hover:border-white/20 transition-all duration-500 flex items-center justify-center">
                  {asset.url ? (
                    <img 
                      src={asset.url} 
                      alt={asset.title || 'Preview'} 
                      className="w-full h-full object-cover grayscale opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                    />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-white/10">image</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-[9px] text-white font-bold tracking-widest uppercase truncate">
                      {asset.file.name}
                    </span>
                  </div>
                </div>
              ))}
              
              {Array.from({ length: Math.max(0, 4 - recentAssets.length) }).map((_, i) => (
                <div key={`placeholder-${i}`} className="aspect-square bg-white/[0.02] rounded border border-dashed border-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/5 text-2xl font-light">add_photo_alternate</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
