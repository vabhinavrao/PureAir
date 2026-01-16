
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, Circle, useMapEvents } from 'react-leaflet';
import { AQILocation, AQIResponse, PollutantData, UserProfile } from '../types';
import { fetchAQIData, fetchForecastData, HourlyForecast, searchCity } from '../services/aqiService';
import { analyzeRoutePollutants } from '../services/geminiService';
import { getAQIConfig } from '../constants';

interface Props {
  currentAqi: number;
  location: AQILocation;
}

type SatelliteLayer = 'heatmap' | 'thermal' | 'airstream' | 'vegetation';

const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const TravelRoutes: React.FC<Props> = ({ currentAqi, location }) => {
  const [activeLayer, setActiveLayer] = useState<SatelliteLayer>('heatmap');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number | null>(null);
  const [clickedInfo, setClickedInfo] = useState<(AQIResponse & { forecast: HourlyForecast[] }) | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [forecastMode, setForecastMode] = useState(false);
  
  // Custom Route Feature States
  const [destinationQuery, setDestinationQuery] = useState('');
  const [customRoute, setCustomRoute] = useState<{ origin: AQILocation; target: AQILocation; pm25Variance: number[] } | null>(null);
  const [routeInsight, setRouteInsight] = useState<{ assessment: string; recommendation: string } | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  const center: [number, number] = [location.lat, location.lon];

  const tileUrls = {
    heatmap: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    thermal: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    airstream: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    vegetation: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  };

  const handleMapClick = useCallback(async (lat: number, lon: number) => {
    setIsSearching(true);
    try {
      const data = await fetchAQIData(lat, lon);
      const forecast = fetchForecastData(data.aqi).slice(0, 4); 
      setClickedInfo({ ...data, forecast });
    } catch (err) {
      console.error("Failed to fetch location data", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleDefineObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationQuery.trim()) return;
    
    setIsRouting(true);
    setRouteInsight(null);
    try {
      const target = await searchCity(destinationQuery);
      if (target) {
        const basePM = currentAqi * 0.6;
        const variance = [
          basePM, 
          basePM * (1 + (Math.random() - 0.5) * 0.4), 
          basePM * (1 + (Math.random() - 0.5) * 0.8),
          basePM * (1 + (Math.random() - 0.5) * 0.4)
        ];
        
        setCustomRoute({ origin: location, target, pm25Variance: variance });
        
        const savedProfile = localStorage.getItem('pureair_profile');
        if (savedProfile) {
          const profile: UserProfile = JSON.parse(savedProfile);
          const avgPM = variance.reduce((a, b) => a + b, 0) / variance.length;
          const aiRes = await analyzeRoutePollutants(location.city, target.city, Math.round(avgPM), profile);
          setRouteInsight(aiRes);
        }
      }
    } catch (err) {
      console.error("Routing failure", err);
    } finally {
      setIsRouting(false);
    }
  };

  const getDominantPollutant = (pollutants: PollutantData) => {
    const items = [
      { label: 'PM2.5', value: pollutants.pm25, unit: 'µg/m³' },
      { label: 'PM10', value: pollutants.pm10, unit: 'µg/m³' },
      { label: 'NO2', value: pollutants.no2, unit: 'ppb' },
      { label: 'SO2', value: pollutants.so2, unit: 'ppb' },
      { label: 'CO', value: pollutants.co, unit: 'ppm' },
      { label: 'O3', value: pollutants.o3, unit: 'ppb' },
    ];
    return items.sort((a, b) => b.value - a.value)[0];
  };

  const heatmapData = useMemo(() => {
    const points = [];
    const baseLat = location.lat;
    const baseLon = location.lon;
    
    for (let i = 0; i < 350; i++) {
        const offsetLat = (Math.random() - 0.5) * 0.4; 
        const offsetLon = (Math.random() - 0.5) * 0.4;
        const distance = Math.sqrt(offsetLat**2 + offsetLon**2);
        
        let intensity = Math.max(0.1, 1 - (distance * 5));
        if (Math.random() > 0.92) intensity = 1.0; 

        const finalIntensity = forecastMode ? Math.min(1.0, intensity * 1.25) : intensity;

        let color = '#22c55e';
        if (finalIntensity > 0.2) color = '#eab308';
        if (finalIntensity > 0.45) color = '#f97316';
        if (finalIntensity > 0.7) color = '#ef4444';
        if (finalIntensity > 0.85) color = '#7e22ce';

        points.push({
            pos: [baseLat + offsetLat, baseLon + offsetLon] as [number, number],
            radius: 1800 + Math.random() * 2500,
            color,
            intensity: finalIntensity
        });
    }
    return points;
  }, [location, forecastMode]);

  const routes = useMemo(() => {
    const lat = location.lat;
    const lon = location.lon;
    return [
      {
        id: 'r1',
        name: 'Industrial Highway',
        aqi: currentAqi + 55,
        pm25: (currentAqi + 55) * 0.65,
        breatheScore: Math.max(0, 100 - ((currentAqi + 55) / 2.5)),
        type: 'Hazardous Corridor',
        color: '#7e22ce',
        gradient: 'from-purple-600 to-red-500',
        protocol: 'Extreme particulate density. Respirator mandatory.',
        metrics: { risk: 'Critical', flow: 'High' },
        path: [[lat, lon], [lat + 0.03, lon + 0.03], [lat + 0.06, lon + 0.06]] as [number, number][]
      },
      {
        id: 'r2',
        name: 'Nature Reserve Path',
        aqi: Math.max(5, currentAqi - 40),
        pm25: Math.max(2, (currentAqi - 40) * 0.4),
        breatheScore: Math.min(100, 100 - ((currentAqi - 40) / 4)),
        type: 'Low-Ex Corridor',
        color: '#22c55e',
        gradient: 'from-emerald-500 to-green-400',
        protocol: 'Clean air pocket. Minimal exposure pathway.',
        metrics: { risk: 'Nominal', flow: 'Steady' },
        path: [[lat, lon], [lat - 0.02, lon + 0.03], [lat - 0.04, lon + 0.07]] as [number, number][]
      }
    ];
  }, [location, currentAqi]);

  const selectedRoute = selectedRouteIdx !== null ? routes[selectedRouteIdx] : null;

  return (
    <div className="glass-card p-6 rounded-[48px] space-y-8 flex flex-col h-[1200px] border-white/50 shadow-2xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4 relative z-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-slate-900 rounded-[20px] flex items-center justify-center text-white shadow-2xl">
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Macro Intensity Heatmap</h4>
            <div className="flex items-center gap-2 mt-2">
               <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
               </span>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Advanced Spatial Analysis Active</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <form onSubmit={handleDefineObjective} className="flex bg-white/50 border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <input 
              type="text" 
              placeholder="Define Destination..." 
              value={destinationQuery}
              onChange={(e) => setDestinationQuery(e.target.value)}
              className="bg-transparent px-4 py-2.5 text-xs font-bold text-slate-800 outline-none w-56 placeholder:text-slate-400"
            />
            <button type="submit" disabled={isRouting} className="bg-slate-900 text-white px-5 hover:bg-slate-800 disabled:opacity-50">
              {isRouting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
            </button>
          </form>

          <button 
            onClick={() => {
              setCustomRoute(null);
              setRouteInsight(null);
              setSelectedRouteIdx(null);
            }}
            className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-2xl text-[9px] font-black uppercase hover:bg-slate-200 transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 flex-1 min-h-0 relative z-10">
        <div className="lg:col-span-4 relative rounded-[40px] overflow-hidden border-4 border-white shadow-2xl transition-all h-full">
          {isSearching && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-[2000] flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Pinpointing coordinate...</span>
              </div>
            </div>
          )}
          
          <MapContainer center={center} zoom={11} className="w-full h-full grayscale-[0.2]">
            <TileLayer url={tileUrls[activeLayer]} />
            <MapEvents onMapClick={handleMapClick} />
            
            <Circle center={center} radius={500} pathOptions={{ fillColor: '#3b82f6', color: '#ffffff', weight: 8, fillOpacity: 1 }} />

            {showHeatmap && activeLayer === 'heatmap' && heatmapData.map((p, i) => (
              <Circle key={i} center={p.pos} radius={p.radius} pathOptions={{ fillColor: p.color, color: 'transparent', fillOpacity: 0.18 * p.intensity, className: 'particle-anim' }} />
            ))}

            {customRoute && (
              <>
                <Polyline 
                  positions={[[customRoute.origin.lat, customRoute.origin.lon], [customRoute.target.lat, customRoute.target.lon]]}
                  pathOptions={{ color: '#3b82f6', weight: 4, dashArray: '10, 10', className: 'flow-path' }}
                />
                <Circle center={[customRoute.target.lat, customRoute.target.lon]} radius={1000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.4 }} />
                <Popup position={[customRoute.target.lat, customRoute.target.lon]}>
                  <div className="p-2 text-xs font-bold text-slate-800">Destination Reached</div>
                </Popup>
              </>
            )}

            {clickedInfo && (
              <Popup position={[clickedInfo.location.lat, clickedInfo.location.lon]} eventHandlers={{ remove: () => setClickedInfo(null) }}>
                <div className="p-4 min-w-[300px] bg-white rounded-3xl overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Atmo-Probe Analysis</h5>
                    <div className="flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Real-Time Data</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className={`text-6xl font-black ${getAQIConfig(clickedInfo.aqi).text} tracking-tighter`}>{clickedInfo.aqi}</div>
                    <div className="flex-1">
                      <div className={`px-2 py-0.5 rounded text-white text-[8px] font-black uppercase ${getAQIConfig(clickedInfo.aqi).color} mb-1.5 inline-block`}>
                        {clickedInfo.category}
                      </div>
                      <p className="text-xs font-black text-slate-900 leading-tight line-clamp-2">{clickedInfo.location.address?.road || 'Coordinate Pin'}</p>
                    </div>
                  </div>

                  <div className="mb-6 px-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dominant Pollutant</span>
                    </div>
                    {(() => {
                      const dom = getDominantPollutant(clickedInfo.pollutants);
                      return (
                        <div className="flex items-center gap-3 bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-600/20">
                          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-xs">
                            {dom.label}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white text-sm font-black leading-none">{dom.value} {dom.unit}</span>
                            <span className="text-blue-100 text-[8px] font-bold uppercase tracking-widest mt-1">Intensity Peak</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-6 border-t border-slate-100 pt-5">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">PM2.5 Concentration</span>
                      <span className="text-xs font-black text-slate-800">{clickedInfo.pollutants.pm25} µg/m³</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">NO2 Level</span>
                      <span className="text-xs font-black text-slate-800">{clickedInfo.pollutants.no2} ppb</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3">4-Hour Site Forecast</span>
                    <div className="flex gap-2">
                      {clickedInfo.forecast.map((f, i) => (
                        <div key={i} className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center hover:bg-slate-100 transition-colors cursor-default">
                          <div className="text-[8px] font-black text-slate-400 uppercase mb-1">{f.time}</div>
                          <div className={`text-[11px] font-black ${getAQIConfig(f.aqi).text}`}>{f.aqi}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Popup>
            )}

            {routes.map((route, idx) => (
              <React.Fragment key={route.id}>
                <Polyline
                  positions={route.path}
                  eventHandlers={{ click: () => setSelectedRouteIdx(idx) }}
                  pathOptions={{ color: route.color, weight: 28, opacity: selectedRouteIdx === idx ? 0.3 : 0.08, lineCap: 'round', className: 'cursor-pointer' }}
                />
                <Polyline
                  positions={route.path}
                  eventHandlers={{ click: () => setSelectedRouteIdx(idx) }}
                  pathOptions={{ color: route.color, weight: 12, opacity: selectedRouteIdx === idx ? 1 : 0.7, lineCap: 'round', className: 'cursor-pointer flow-path' }}
                />
              </React.Fragment>
            ))}
          </MapContainer>

          <div className="absolute bottom-8 left-8 z-[1000]">
             <div className="glass-card p-5 rounded-[28px] border-white/60 shadow-2xl backdrop-blur-3xl min-w-[220px] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Intensity Scale</span>
                  <span className={`w-2 h-2 rounded-full ${showHeatmap ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                </div>
                <div className="space-y-1.5">
                   {[
                      { label: 'Severe (85+)', color: 'bg-purple-600' },
                      { label: 'Hazardous (70+)', color: 'bg-red-500' },
                      { label: 'Unhealthy (45+)', color: 'bg-orange-500' },
                      { label: 'Moderate (20+)', color: 'bg-yellow-400' },
                      { label: 'Good (0+)', color: 'bg-green-500' }
                   ].map(item => (
                      <div key={item.label} className="flex items-center gap-3">
                         <div className={`w-3 h-3 rounded-full ${item.color} border border-white/50 shadow-sm`} />
                         <span className="text-[9px] font-bold text-slate-800">{item.label}</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6 flex flex-col h-full overflow-hidden">
          {customRoute ? (
            <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-3xl flex-1 flex flex-col space-y-6 animate-in slide-in-from-right-8 overflow-y-auto scrollbar-hide">
              <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                     <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Custom Corridor</span>
                     <h5 className="text-lg font-black tracking-tight line-clamp-2">{customRoute.target.city}</h5>
                  </div>
                  <button onClick={() => setCustomRoute(null)} className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 shrink-0">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>

               <div className="space-y-6 flex-1">
                 <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block">Exposure Gradient</span>
                    <div className="flex items-end justify-between h-24 gap-1 px-1">
                      {customRoute.pm25Variance.map((v, i) => (
                        <div key={i} className="flex-1 bg-blue-500/40 rounded-t-lg group relative" style={{ height: `${Math.min(100, (v/150)*100)}%` }}>
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[8px] bg-white text-slate-900 px-1 rounded transition-opacity">
                            {Math.round(v)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[7px] font-black text-slate-500 uppercase">
                      <span>Start</span>
                      <span>Target</span>
                    </div>
                 </div>

                 {routeInsight ? (
                   <div className="space-y-4 animate-in fade-in duration-500">
                     <div className="p-5 bg-blue-600/10 rounded-2xl border border-blue-600/20">
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block mb-2">Assessment</span>
                        <p className="text-[11px] font-bold leading-relaxed italic opacity-90">"{routeInsight.assessment}"</p>
                     </div>
                     <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block mb-2">Protocol</span>
                        <p className="text-[11px] font-bold leading-relaxed">{routeInsight.recommendation}</p>
                     </div>
                   </div>
                 ) : (
                   <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">AURA Reasoning...</span>
                   </div>
                 )}
               </div>
            </div>
          ) : selectedRoute ? (
            <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-3xl flex-1 flex flex-col space-y-6 animate-in slide-in-from-right-8">
               <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                     <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Diagnostic Node</span>
                     <h5 className="text-xl font-black tracking-tight">{selectedRoute.name}</h5>
                  </div>
                  <button onClick={() => setSelectedRouteIdx(null)} className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 shrink-0">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex-1 space-y-6">
                 <div>
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block mb-2">System Protocol</span>
                    <p className="text-[11px] font-bold leading-relaxed opacity-90 italic">"{selectedRoute.protocol}"</p>
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                      <div className="text-[8px] font-black text-slate-400 uppercase mb-1">PM2.5 Conc.</div>
                      <div className="text-sm font-black">{Math.round(selectedRoute.pm25)} µg/m³</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                      <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Risk Rank</div>
                      <div className="text-sm font-black">{selectedRoute.metrics.risk}</div>
                    </div>
                 </div>
               </div>
            </div>
          ) : (
            <div className="space-y-6 flex-1 overflow-y-auto scrollbar-hide pb-8">
               <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Corridor Diagnostics</h5>
               <div className="space-y-4">
                  {routes.map((route, i) => (
                      <div key={route.id} onClick={() => setSelectedRouteIdx(i)} className="p-6 bg-white rounded-[32px] border-2 border-slate-100 hover:border-blue-400 hover:shadow-2xl transition-all cursor-pointer group">
                          <div className="flex justify-between items-start mb-4">
                              <div className="flex-1 pr-2">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{route.type}</span>
                                  <h6 className="font-black text-slate-900 text-sm leading-tight">{route.name}</h6>
                              </div>
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-inner shrink-0 ${route.breatheScore > 80 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                  {Math.round(route.breatheScore)}
                              </div>
                          </div>
                          <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase mb-2">
                            <span>Score</span>
                            <span>{Math.round(route.pm25)} µg/m³</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-1000 bg-gradient-to-r ${route.gradient}`} style={{ width: `${route.breatheScore}%` }} />
                          </div>
                      </div>
                  ))}
               </div>
               <div className="p-6 bg-slate-900 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-bl-full blur-2xl" />
                  <h6 className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
                    Project Planning
                  </h6>
                  <p className="text-[11px] font-bold leading-relaxed italic opacity-90 border-l-2 border-blue-600 pl-4 py-1">
                    "Define a destination to analyze PM2.5 exposure gradients along the path."
                  </p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TravelRoutes;
