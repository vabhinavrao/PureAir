
import React from 'react';
import { HourlyForecast } from '../services/aqiService';
import { getAQIConfig } from '../constants';

interface Props {
  forecast: HourlyForecast[];
}

const ForecastStrip: React.FC<Props> = ({ forecast }) => {
  return (
    <div className="glass-card p-8 rounded-[40px] space-y-6 overflow-hidden">
      <div className="flex items-center justify-between px-2">
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Atmospheric Forecast</h4>
          <p className="text-xs font-bold text-slate-900 mt-1 italic">Next 12-hour predictive sequence</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-xl text-blue-600 border border-blue-100 animate-pulse">
           <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
           <span className="text-[9px] font-black uppercase">Live Computation</span>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 scrollbar-hide">
        {forecast.map((item, idx) => {
          const config = getAQIConfig(item.aqi);
          return (
            <div key={idx} className="flex-shrink-0 w-24 flex flex-col items-center group">
              <span className="text-[10px] font-black text-slate-400 mb-3 group-hover:text-slate-900 transition-colors">{item.time}</span>
              <div className={`w-14 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group-hover:scale-110 shadow-lg ${config.light} border-2 ${config.color.replace('bg-', 'border-')}/20`}>
                <span className={`text-xl font-black ${config.text}`}>{item.aqi}</span>
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
              </div>
              <span className="text-[8px] font-bold text-slate-400 uppercase mt-3 text-center px-1 leading-tight">{item.label}</span>
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-2xl text-white">
        <svg className="w-5 h-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[10px] font-bold leading-relaxed opacity-90 italic">
          "The system predicts a <span className="text-blue-400">particulate spike</span> in approx. 4 hours. Recommend rescheduling outdoor protocols."
        </p>
      </div>
    </div>
  );
};

export default ForecastStrip;
