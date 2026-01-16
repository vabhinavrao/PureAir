
import React from 'react';
import { UserProfile } from '../types';
import FeatureCatalog from './FeatureCatalog';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: () => void;
  onUpdateThreshold: (val: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, profile, onUpdateProfile, onUpdateThreshold }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <aside className={`fixed top-0 left-0 h-full w-full max-w-[400px] bg-slate-900 z-[70] shadow-[30px_0_100px_rgba(0,0,0,0.5)] border-r border-white/10 transition-transform duration-500 ease-out overflow-y-auto scrollbar-hide ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-800/20">
          <div>
            <h2 className="text-xl font-black text-white tracking-tighter">SYSTEM <span className="text-blue-500">CONTROL</span></h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Authorized Node Interface</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 space-y-10">
          
          {/* User Profile Card */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Profile Metadata</h3>
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black text-white shadow-xl">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-black text-white leading-none">{profile.name}</h4>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{profile.age} Cycles • {profile.sensitivity} Risk</span>
                </div>
              </div>
              <button 
                onClick={onUpdateProfile}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-xs font-black text-white uppercase tracking-widest rounded-xl transition-all border border-white/5"
              >
                Recalibrate Identity
              </button>
            </div>
          </section>

          {/* Notification Center */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Alert Protocol</h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${profile.notificationsEnabled ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {profile.notificationsEnabled ? 'ARMED' : 'SILENCED'}
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-8">
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">AQI Red-Line</span>
                    <span className="text-blue-500">{profile.alertThreshold || 100} AQI</span>
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="300" 
                    step="10"
                    value={profile.alertThreshold || 100}
                    onChange={(e) => onUpdateThreshold(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase">
                    <span>Sensitive</span>
                    <span>Dangerous</span>
                  </div>
               </div>
               <p className="text-[9px] font-bold text-slate-500 leading-relaxed italic">
                 "AURA will dispatch a high-priority system notification if local sensors detect a breach of the {profile.alertThreshold || 100} AQI Red-Line."
               </p>
            </div>
          </section>

          {/* System Modules */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">System Modules</h3>
            <div className="grid grid-cols-1 gap-4">
              <FeatureCatalog compact />
            </div>
          </section>

          {/* Diagnostics Footnote */}
          <section className="pt-10 border-t border-white/5 text-center space-y-2">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">AURA Environmental Core v2.5.0</p>
            <p className="text-[10px] font-bold text-slate-700 leading-relaxed">
              All environmental data is synchronized with planetary sensor arrays. Global geolocation active.
            </p>
          </section>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
