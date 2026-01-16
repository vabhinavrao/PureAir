
import React from 'react';
import { PollutantData } from '../types';

interface Props {
  pollutants: PollutantData;
  aqi: number;
}

const PollutantGrid: React.FC<Props> = ({ pollutants, aqi }) => {
  const items = [
    { label: 'PM2.5', value: pollutants.pm25, unit: 'µg/m³', desc: 'Combustion particles' },
    { label: 'PM10', value: pollutants.pm10, unit: 'µg/m³', desc: 'Dust & Smoke' },
    { label: 'NO2', value: pollutants.no2, unit: 'ppb', desc: 'Traffic exhaust' },
    { label: 'SO2', value: pollutants.so2, unit: 'ppb', desc: 'Power plants' },
    { label: 'CO', value: pollutants.co, unit: 'ppm', desc: 'Incomplete burning' },
    { label: 'O3', value: pollutants.o3, unit: 'ppb', desc: 'Surface ozone' },
  ];

  // Logic for dominant pollutant (Feature 3)
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const dominant = sorted[0].label;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map((item) => {
        const isDominant = item.label === dominant;
        return (
          <div key={item.label} className={`glass-card p-6 rounded-3xl transition-all border-2 ${isDominant ? 'border-blue-400 ring-4 ring-blue-400/10' : 'border-transparent'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
              {isDominant && <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md uppercase">Dominant</span>}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900">{item.value}</span>
              <span className="text-[10px] font-bold text-slate-400">{item.unit}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium leading-tight">{item.desc}</p>
          </div>
        );
      })}
    </div>
  );
};

export default PollutantGrid;
