import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { processImage, queue } from '../lib/ai';
import { AnimatedButton } from '../components/ui/animated-button';

export function Queue() {
  const assets = useStore(state => state.assets);
  const logs = useStore(state => state.logs);
  const isProcessing = useStore(state => state.isProcessing);
  const [throughput, setThroughput] = useState(0);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const navigate = useNavigate();

  const completed = assets.filter(a => a.status === 'completed').length;
  const processing = assets.filter(a => a.status === 'processing').length;
  const pending = assets.filter(a => a.status === 'pending').length;
  const total = assets.length;

  const activeAssets = assets
    .filter(a => a.status === 'processing' || a.status === 'pending' || a.status === 'paused')
    .sort((a, b) => sortOrder === 'asc' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt)
    .slice(0, 5);

  useEffect(() => {
    // Calculate throughput (items per second)
    const interval = setInterval(() => {
      const recentLogs = logs.filter(l => l.type === 'success' && Date.now() - l.timestamp < 5000);
      setThroughput(recentLogs.length / 5);
    }, 1000);
    return () => clearInterval(interval);
  }, [logs]);

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full p-6 lg:p-12 bg-[#050505]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white/40 font-bold text-[10px] tracking-[0.2em] uppercase">
            <span className={cn(
              "size-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]",
              isProcessing ? "bg-white animate-pulse" : "bg-white/20"
            )}></span>
            Live System Status
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-white">Processing Queue</h1>
          <p className="text-white/50 max-w-lg text-sm leading-relaxed">
            Multi-modal AI engine processing active data clusters. Monochromatic monitoring for high-precision oversight.
          </p>
        </div>
        <div>
          <AnimatedButton 
            onClick={() => {
              useStore.getState().startNewBatch();
              navigate('/upload');
            }}
            className="px-8 py-4 text-xs font-black tracking-widest uppercase hover:scale-[1.02] transition-transform active:scale-[0.98] shadow-2xl"
          >
            New Batch
          </AnimatedButton>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 p-6 rounded-2xl">
          <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest block mb-2">Total Processed</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{completed}</span>
            <span className="text-white/40 text-[10px] font-bold">/ {total}</span>
          </div>
          <div className="mt-4 h-[1px] w-full bg-white/10 overflow-hidden relative">
            <div 
              className="h-full bg-white/40 transition-all duration-500" 
              style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 p-6 rounded-2xl">
          <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest block mb-2">Throughput</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{throughput.toFixed(1)} <span className="text-xs font-medium text-white/50">t/s</span></span>
          </div>
          <div className="mt-4 flex gap-1 items-end h-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-[2px] bg-white transition-all duration-300",
                  isProcessing ? "animate-pulse" : "opacity-20"
                )} 
                style={{ height: `${Math.random() * 100}%` }}
              ></div>
            ))}
          </div>
        </div>
        
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 p-6 rounded-2xl">
          <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest block mb-2">Active Batches</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{processing}</span>
          </div>
          <div className="mt-4 flex -space-x-1.5">
            {Array.from({ length: Math.min(3, processing || 1) }).map((_, i) => (
              <div key={i} className="size-5 rounded-full bg-white/20 border border-black text-white text-[8px] flex items-center justify-center font-bold">
                {String(i + 1).padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white/[0.05] backdrop-blur-xl border border-white/20 p-6 rounded-2xl">
          <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest block mb-2">System Load</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">
              {isProcessing ? 'PROCESSING' : 'STABLE'}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className={cn("size-1.5 rounded-full", isProcessing ? "bg-amber-500 animate-pulse" : "bg-white")}></span>
            <span className="text-[9px] text-white/40 font-bold tracking-wider uppercase">
              {isProcessing ? 'High Load' : 'Optimal State'}
            </span>
          </div>
        </div>
      </div>

      {/* Active Batches Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xs font-black tracking-[0.2em] uppercase text-white/50">Active Processing Batches</h2>
          <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 text-[10px] font-bold text-white/50 uppercase tracking-widest hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">
              {sortOrder === 'asc' ? 'arrow_downward' : 'arrow_upward'}
            </span>
            Sort
          </button>
        </div>

        {activeAssets.map((asset) => (
          <div key={asset.id} className={cn(
            "bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-xl p-6 group transition-all duration-500",
            asset.status === 'pending' ? "opacity-50 hover:opacity-100" : "hover:border-white/20"
          )}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="flex-1 space-y-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold tracking-tight text-white truncate max-w-md">
                      {asset.file.name}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">
                        ID: #{asset.id.split('-')[0]}
                      </span>
                      <span className="px-2 py-0.5 rounded-full border border-white/10 text-[8px] font-bold text-white/40 uppercase">
                        Vision-XL Model
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-3xl font-extrabold tracking-tighter",
                      asset.status === 'pending' ? "text-white/40" : "text-white"
                    )}>
                      {asset.progress}%
                    </span>
                  </div>
                </div>
                
                <div className="relative w-full h-[2px] bg-white/5 overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-white transition-all duration-1000"
                    style={{ width: `${asset.progress}%` }}
                  >
                    {asset.status === 'processing' && (
                      <div className="absolute inset-0 opacity-40 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] bg-[length:200%_100%] animate-[shimmer_3s_infinite_linear]"></div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-12 lg:pl-12 lg:border-l border-white/5">
                <div className="min-w-[80px]">
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">
                    {asset.status === 'pending' ? 'Queue' : 'Status'}
                  </p>
                  <p className={cn(
                    "text-xs font-bold uppercase flex items-center gap-2",
                    asset.status === 'pending' || asset.status === 'paused' ? "text-white/50" : "text-white"
                  )}>
                    {asset.status === 'processing' && (
                      <span className="size-1 rounded-full bg-white animate-pulse"></span>
                    )}
                    {asset.status}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (asset.status === 'processing') {
                        useStore.getState().updateAsset(asset.id, { status: 'paused' });
                      } else if (asset.status === 'paused') {
                        useStore.getState().updateAsset(asset.id, { status: 'pending' });
                        queue.add(() => processImage(asset.id));
                      } else if (asset.status === 'pending') {
                        useStore.getState().updateAsset(asset.id, { status: 'paused' });
                      }
                    }}
                    className="size-8 rounded-full border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">
                      {asset.status === 'processing' ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                  <button 
                    onClick={() => useStore.getState().removeAsset(asset.id)}
                    className="size-8 rounded-full border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {assets.length === 0 && (
          <div className="text-center py-12 text-white/40 text-sm font-medium">
            No active batches. Upload images to start processing.
          </div>
        )}
      </div>

      {/* Activity Logs */}
      <div className="mt-20 border-t border-white/5 pt-12">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-black tracking-[0.3em] uppercase text-white/50">Recent Operations</h3>
          <button 
            onClick={() => useStore.getState().clearLogs()}
            className="text-[10px] font-bold text-white hover:opacity-70 transition-opacity uppercase tracking-widest"
          >
            Archive Logs
          </button>
        </div>
        
        <div className="overflow-hidden bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/5">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] uppercase font-black text-white/50 bg-white/5">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Event Description</th>
                <th className="px-6 py-4">Node Origin</th>
                <th className="px-6 py-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.slice(0, 10).map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5 text-[11px] font-medium text-white/80">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-5 text-[11px] text-white/60">
                    {log.message}
                  </td>
                  <td className="px-6 py-5 text-[11px] text-white/50 font-mono">
                    {log.origin}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className={cn(
                      "inline-block size-1.5 rounded-full",
                      log.type === 'success' ? "bg-emerald-500" :
                      log.type === 'error' ? "bg-red-500" :
                      log.type === 'warning' ? "bg-amber-500" : "bg-white"
                    )}></span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[11px] text-white/40">
                    No recent operations
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
