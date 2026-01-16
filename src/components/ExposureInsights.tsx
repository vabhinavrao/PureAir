
import React from 'react';
import { ExposureInsight } from '../types';

interface Props {
  insight?: ExposureInsight;
  isLoading: boolean;
}

const ExposureInsights: React.FC<Props> = ({ insight, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-card p-6 rounded-3xl border-white/5 min-h-[220px] flex flex-col justify-center gap-4">
        <div className="h-4 w-3/4 bg-slate-700/50 rounded-full animate-pulse" />
        <div className="h-4 w-1/2 bg-slate-700/50 rounded-full animate-pulse" />
        <div className="h-20 w-full bg-slate-700/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!insight) return null;

  const statusColors = {
    Safe: 'text-green-400 bg-green-950/30 border-green-500/20',
    Caution: 'text-yellow-400 bg-yellow-950/30 border-yellow-500/20',
    Avoid: 'text-red-400 bg-red-950/30 border-red-500/20'
  };

  return (
    <div className="glass-card p-6 rounded-3xl border-white/5 space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Outdoor Safety</span>
        <span className={`px-4 py-1 rounded-full text-[10px] font-bold border ${statusColors[insight.status]}`}>
          {insight.status}
        </span>
      </div>

      <div className="flex gap-4">
        <div className="mt-1">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-white">Activity Recommendation</h4>
          <p className="text-sm text-slate-400 leading-relaxed mt-1">{insight.activityAdvice}</p>
        </div>
      </div>

      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h4 className="font-bold text-slate-200 text-sm tracking-wide">Route Risk Analytics</h4>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed italic">{insight.routeRisk}</p>
      </div>
    </div>
  );
};

export default ExposureInsights;
