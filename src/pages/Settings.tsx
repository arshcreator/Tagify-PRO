import { useStore } from '../store/useStore';
import { useState } from 'react';
import { cn } from '../lib/utils';

export function Settings() {
  const { settings, updateSettings } = useStore();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-6 lg:p-12 bg-[#050505]">
      <div className="flex flex-col gap-2 mb-12">
        <h1 className="text-4xl font-light tracking-tight text-white">Settings</h1>
        <p className="text-white/50 text-sm">Configure AI models and metadata generation rules</p>
      </div>

      <div className="space-y-12">
        {/* API Keys */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <span className="material-symbols-outlined text-white/40">key</span>
            <h2 className="text-sm font-bold tracking-widest uppercase text-white">API Configuration</h2>
          </div>

          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Google Gemini API Key</label>
              <input 
                type="password" 
                value={settings.geminiKey}
                onChange={(e) => updateSettings({ geminiKey: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 focus:border-white/20 rounded-lg px-4 py-3 text-sm text-white transition-all outline-none"
                placeholder="AI Studio key (optional if set in env)"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Groq API Keys</label>
              <textarea 
                value={(settings.groqKeys || []).join('\n')}
                onChange={(e) => updateSettings({ groqKeys: e.target.value.split('\n').map(k => k.trim()).filter(Boolean) })}
                className="w-full bg-white/[0.03] border border-white/10 focus:border-white/20 rounded-lg px-4 py-3 text-sm text-white transition-all outline-none min-h-[100px] resize-y"
                placeholder="gsk_...\ngsk_...\n(One key per line)"
              />
              <p className="text-[10px] text-white/40">Add multiple keys (one per line) to automatically rotate and bypass rate limits.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">OpenAI API Key</label>
              <input 
                type="password" 
                value={settings.openaiKey}
                onChange={(e) => updateSettings({ openaiKey: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 focus:border-white/20 rounded-lg px-4 py-3 text-sm text-white transition-all outline-none"
                placeholder="sk-..."
              />
            </div>
          </div>
        </section>

        {/* Generation Settings */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <span className="material-symbols-outlined text-white/40">tune</span>
            <h2 className="text-sm font-bold tracking-widest uppercase text-white">Metadata Rules</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Title Length (Characters)</label>
                <span className="text-xs font-mono text-white/70">{settings.titleLengthChars}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="150" 
                value={settings.titleLengthChars}
                onChange={(e) => updateSettings({ titleLengthChars: parseInt(e.target.value) })}
                className="w-full accent-white"
              />
              <div className="flex justify-between text-[10px] text-white/30 font-bold uppercase tracking-widest">
                <span>1</span>
                <span>150</span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Keyword Count</label>
              <div className="flex flex-col gap-2">
                {([10, 20, 30, 40, 49] as const).map((count) => (
                  <label key={count} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="keywordCount" 
                      value={count} 
                      checked={settings.keywordCount === count}
                      onChange={() => updateSettings({ keywordCount: count })}
                      className="hidden"
                    />
                    <div className={cn(
                      "size-4 rounded-full border flex items-center justify-center transition-all",
                      settings.keywordCount === count ? "border-white bg-white" : "border-white/20 group-hover:border-white/50"
                    )}>
                      {settings.keywordCount === count && <div className="size-1.5 bg-black rounded-full" />}
                    </div>
                    <span className="text-sm text-white/80">{`${count} tags`}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Keyword Style</label>
              <select 
                value={settings.keywordStyle}
                onChange={(e) => updateSettings({ keywordStyle: e.target.value as any })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none appearance-none"
              >
                <option value="stock">Stock Marketplace Optimized</option>
                <option value="seo">SEO Optimized</option>
                <option value="creative">Creative Tags</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Title Tone</label>
              <select 
                value={settings.titleTone}
                onChange={(e) => updateSettings({ titleTone: e.target.value as any })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none appearance-none"
              >
                <option value="descriptive">Descriptive</option>
                <option value="seo">SEO Optimized</option>
                <option value="artistic">Artistic</option>
              </select>
            </div>
          </div>
        </section>

        <div className="pt-8 flex justify-end">
          <button 
            onClick={handleSave}
            className="px-8 py-3 bg-white text-black rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-zinc-200 transition-colors flex items-center gap-2"
          >
            {saved ? (
              <>
                <span className="material-symbols-outlined text-sm">check</span>
                Saved
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
