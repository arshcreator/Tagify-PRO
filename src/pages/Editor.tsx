import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { processImage } from '../lib/ai';
import { AnimatedButton } from '../components/ui/animated-button';

export function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const assets = useStore(state => state.assets);
  const updateAsset = useStore(state => state.updateAsset);
  
  const asset = assets.find(a => a.id === id);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (asset) {
      setTitle(asset.title || '');
      setDescription(asset.description || '');
      setKeywords(asset.keywords || []);
    }
  }, [asset]);

  if (!asset) {
    return (
      <div className="flex items-center justify-center h-full text-white/50">
        Asset not found
      </div>
    );
  }

  const handleSave = () => {
    updateAsset(asset.id, { 
      title: title.substring(0, 999), 
      description: description.substring(0, 4999), 
      keywords: keywords.slice(0, 100) 
    });
    navigate('/');
  };

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newKeyword.trim()) {
      e.preventDefault();
      if (!keywords.includes(newKeyword.trim())) {
        setKeywords([...keywords, newKeyword.trim()]);
      }
      setNewKeyword('');
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const handleSuggest = async () => {
    if (asset.status !== 'processing') {
      await processImage(asset.id);
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-[#0a0a0c]">
      {/* Left Side: Large Preview */}
      <div className="flex-1 relative bg-black flex items-center justify-center p-8 overflow-hidden group">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110 pointer-events-none" 
          style={{ backgroundImage: `url(${asset.url})` }}
        ></div>
        
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <div className={cn("relative max-w-5xl w-full h-full flex items-center justify-center transition-all duration-300", isFullscreen ? "fixed inset-0 z-50 bg-black max-w-none" : "")}>
            {asset.url ? (
              <img 
                src={asset.url} 
                alt={asset.title || asset.file.name} 
                className="max-w-full max-h-full object-contain rounded-sm shadow-2xl transition-transform duration-300" 
                style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-white/20">
                <span className="material-symbols-outlined text-6xl mb-4">image_not_supported</span>
                <p className="text-sm font-medium tracking-widest uppercase">Image not available</p>
                <p className="text-[10px] mt-2 max-w-xs text-center">The original file is no longer available in this session, but the metadata is preserved.</p>
              </div>
            )}
            {!isFullscreen && <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-r from-transparent to-[#0a0a0c] pointer-events-none"></div>}
            
            {isFullscreen && (
              <button 
                onClick={() => setIsFullscreen(false)}
                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Floating Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/5 backdrop-blur-2xl border border-white/10 p-2 rounded-full shadow-2xl z-20">
          <button 
            onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-lg">zoom_in</span>
          </button>
          <button 
            onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-lg">zoom_out</span>
          </button>
          <div className="w-px h-4 bg-white/10"></div>
          <button 
            onClick={() => setRotation(prev => prev + 90)}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-lg">rotate_right</span>
          </button>
          <button 
            onClick={() => setZoom(1)}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-lg">crop_free</span>
          </button>
          <div className="w-px h-4 bg-white/10"></div>
          <button 
            onClick={() => setIsFullscreen(true)}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-lg">fullscreen</span>
          </button>
        </div>
      </div>

      {/* Right Side: Refined Metadata Panel */}
      <aside className="w-[440px] bg-black/40 backdrop-blur-2xl border-l border-white/5 flex flex-col overflow-y-auto">
        {/* Header Info */}
        <div className="p-8 border-b border-white/5">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-light tracking-tight text-white truncate max-w-[280px]">
                {asset.file.name}
              </h1>
              <p className="text-[10px] text-white/50 uppercase tracking-[0.3em] font-bold">
                Metadata Architecture
              </p>
            </div>
            <span className={cn(
              "px-2 py-0.5 text-[9px] font-bold rounded-sm uppercase tracking-wider border",
              asset.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
              asset.status === 'processing' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
              "bg-white/10 text-white/70 border-white/5"
            )}>
              {asset.status}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-px bg-white/5 rounded overflow-hidden border border-white/5">
            <div className="bg-black p-4">
              <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">Type</p>
              <p className="text-sm font-medium text-white/90 uppercase">{(asset.file?.type || asset.fileType || '').split('/')[1] || 'UNKNOWN'}</p>
            </div>
            <div className="bg-black p-4">
              <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">Size</p>
              <p className="text-sm font-medium text-white/90">{((asset.file?.size || asset.fileSize || 0) / (1024 * 1024)).toFixed(1)} MB</p>
            </div>
            {asset.category && (
              <div className="bg-black p-4 col-span-2">
                <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">Category</p>
                <p className="text-sm font-medium text-white/90">{asset.category}</p>
              </div>
            )}
          </div>
        </div>

        {/* Editing Fields */}
        <div className="p-8 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-0.5">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/[0.03] border border-white/10 focus:bg-white/5 focus:border-white/20 focus:shadow-[0_0_20px_rgba(255,255,255,0.03)] rounded-sm px-4 py-3 text-sm text-white/90 transition-all w-full outline-none"
                placeholder="Enter title..."
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-0.5">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="bg-white/[0.03] border border-white/10 focus:bg-white/5 focus:border-white/20 focus:shadow-[0_0_20px_rgba(255,255,255,0.03)] rounded-sm px-4 py-3 text-sm text-white/90 transition-all w-full outline-none resize-none"
                placeholder="Enter description..."
              />
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-0.5">
                Keyword Tags ({keywords.length})
              </label>
              <button 
                onClick={handleSuggest}
                disabled={asset.status === 'processing'}
                className="text-[#0f49bd] text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors disabled:opacity-50"
              >
                {asset.status === 'processing' ? 'Analyzing...' : 'AI Suggest'}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 p-4 bg-white/[0.03] border border-white/10 rounded-sm min-h-[120px] content-start">
              {keywords.map((kw, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-2.5 py-1 rounded-sm group transition-all hover:border-white/20">
                  <span className="text-[11px] font-medium text-white/80">{kw}</span>
                  <button 
                    onClick={() => removeKeyword(kw)}
                    className="material-symbols-outlined text-[14px] text-white/30 hover:text-white"
                  >
                    close
                  </button>
                </div>
              ))}
              
              <input 
                type="text" 
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={handleAddKeyword}
                placeholder="+ Add tag (Press Enter)"
                className="bg-transparent border-none text-[11px] text-white focus:ring-0 p-1 w-32 placeholder:text-white/30 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto p-8 bg-white/[0.02] border-t border-white/5 flex gap-4">
          <button 
            onClick={() => navigate('/')}
            className="flex-1 px-4 py-3.5 rounded-sm border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:bg-white/5 transition-all"
          >
            Discard
          </button>
          <AnimatedButton 
            onClick={handleSave}
            className="flex-[2] px-4 py-3.5 rounded-sm text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
          >
            Apply Changes
          </AnimatedButton>
        </div>
      </aside>
    </div>
  );
}
