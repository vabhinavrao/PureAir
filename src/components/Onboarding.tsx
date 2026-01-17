
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface Props {
  onComplete: (profile: UserProfile) => void;
  userName?: string; // Pre-filled from Gmail auth
}

const Onboarding: React.FC<Props> = ({ onComplete, userName }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: userName || 'User',
    age: 25,
    activityLevel: 'commuter',
    sensitivity: 'none',
    mainActivity: 'Daily Commute' // Default activity
  });

  const next = () => setStep(s => s + 1);
  const finish = () => onComplete(profile as UserProfile);

  // Skip entire onboarding with defaults
  const skipAll = () => onComplete({
    name: userName || 'User',
    age: 25,
    activityLevel: 'commuter',
    sensitivity: 'none',
    mainActivity: 'Daily Commute'
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900 z-[100] overflow-hidden">
      {/* Background Tech Decor */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 blur-[120px] rounded-full animate-pulse delay-1000" />
      </div>

      <div className="max-w-xl w-full glass-card rounded-[40px] p-12 space-y-10 relative z-10 border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-700">

        {/* Progress Dots - Now 2 steps */}
        <div className="flex justify-center gap-3">
          {[1, 2].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700'}`} />
          ))}
        </div>

        {/* Welcome Header */}
        <div className="text-center pb-2">
          <p className="text-blue-400 font-black text-sm uppercase tracking-widest mb-2">Welcome, {userName || 'User'}</p>
          <p className="text-slate-500 text-xs">Quick calibration • Reconfigure anytime in Settings</p>
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-in slide-in-from-right-4">
            <div className="text-center">
              <h2 className="text-4xl font-black text-white tracking-tight mb-2">Health Profile</h2>
              <p className="text-slate-400 font-bold">Optimize air quality alerts for your needs.</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-black text-slate-500 uppercase tracking-widest block mb-4">Current Age: <span className="text-blue-400 text-lg">{profile.age}</span></label>
                <input
                  type="range" min="1" max="100"
                  className="w-full accent-blue-500 bg-slate-800 h-2 rounded-lg appearance-none cursor-pointer"
                  value={profile.age}
                  onChange={e => setProfile({ ...profile, age: parseInt(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Respiratory Sensitivity</label>
                {['none', 'asthma', 'allergy'].map(s => (
                  <button
                    key={s}
                    onClick={() => setProfile({ ...profile, sensitivity: s as any })}
                    className={`py-4 rounded-xl border-2 transition-all font-bold capitalize ${profile.sensitivity === s ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-600'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={skipAll} className="flex-1 bg-slate-800/50 text-slate-400 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all text-sm">
                  Skip All
                </button>
                <button onClick={next} className="flex-[2] bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all">
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-4">
            <div className="text-center">
              <h2 className="text-4xl font-black text-white tracking-tight mb-2">Activity Profile</h2>
              <p className="text-slate-400 font-bold">Which best describes your lifestyle?</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {['indoor', 'commuter', 'athlete'].map(l => (
                <button
                  key={l}
                  onClick={() => setProfile({ ...profile, activityLevel: l as any })}
                  className={`py-5 px-8 rounded-2xl border-2 text-left transition-all ${profile.activityLevel === l ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800'}`}
                >
                  <div className="font-black text-white capitalize">{l}</div>
                  <div className="text-xs text-slate-500 font-bold mt-1">
                    {l === 'indoor' && "Minimal outdoor exposure, focus on micro-environments."}
                    {l === 'commuter' && "Daily transit, high exposure during peak traffic hours."}
                    {l === 'athlete' && "High-ventilation activities, critical outdoor dependency."}
                  </div>
                </button>
              ))}
              <button
                onClick={finish}
                className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:from-blue-500 hover:to-blue-300 shadow-xl shadow-blue-600/20 transition-all active:scale-95"
              >
                Start PureAir
              </button>
              <p className="text-[10px] text-center text-slate-600 font-black uppercase tracking-widest">Recalibrate anytime in Settings</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
