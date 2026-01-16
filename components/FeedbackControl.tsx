
import React, { useState } from 'react';

interface FeedbackProps {
  compact?: boolean;
  context?: string;
  onFeedbackSent?: (score: number) => void;
}

const FeedbackControl: React.FC<FeedbackProps> = ({ compact = false, context = "General System Insight", onFeedbackSent }) => {
  const [isRating, setIsRating] = useState(false);
  const [calibrated, setCalibrated] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  const handleRate = (val: number) => {
    setCalibrated(true);
    setIsRating(false);
    
    // Structured Telemetry Logging
    const telemetryData = {
      event: 'AI_INSIGHT_RATING',
      timestamp: new Date().toISOString(),
      score: val,
      context: context.substring(0, 100) + (context.length > 100 ? '...' : ''),
      node: 'AURA_CORE_V2'
    };
    
    console.info(`[TELEMETRY SYNC] Feedback recorded:`, telemetryData);
    
    if (onFeedbackSent) {
      onFeedbackSent(val);
    }
  };

  if (calibrated) {
    return (
      <div className="flex items-center gap-3 text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] animate-in slide-in-from-right-2 duration-300">
        <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        Telemetry Synchronized
      </div>
    );
  }

  if (isRating) {
    return (
      <div className="flex flex-col gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 animate-in fade-in scale-95 duration-200">
        <div className="flex justify-between items-center px-1">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Calibrate Insight Quality</span>
          <button onClick={() => setIsRating(false)} className="text-slate-300 hover:text-slate-500 transition-colors">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((val) => (
            <button
              key={val}
              onMouseEnter={() => setHovered(val)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleRate(val)}
              className={`w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center text-xs font-black ${
                (hovered || 0) >= val 
                ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg shadow-blue-500/20' 
                : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-4'}`}>
      {!compact && (
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Response Accuracy:</span>
      )}
      <button 
        onClick={() => setIsRating(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-500/30 transition-all group active:scale-95 border border-white/10"
      >
        <svg className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
        </svg>
        Rate Insight
        <span className="flex h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse ml-1" />
      </button>
    </div>
  );
};

export default FeedbackControl;
