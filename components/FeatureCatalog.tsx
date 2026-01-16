
import React from 'react';

const features = [
  {
    title: 'Geo-Sync Live',
    desc: 'Hyper-local pollutant tracking with real-time coordinate synchronization.',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
    color: 'bg-blue-500'
  },
  {
    title: 'Route Heatmaps',
    desc: 'Visualize pollution hotspots and intensity gradients across travel paths.',
    icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    color: 'bg-indigo-500'
  },
  {
    title: 'Gemini 3 Insights',
    desc: 'Advanced LLM-driven health protocols synthesized from your profile.',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    color: 'bg-purple-500'
  },
  {
    title: 'Exposure Scoring',
    desc: 'Proprietary PES logic calculates cumulative risk for any activity.',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    color: 'bg-rose-500'
  },
  {
    title: 'Historical Trends',
    desc: 'Month-over-month chronology of your environmental interaction data.',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: 'bg-emerald-500'
  },
  {
    title: 'Smart Protocols',
    desc: 'Instant push-alerts triggered by hyper-local atmospheric spikes.',
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    color: 'bg-amber-500'
  }
];

interface Props {
  compact?: boolean;
}

const FeatureCatalog: React.FC<Props> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex flex-col gap-3">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-default group">
            <div className={`${f.color} w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-current/10 shrink-0`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={f.icon} />
              </svg>
            </div>
            <div>
              <h5 className="text-[10px] font-black text-white uppercase tracking-widest">{f.title}</h5>
              <p className="text-[9px] text-slate-500 font-bold line-clamp-1">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <div key={i} className="glass-card p-6 rounded-[32px] hover:translate-y-[-4px] transition-all group cursor-default border border-white/50 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5">
          <div className={`${f.color} w-12 h-12 rounded-[18px] flex items-center justify-center text-white mb-5 shadow-lg shadow-current/20 group-hover:rotate-6 transition-transform`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={f.icon} />
            </svg>
          </div>
          <h5 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.15em] mb-2">{f.title}</h5>
          <p className="text-[10px] text-slate-500 leading-relaxed font-bold opacity-80">{f.desc}</p>
        </div>
      ))}
    </div>
  );
};

export default FeatureCatalog;
