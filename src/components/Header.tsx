
import React, { useState } from 'react';

interface HeaderProps {
  onLocate: () => void;
  onSearch: (query: string) => void;
  onToggleSidebar: () => void;
  isLoading: boolean;
  isLive: boolean;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  userName?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  onLocate, 
  onSearch, 
  onToggleSidebar,
  isLoading, 
  isLive, 
  notificationsEnabled, 
  onToggleNotifications,
  userName
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 py-4 shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleSidebar}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-white group"
            title="Open System Menu"
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <h1 className="hidden sm:block text-2xl font-black text-white tracking-tighter">PUREAIR <span className="text-blue-500">PRO</span></h1>
          </div>
        </div>

        <div className="flex-1 max-w-xl hidden md:block">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              placeholder="Search global sensors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-6 pr-12 py-3 bg-slate-800/80 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder-slate-500 focus:border-blue-500 outline-none transition-all shadow-inner"
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleNotifications}
            className={`p-3 rounded-2xl transition-all border ${
              notificationsEnabled 
                ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
            }`}
            title={notificationsEnabled ? "Notifications Armed" : "Notifications Silenced"}
          >
            <svg className={`w-5 h-5 ${notificationsEnabled ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          <button
            onClick={onLocate}
            disabled={isLoading && !isLive}
            className={`p-3 rounded-2xl transition-all flex items-center gap-3 px-6 shadow-xl border ${
              isLive 
                ? 'bg-blue-600 text-white border-blue-400' 
                : 'bg-slate-800 text-slate-300 border-white/5 hover:bg-slate-700'
            }`}
          >
            <svg className={`w-5 h-5 ${isLive ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="hidden lg:inline text-xs font-black uppercase tracking-widest">{isLive ? 'Live Tracking' : 'Track Me'}</span>
          </button>

          {userName && (
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">User Alpha</span>
                <span className="text-xs font-bold text-white">{userName}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
