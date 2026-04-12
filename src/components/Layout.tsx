import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import React from 'react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { AnimatedButton } from './ui/animated-button';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const assets = useStore(state => state.assets);
  const searchQuery = useStore(state => state.searchQuery);
  const setSearchQuery = useStore(state => state.setSearchQuery);
  const user = useStore(state => state.user);
  
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  const navItems = [
    { name: 'Workspace', path: '/', icon: 'space_dashboard' },
    { name: 'Upload', path: '/upload', icon: 'add_photo_alternate' },
    { name: 'Queue', path: '/queue', icon: 'queue' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  return (
    <div className="flex h-screen w-full flex-col font-display bg-[#050505] text-slate-200 selection:bg-white selection:text-black overflow-hidden">
      {/* Top Navigation */}
      <header className="flex h-20 items-center justify-between border-b border-white/5 px-12 bg-white/5 backdrop-blur-2xl z-50">
        <div className="flex items-center gap-14">
          <div className="flex items-center gap-3">
            <div className="size-7 bg-white rounded-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-black text-sm">filter_vintage</span>
            </div>
            <h2 className="text-white text-sm font-bold tracking-[0.2em] uppercase">Tagify Pro</h2>
          </div>
          <nav className="hidden lg:flex items-center gap-10">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-[11px] font-bold tracking-widest uppercase transition-colors",
                  location.pathname === item.path ? "text-white" : "text-white/40 hover:text-white"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-8">
          <div className="relative group hidden md:block">
            <input 
              type="text" 
              placeholder="SEARCH ASSETS" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 bg-white/5 border-white/5 rounded-full py-2 px-6 text-[11px] font-medium focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all placeholder:text-white/20 tracking-wider text-white"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-bold tracking-widest text-white uppercase">{user?.displayName || 'User'}</p>
              <p className="text-[9px] text-white/30 tracking-tighter">MEMBER</p>
            </div>
            <div className="relative group">
              <div className="size-10 rounded-full border border-white/10 overflow-hidden bg-white/5 cursor-pointer">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-zinc-800 to-zinc-600"></div>
                )}
              </div>
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#0a0a0c] border border-white/10 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-[11px] font-bold tracking-widest uppercase text-white/70 hover:text-white hover:bg-white/5 transition-colors rounded-lg flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[14px]">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-20 lg:w-72 flex flex-col border-r border-white/5 bg-white/5 backdrop-blur-2xl py-10 px-8">
          <div className="flex flex-col gap-10">
            <AnimatedButton 
              onClick={() => navigate('/upload')}
              className="px-4 py-4"
            >
              <span className="material-symbols-outlined text-xl">add</span>
              <span className="hidden lg:block text-[11px] font-bold tracking-widest uppercase">Upload</span>
            </AnimatedButton>
            
            <div className="space-y-6">
              <p className="hidden lg:block px-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Workspace</p>
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-lg transition-all",
                      location.pathname === item.path 
                        ? "bg-white/10 text-white" 
                        : "text-white/40 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    <span className="hidden lg:block text-[11px] font-bold tracking-widest uppercase">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-auto">
            <div className="hidden lg:block p-6 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Cloud Usage</p>
              <div className="w-full bg-white/5 h-[1px] mb-4">
                <div className="bg-white h-full" style={{ width: `${Math.min(100, (assets.length / 1000) * 100)}%` }}></div>
              </div>
              <p className="text-[11px] font-medium text-white">{assets.length} / 1000 Assets</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#050505]">
          {children}
        </main>
      </div>
    </div>
  );
}
