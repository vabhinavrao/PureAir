
import React from 'react';
import { HealthAdvice } from '../types';

interface Props {
  advice?: HealthAdvice;
  isLoading: boolean;
}

const AdviceSection: React.FC<Props> = ({ advice, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-card p-6 rounded-3xl border-white/5 min-h-[220px] space-y-4">
        <div className="h-4 w-1/4 bg-slate-700/50 rounded-full animate-pulse" />
        <div className="h-16 w-full bg-slate-700/50 rounded-xl animate-pulse" />
        <div className="h-20 w-full bg-slate-700/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!advice) return null;

  return (
    <div className="glass-card p-6 rounded-3xl border-white/5 space-y-6">
      <div>
        <h4 className="font-bold text-white flex items-center gap-2">
          <span className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          Intelligence Summary
        </h4>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">{advice.general}</p>
      </div>

      <div className="p-4 bg-orange-950/20 border border-orange-500/10 rounded-2xl">
        <h5 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Precaution: Sensitive Groups</h5>
        <p className="text-xs text-slate-400 leading-relaxed">{advice.sensitiveGroups}</p>
      </div>

      <div>
        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Recommended Protocols</h5>
        <ul className="space-y-3">
          {advice.protectiveMeasures.map((measure, idx) => (
            <li key={idx} className="flex gap-3 text-sm text-slate-300 items-start">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-500/10 text-blue-400 rounded flex items-center justify-center text-[10px] font-bold border border-blue-500/20">
                {idx + 1}
              </span>
              <span className="leading-tight">{measure}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <p className="text-[9px] text-slate-600 mt-4 border-t border-white/5 pt-4 uppercase tracking-tighter">
        Data synthesized by Gemini 3 • Not a substitute for medical expertise.
      </p>
    </div>
  );
};

export default AdviceSection;
