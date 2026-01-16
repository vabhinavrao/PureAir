
import React from 'react';
import { AQIResponse } from '../types';
import { getAQIConfig } from '../constants';

interface AQIHeroProps {
  data: AQIResponse;
  isLive: boolean;
  userName?: string;
}

const AQIHero: React.FC<AQIHeroProps> = ({ data, isLive, userName }) => {
  const config = getAQIConfig(data.aqi);
  const addr = data.location.address;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="relative overflow-hidden rounded-[40px] p-12 glass-card border-white/20 shadow-[0_40px_100px_rgba(0,0,0,0.08)]">
      <div className={`absolute -top-24 -right-24 w-80 h-80 rounded-full ${config.color} opacity-10 blur-[120px]`} />
      
      <div className="relative flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="text-center lg:text-left flex-1">
          <div className="flex flex-col gap-1 mb-8">
            <div className="text-blue-500 font-black uppercase text-[10px] tracking-[0.4em] mb-3 flex items-center gap-3 justify-center lg:justify-start">
               <span className="w-6 h-px bg-blue-500/30" />
               Environmental Telemetry Active
               <span className="w-6 h-px bg-blue-500/30" />
            </div>
            {userName && (
              <h1 className="text-4xl font-black text-slate-400 tracking-tight leading-none">
                {getGreeting()}, <span className="text-slate-900">{userName}</span>
              </h1>
            )}
          </div>
          
          <div className="flex flex-col gap-3 mb-10">
            <div className="flex flex-col lg:flex-row items-center gap-4 text-slate-500 font-black text-[11px] uppercase tracking-widest opacity-80 justify-center lg:justify-start">
                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                   <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                   {addr?.houseNumber ? `Premise ${addr.houseNumber}` : 'Local Sector'}
                </div>
                <div className="w-2 h-2 bg-slate-200 rounded-full hidden lg:block" />
                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                   {addr?.road || 'Coordinate Link'}
                </div>
            </div>
            <h2 className="text-2xl font-black text-blue-600 tracking-tight leading-none opacity-90 mt-2">
              {addr?.suburb || addr?.colony || 'Atmospheric Zone'}
            </h2>
            <h3 className="text-7xl font-black text-slate-900 tracking-tighter leading-none">{data.location.city}</h3>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl border border-white/10">
              <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse shadow-[0_0_12px_#22c55e]' : 'bg-slate-400'}`} />
              {isLive ? 'Satellite Tracker Engaged' : 'Static Coordinate Mode'}
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Station Refresh: <span className="text-slate-900">{data.lastUpdated}</span></p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-12 bg-white/50 p-12 rounded-[60px] border border-white/70 shadow-[0_30px_70px_rgba(0,0,0,0.1)] backdrop-blur-2xl relative group hover:scale-[1.02] transition-transform">
          <div className="text-center relative z-10">
            <div className={`text-9xl font-black ${config.text} aqi-glow leading-none tracking-tighter`}>{data.aqi}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-6">Active AQI</div>
          </div>
          <div className="h-32 w-px bg-slate-200/60 hidden md:block" />
          <div className="text-center md:text-left max-w-xs relative z-10">
            <div className={`px-7 py-3 rounded-2xl text-white text-[11px] font-black uppercase tracking-widest ${config.color} shadow-2xl mb-6 inline-block`}>
              {data.category}
            </div>
            <p className="text-slate-800 text-sm font-bold leading-relaxed italic opacity-90">
              "Sensors in <span className="text-blue-600 underline underline-offset-4">{addr?.suburb || addr?.city}</span> report <span className="underline decoration-current underline-offset-4">{data.category.toLowerCase()}</span> particulate saturation."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AQIHero;
