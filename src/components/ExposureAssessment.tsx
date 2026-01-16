
import React from 'react';
import { DailyPlan, UserProfile } from '../types';

interface Props {
  aqi: number;
  plan: DailyPlan;
  profile: UserProfile;
}

const ExposureAssessment: React.FC<Props> = ({ aqi, plan, profile }) => {
  // Logic: Personal Exposure Score (PES)
  // PES = AQI * Duration * Activity_Level_Multiplier * Health_Multiplier
  const activityMap = { indoor: 0.2, commuter: 1.0, athlete: 2.5 };
  const healthMap = { none: 1.0, allergy: 1.5, asthma: 2.5 };
  
  const PES = Math.floor(
    (aqi * plan.durationMinutes / 60) * 
    activityMap[profile.activityLevel] * 
    healthMap[profile.sensitivity]
  );

  const riskLevel = PES < 50 ? 'Nominal' : PES < 150 ? 'Moderate' : 'Critical';
  const riskColor = PES < 50 ? 'bg-emerald-500' : PES < 150 ? 'bg-amber-500' : 'bg-rose-600';
  const riskTextColor = PES < 50 ? 'text-emerald-400' : PES < 150 ? 'text-amber-400' : 'text-rose-400';

  const absorptionRatio = (PES / 250) * 100;

  return (
    <div className="glass-card p-10 rounded-[50px] border-l-[12px] border-slate-900 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
      <div className="absolute top-0 right-0 w-40 h-40 bg-slate-900/5 rounded-bl-full pointer-events-none" />
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Biological Impact Node</h4>
          </div>
          <h5 className="text-2xl font-black text-slate-900 tracking-tight">{plan.activity}</h5>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{plan.durationMinutes} Minute Exposure Session</p>
        </div>
        <div className={`px-5 py-2 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl ${riskColor}`}>
          {riskLevel} Risk
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="space-y-3">
          <div className="flex justify-between items-end">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Particulate Absorption Intake</span>
             <span className={`text-xl font-black ${riskTextColor}`}>{PES} <span className="text-[10px] font-black text-slate-300">PES UNITS</span></span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
            <div className={`h-full ${riskColor} transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,0,0,0.1)]`} style={{ width: `${Math.min(100, absorptionRatio)}%` }} />
          </div>
          <div className="flex justify-between px-1">
             <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">System Baseline</span>
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Daily Safe Threshold: 200</span>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 grid grid-cols-2 gap-6">
           <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Metabolic Load</span>
              <p className="text-sm font-black text-slate-900">{profile.activityLevel === 'athlete' ? 'High Intensity' : 'Standard Baseline'}</p>
           </div>
           <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Respiratory Stress</span>
              <p className={`text-sm font-black ${profile.sensitivity !== 'none' ? 'text-rose-500' : 'text-slate-900'}`}>{profile.sensitivity === 'none' ? 'Nominal' : 'Elevated Protocol'}</p>
           </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
           <p className="text-xs text-slate-600 font-bold leading-relaxed italic">
             "AURA diagnostics confirm that your <span className="text-blue-600 font-black capitalize">{profile.sensitivity}</span> profile increases baseline susceptibility by <span className="text-blue-600 font-black">{(healthMap[profile.sensitivity] * 100 - 100).toFixed(0)}%</span> during this session."
           </p>
        </div>
      </div>
      
      <div className="mt-8 flex items-center gap-3">
         <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
         </div>
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">
           Equivalent to breathing standard indoor air for <span className="text-slate-900">{Math.ceil(PES/8)} hours</span> in a single session.
         </p>
      </div>
    </div>
  );
};

export default ExposureAssessment;
