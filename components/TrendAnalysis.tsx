
import React, { useState, useMemo } from 'react';
import { HistoricalEntry, TrendInsights } from '../types';
import FeedbackControl from './FeedbackControl';

interface Props {
  history: HistoricalEntry[];
  insights: TrendInsights | null;
  isLoading: boolean;
}

const TrendAnalysis: React.FC<Props> = ({ history, insights, isLoading }) => {
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const displayHistory = useMemo(() => {
    const limit = period === 'week' ? 7 : 30;
    return [...history].slice(-limit);
  }, [history, period]);

  const stats = useMemo(() => {
    if (displayHistory.length === 0) return null;
    const totalAqi = displayHistory.reduce((sum, h) => sum + h.aqi, 0);
    const avgAqi = Math.round(totalAqi / displayHistory.length);
    const peakAqi = Math.max(...displayHistory.map(h => h.aqi));
    const safeDays = displayHistory.filter(h => h.aqi <= 50).length;
    
    return { avgAqi, peakAqi, safeDays };
  }, [displayHistory]);

  const maxAqiInView = useMemo(() => {
    return displayHistory.length > 0 ? Math.max(...displayHistory.map(h => h.aqi), 100) : 100;
  }, [displayHistory]);

  const riskColors = {
    Low: 'text-green-600 bg-green-50 border-green-200',
    Moderate: 'text-orange-600 bg-orange-50 border-orange-200',
    Significant: 'text-red-600 bg-red-50 border-red-200'
  };

  return (
    <div className="glass-card p-8 rounded-[40px] space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h4 className="text-xl font-black text-slate-900 tracking-tight">Environmental Chronology</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Long-term exposure tracking</p>
        </div>
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button 
            onClick={() => setPeriod('week')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Week
          </button>
          <button 
            onClick={() => setPeriod('month')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
            <div className="text-2xl font-black text-slate-900">{stats.avgAqi}</div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg AQI</div>
          </div>
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
            <div className="text-2xl font-black text-slate-900">{stats.peakAqi}</div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Peak AQI</div>
          </div>
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
            <div className="text-2xl font-black text-slate-900">{stats.safeDays}</div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Safe Days</div>
          </div>
        </div>
      )}

      {/* Dynamic Chart */}
      <div className="relative pt-6">
        <div className="flex items-end justify-between gap-1 h-32 px-1 border-b border-slate-100 pb-2">
          {displayHistory.length === 0 ? (
            <div className="w-full text-center text-slate-400 text-xs italic py-10">Accumulating trend data...</div>
          ) : (
            displayHistory.map((entry, i) => (
              <div key={i} className="flex-1 group relative flex flex-col items-center max-w-[40px]">
                <div 
                  className={`w-full rounded-t-lg transition-all duration-700 hover:brightness-95 ${entry.aqi > 150 ? 'bg-red-400' : entry.aqi > 100 ? 'bg-orange-400' : 'bg-blue-400'}`}
                  style={{ height: `${(entry.aqi / maxAqiInView) * 100}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl pointer-events-none">
                    {entry.aqi} AQI • {entry.date}
                  </div>
                </div>
                {period === 'week' && (
                  <span className="text-[8px] font-black text-slate-400 uppercase mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                    {entry.date.split(',')[0]}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
        <div className="absolute top-0 right-0 text-[8px] font-black text-slate-300 uppercase tracking-widest pointer-events-none">
          Cumulative Intensity
        </div>
      </div>

      {/* Risk Summary Overlay */}
      {insights && (
        <div className={`p-6 rounded-3xl border-2 animate-in fade-in slide-in-from-bottom-2 duration-500 ${riskColors[insights.cumulativeRisk]}`}>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
             </div>
             <h5 className="text-[11px] font-black uppercase tracking-widest">AI Clinical Risk Analysis</h5>
          </div>
          <p className="text-sm font-bold leading-relaxed mb-4">{insights.summary}</p>
          <div className="bg-white/40 p-4 rounded-2xl border border-white/20">
             <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Strategic Protocol</span>
             </div>
             <p className="text-xs font-bold">{insights.improvementSuggestion}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
             <FeedbackControl compact />
          </div>
        </div>
      )}
      
      {isLoading && !insights && (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-slate-100 rounded-3xl" />
          <div className="h-12 bg-slate-100 rounded-2xl w-2/3" />
        </div>
      )}
    </div>
  );
};

export default TrendAnalysis;
