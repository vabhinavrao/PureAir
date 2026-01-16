
import React from 'react';
import { UserProfile } from '../types';

interface DailySummaryProps {
  avgAqi: number;
  pes: number;
  takeaway: string;
  isLoading: boolean;
  profile: UserProfile;
}

const DailySummary: React.FC<DailySummaryProps> = ({ avgAqi, pes, takeaway, isLoading, profile }) => {
  const protectionScore = Math.max(0, 100 - (pes / 5));
  const scoreColor = protectionScore > 80 ? 'text-green-500' : protectionScore > 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="glass-card p-10 rounded-[50px] border-white/50 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-bl-full blur-3xl pointer-events-none group-hover:bg-blue-600/10 transition-all duration-700" />
      
      <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
        <div className="relative">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-slate-100"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={364.4}
              strokeDashoffset={364.4 - (364.4 * protectionScore) / 100}
              className={`${scoreColor} transition-all duration-1000 ease-out`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-black ${scoreColor}`}>{Math.round(protectionScore)}</span>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Safety %</span>
          </div>
        </div>

        <div className="flex-1 space-y-6 text-center md:text-left">
          <div>
            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
               <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Atmospheric Debrief</h3>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Daily Summary Snapshot</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/40 p-5 rounded-3xl border border-white/60">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mean Intensity</span>
              <span className="text-2xl font-black text-slate-900">{avgAqi} <span className="text-[10px] text-slate-400">AQI</span></span>
            </div>
            <div className="bg-white/40 p-5 rounded-3xl border border-white/60">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Dosage Level</span>
              <span className="text-2xl font-black text-slate-900">{pes} <span className="text-[10px] text-slate-400">PES</span></span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generating Insight...</span>
              </div>
            ) : (
              <div className="flex gap-4 items-start">
                <div className="mt-1">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                  "{takeaway}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySummary;
