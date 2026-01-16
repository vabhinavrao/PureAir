
import React, { useState } from 'react';
import { DailyPlan } from '../types';
import { GoogleGenAI } from "@google/genai";

interface Props {
  onPlanSet: (plan: DailyPlan) => void;
}

const PROTOCOLS = [
  { id: 'yoga', label: 'Sunrise Yoga', duration: 40, icon: '🧘', query: 'Safety brief for outdoor yoga in current AQI' },
  { id: 'cycling', label: 'Power Cycling', duration: 60, icon: '🚴', query: 'Respiratory risk for high-intensity cycling now' },
  { id: 'commute', label: 'Transit Mode', duration: 45, icon: '🚌', query: 'Exposure reduction tips for urban transit commute' },
  { id: 'walk', label: 'Brisk Walk', duration: 30, icon: '🚶', query: 'Can I safely walk outdoors for 30 mins?' },
  { id: 'coffee', label: 'Patio Session', duration: 90, icon: '☕', query: 'Risk of prolonged low-activity outdoor exposure' }
];

const DailyPlanner: React.FC<Props> = ({ onPlanSet }) => {
  const [activity, setActivity] = useState('');
  const [duration, setDuration] = useState(30);
  const [diagnostic, setDiagnostic] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const fetchQuickDiagnostic = async (protocolQuery: string) => {
    setIsLoading(true);
    setDiagnostic(null);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Context: You are AURA. Short safety diagnostic (max 15 words) for: ${protocolQuery}.`,
      });
      setDiagnostic(response.text || "Diagnostic failed.");
    } catch (e) {
      setDiagnostic("System busy. Proceed with caution.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectProtocol = (p: typeof PROTOCOLS[0]) => {
    setActivity(p.label);
    setDuration(p.duration);
    onPlanSet({ 
      activity: p.label, 
      durationMinutes: p.duration, 
      startTime: new Date().toLocaleTimeString() 
    });
    fetchQuickDiagnostic(p.query);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const act = activity || 'Custom Protocol';
    onPlanSet({ 
      activity: act, 
      durationMinutes: duration, 
      startTime: new Date().toLocaleTimeString() 
    });
    fetchQuickDiagnostic(`Safety of ${act} for ${duration} minutes.`);
  };

  return (
    <div className="glass-card p-8 rounded-[40px] space-y-8 h-full flex flex-col">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Plan of the Day</h4>
          <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded">AURA Optimized</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {PROTOCOLS.map(p => (
            <button
              key={p.id}
              onClick={() => selectProtocol(p)}
              className="flex items-center gap-3 p-4 bg-white/50 border border-slate-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
            >
              <span className="text-xl shrink-0">{p.icon}</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{p.label}</span>
                <span className="text-[9px] font-bold text-slate-400">{p.duration}m</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Instant Diagnostic Output */}
      <div className={`p-6 rounded-3xl border-2 transition-all min-h-[100px] flex items-center justify-center text-center ${diagnostic ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-dashed border-slate-200'}`}>
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Querying AURA...</span>
          </div>
        ) : diagnostic ? (
          <div className="space-y-2">
            <div className="text-[8px] font-black text-blue-400 uppercase tracking-[0.3em]">AURA Diagnostic</div>
            <p className="text-xs font-bold text-white italic">"{diagnostic}"</p>
          </div>
        ) : (
          <p className="text-[10px] font-bold text-slate-300 px-4">Select a protocol to trigger safety analysis.</p>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-100"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Custom Protocol</span>
        </div>
      </div>

      <form onSubmit={handleManualSubmit} className="space-y-6 flex-1 flex flex-col justify-end">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Activity Identity</label>
          <input 
            type="text" 
            placeholder="e.g., Evening Stroll..."
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-800 focus:border-blue-500 outline-none transition-all shadow-inner"
            value={activity}
            onChange={e => setActivity(e.target.value)}
          />
        </div>
        <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-800 transition-all shadow-xl active:scale-95">
          Execute Protocol
        </button>
      </form>
    </div>
  );
};

export default DailyPlanner;
