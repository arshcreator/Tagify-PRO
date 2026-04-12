import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { AnimatedButton } from '../components/ui/animated-button';

export function Dashboard() {
  const navigate = useNavigate();
  const assets = useStore(state => state.assets);
  const searchQuery = useStore(state => state.searchQuery);
  const currentBatchId = useStore(state => state.currentBatchId);
  const startNewBatch = useStore(state => state.startNewBatch);
  const removeBatch = useStore(state => state.removeBatch);
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'pending' | 'error'>('all');

  const filteredAssets = assets.filter(a => {
    const matchesFilter = filter === 'all' || a.status === filter;
    const matchesSearch = searchQuery === '' || 
      a.file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleExportCSV = () => {
    // Find the latest batch that has completed assets
    const completedAssets = assets.filter(a => a.status === 'completed');
    if (completedAssets.length === 0) return;

    // Group by batchId and find the most recent one
    const batchGroups = completedAssets.reduce((acc, asset) => {
      if (!acc[asset.batchId]) acc[asset.batchId] = [];
      acc[asset.batchId].push(asset);
      return acc;
    }, {} as Record<string, typeof assets>);

    // Sort batches by newest asset creation time
    const sortedBatches = Object.values(batchGroups).sort((a, b) => {
      const maxA = Math.max(...a.map(x => x.createdAt));
      const maxB = Math.max(...b.map(x => x.createdAt));
      return maxB - maxA;
    });

    const latestBatchAssets = sortedBatches[0] || [];
    if (latestBatchAssets.length === 0) return;

    const headers = ['Filename', 'Title', 'Keywords', 'Category'];
    const rows = latestBatchAssets.map(asset => [
      asset.file.name,
      `"${asset.title.replace(/"/g, '""')}"`,
      `"${asset.keywords.join(',')}"`,
      `"${asset.category || 'Uncategorized'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tagify-latest-batch-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleClearOldBatches = () => {
    const oldBatchIds = new Set(assets.filter(a => a.batchId !== currentBatchId).map(a => a.batchId));
    oldBatchIds.forEach(batchId => removeBatch(batchId));
  };

  return (
    <div className="p-12 space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-light text-white tracking-tight">Project Delta</h1>
          <p className="text-white/30 text-[11px] font-medium tracking-widest uppercase mt-3">
            Curated selection • {assets.length} Assets
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <AnimatedButton 
            onClick={startNewBatch}
            className="text-[11px] tracking-widest uppercase"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            New Batch
          </AnimatedButton>
          <button 
            onClick={handleClearOldBatches}
            disabled={assets.filter(a => a.batchId !== currentBatchId).length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-500/10 text-red-500 text-[11px] font-bold tracking-widest uppercase border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
            Clear Old Batches
          </button>
          <AnimatedButton 
            onClick={handleExportCSV}
            disabled={assets.filter(a => a.status === 'completed').length === 0}
            className="text-[11px] tracking-widest uppercase"
          >
            <span className="material-symbols-outlined text-[14px]">download</span>
            Download Latest CSV
          </AnimatedButton>
          <select 
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 text-white/60 text-[11px] font-bold tracking-widest uppercase border border-white/5 hover:bg-white/10 transition-all appearance-none outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All Assets</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="material-symbols-outlined text-6xl text-white/10 mb-6">photo_library</span>
          <h3 className="text-xl font-medium text-white mb-2">No assets found</h3>
          <p className="text-white/40 text-sm mb-8 max-w-md">
            Upload images to automatically generate metadata, titles, and tags using AI.
          </p>
          <AnimatedButton 
            onClick={() => navigate('/upload')}
            className="px-8 py-3 text-[11px] tracking-widest uppercase"
          >
            Upload Images
          </AnimatedButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredAssets.map((asset, index) => (
            <Link 
              key={asset.id} 
              to={`/editor/${asset.id}`}
              className="group bg-[#0a0a0a] border border-white/5 hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-500 hover:bg-[#0f0f0f]"
            >
              <div className="aspect-[4/5] relative overflow-hidden bg-zinc-900 flex items-center justify-center">
                {asset.url ? (
                  <div 
                    className={cn(
                      "absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105",
                      asset.status === 'completed' ? "grayscale-0 opacity-100" : "grayscale opacity-80"
                    )}
                    style={{ backgroundImage: `url(${asset.url})` }}
                  />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-white/10">image</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                
                {asset.status === 'completed' && (
                  <div className="absolute top-6 right-6">
                    <div className="size-6 bg-white rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-black text-[14px] font-black">check</span>
                    </div>
                  </div>
                )}
                
                <div className="absolute bottom-6 left-6">
                  <span className="text-[9px] font-black text-white/40 tracking-[0.2em] uppercase">
                    Ref: {index.toString().padStart(3, '0')}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] font-bold text-white tracking-widest uppercase truncate pr-4">
                    {asset.title || asset.file.name}
                  </h3>
                  <div className={cn(
                    "size-1.5 rounded-full shrink-0",
                    asset.status === 'completed' ? "bg-emerald-500" :
                    asset.status === 'processing' ? "bg-amber-500 animate-pulse" :
                    asset.status === 'error' ? "bg-red-500" : "bg-white/20"
                  )} />
                </div>
                
                <div className="flex gap-2 flex-wrap h-12 overflow-hidden">
                  {asset.keywords.slice(0, 3).map((kw, i) => (
                    <span key={i} className="text-[8px] border border-white/10 text-white/40 px-2 py-0.5 rounded uppercase font-bold tracking-widest">
                      {kw}
                    </span>
                  ))}
                  {asset.keywords.length > 3 && (
                    <span className="text-[8px] border border-white/10 text-white/40 px-2 py-0.5 rounded uppercase font-bold tracking-widest">
                      +{asset.keywords.length - 3}
                    </span>
                  )}
                  {asset.keywords.length === 0 && (
                    <span className="text-[8px] text-white/20 uppercase font-bold tracking-widest">
                      {asset.status === 'pending' ? 'Waiting...' : asset.status === 'processing' ? 'Analyzing...' : 'No tags'}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
