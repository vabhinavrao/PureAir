import React, { useEffect, useState } from 'react';
import { getAQIConfig } from '../constants';

interface Props {
  aqi: number;
  message?: string;
  name?: string;
  isSpeaking?: boolean;
}

const AICharacter: React.FC<Props> = ({ aqi, message, name = "AURA", isSpeaking = false }) => {
  const config = getAQIConfig(aqi);
  const [mouthHeights, setMouthHeights] = useState<number[]>(new Array(12).fill(10));
  
  const getExpression = () => {
    if (aqi <= 0) return { type: 'standby', color: '#64748b', glow: 'rgba(100, 116, 139, 0.5)' };
    if (aqi <= 50) return { type: 'happy', color: '#22c55e', glow: 'rgba(34, 197, 94, 0.6)' };
    if (aqi <= 100) return { type: 'neutral', color: '#eab308', glow: 'rgba(234, 179, 8, 0.6)' };
    if (aqi <= 200) return { type: 'worried', color: '#f97316', glow: 'rgba(249, 115, 22, 0.6)' };
    return { type: 'severe', color: '#dc2626', glow: 'rgba(220, 38, 38, 0.6)' };
  };

  const exp = getExpression();

  useEffect(() => {
    let interval: any;
    if (isSpeaking) {
      interval = setInterval(() => {
        setMouthHeights(new Array(12).fill(0).map(() => Math.random() * 100));
      }, 100);
    } else {
      setMouthHeights(new Array(12).fill(10));
    }
    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div className="flex flex-col items-center group select-none">
      {/* 3D Bot Container */}
      <div className="relative w-48 h-56 flex items-center justify-center pt-8">
        
        {/* Futuristic Floating Shadow/Platform */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900/10 blur-2xl rounded-full scale-x-125 animate-pulse" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-24 h-2 bg-blue-500/5 blur-lg rounded-full animate-ping" />

        {/* The 3D Body */}
        <div className={`relative w-36 h-36 ${isSpeaking ? 'animate-[bot-talking_0.2s_ease-in-out_infinite]' : 'animate-[bot-hover_4s_ease-in-out_infinite]'}`}>
          
          {/* Main Sphere Body with 3D Gradients */}
          <div className="absolute inset-0 rounded-[42%] shadow-2xl overflow-hidden border-b-8 border-slate-300/50"
               style={{
                 background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f8fafc 40%, #cbd5e1 100%)',
                 boxShadow: 'inset -8px -8px 20px rgba(0,0,0,0.1), inset 8px 8px 20px rgba(255,255,255,0.8), 0 20px 40px rgba(0,0,0,0.15)'
               }}>
            
            {/* Top Gloss Reflection */}
            <div className="absolute top-2 left-6 w-16 h-8 bg-white/40 blur-md rounded-full rotate-[-15deg]" />

            {/* Face Screen Section (Inset 3D look) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[65%] bg-slate-900 rounded-[30%] border-4 border-slate-800 shadow-[inset_0_4px_12px_rgba(0,0,0,0.8),0_2px_4px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center overflow-hidden">
              
              {/* Screen Scanning Line */}
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                   style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 3px)' }} />

              {/* Eyes Layout */}
              <div className="flex gap-4 mb-3 z-10">
                {['left', 'right'].map((side) => (
                  <div key={side} className="relative w-6 h-6 flex items-center justify-center">
                    {/* Glowing Eye Core */}
                    <div className="w-4 h-4 rounded-full transition-all duration-500"
                         style={{ 
                           backgroundColor: exp.color, 
                           boxShadow: `0 0 15px ${exp.glow}, 0 0 30px ${exp.glow}`
                         }}>
                      {/* Pupil */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white/80 rounded-full blur-[1px]" />
                      </div>
                    </div>
                    {/* Expression Overlay */}
                    {exp.type === 'happy' && (
                      <div className="absolute -top-1 w-7 h-4 bg-slate-900 rounded-full" />
                    )}
                    {exp.type === 'worried' && (
                      <div className="absolute -top-1 w-7 h-4 bg-slate-900 rounded-full rotate-[15deg] translate-y-1" />
                    )}
                  </div>
                ))}
              </div>

              {/* Mouth Frequency Wave */}
              <div className="flex items-center gap-0.5 h-4 px-4 overflow-hidden">
                {mouthHeights.map((height, i) => (
                  <div key={i} 
                       className="w-1 rounded-full transition-all duration-100"
                       style={{ 
                         height: `${height}%`,
                         backgroundColor: exp.color,
                         opacity: isSpeaking ? 1 : 0.6,
                         boxShadow: isSpeaking ? `0 0 12px ${exp.glow}` : `0 0 4px ${exp.glow}`
                       }} 
                  />
                ))}
              </div>
            </div>
            
            {/* Vent Details */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {[1, 2, 3].map(v => <div key={v} className="w-3 h-1 bg-slate-400/30 rounded-full" />)}
            </div>
          </div>

          {/* Exterior Hardware: Ears/Antennas with 3D depth */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-12 bg-slate-200 rounded-l-2xl border-r-4 border-slate-300 shadow-lg" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-12 bg-slate-200 rounded-r-2xl border-l-4 border-slate-300 shadow-lg" />
          
          {/* Top Antenna */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-3 h-3 rounded-full shadow-lg transition-all duration-500 animate-pulse"
                 style={{ backgroundColor: exp.color, boxShadow: `0 0 10px ${exp.glow}` }} />
            <div className="w-1.5 h-8 bg-slate-300 rounded-full border-x border-slate-400 shadow-inner" />
          </div>

          {/* Bottom Repulsor Glow */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-2 bg-blue-400/20 blur-sm rounded-full" />
        </div>
      </div>

      {/* Modern High-Tech Speech Bubble */}
      <div className="mt-4 relative w-full max-w-[320px] animate-in slide-in-from-bottom-4 duration-1000">
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-[2.5rem] rounded-tl-none shadow-2xl border border-blue-100 relative group overflow-hidden">
          {/* Subtle Corner Accent */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase">System Intelligence</span>
            <div className="ml-auto flex gap-1">
              <div className="w-1 h-3 bg-slate-200 rounded-full" />
              <div className="w-1 h-3 bg-slate-300 rounded-full" />
              <div className="w-1 h-3 bg-blue-400 rounded-full" />
            </div>
          </div>
          
          <p className={`text-[13px] font-bold leading-relaxed text-slate-800 transition-opacity duration-300 ${isSpeaking ? 'opacity-100' : 'opacity-80'}`}>
            {message || "Telemetry stream established. Calibration complete. Analyzing atmospheric density for your current coordinates..."}
          </p>

          {/* Diagnostic Stats Overlay (Simulated) */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between">
             <div className="flex flex-col">
               <span className="text-[8px] font-black text-slate-400 uppercase">Latency</span>
               <span className="text-[10px] font-bold text-slate-600">14ms</span>
             </div>
             <div className="flex flex-col text-right">
               <span className="text-[8px] font-black text-slate-400 uppercase">Signal</span>
               <span className="text-[10px] font-bold text-blue-600 uppercase">Strong</span>
             </div>
          </div>
        </div>
        
        {/* Pointer Shadow */}
        <div className="absolute -top-3 left-0 w-0 h-0 border-l-[20px] border-l-transparent border-b-[20px] border-b-white/90 drop-shadow-sm" />
      </div>

      <style>{`
        @keyframes bot-hover {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes bot-talking {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
};

export default AICharacter;