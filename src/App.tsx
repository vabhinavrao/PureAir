
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import { fetchAQIData, searchCity, fetchForecastData, HourlyForecast } from './services/aqiService';
import { getAIInsights, getTrendInsights, predictFutureAQI, getDailyDebrief } from './services/geminiService';
import { onAuthChange, signOut, getUserProfile, saveUserProfile, saveHistoryEntry, getHistory } from './services/authService';
import { AQIResponse, ExposureInsight, HealthAdvice, UserProfile, DailyPlan, HistoricalEntry, TrendInsights } from './types';
import Header from './components/Header';
import AQIHero from './components/AQIHero';
import PollutantGrid from './components/PollutantGrid';
import Onboarding from './components/Onboarding';
import TravelRoutes from './components/TravelRoutes';
import GeminiAssistant from './components/GeminiAssistant';
import DailyPlanner from './components/DailyPlanner';
import TrendAnalysis from './components/TrendAnalysis';
import AICharacter from './components/AICharacter';
import Sidebar from './components/Sidebar';
import FeedbackControl from './components/FeedbackControl';
import ForecastStrip from './components/ForecastStrip';
import DailySummary from './components/DailySummary';
import ExposureAssessment from './components/ExposureAssessment';
import LoginScreen from './components/LoginScreen';

function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [aqiData, setAqiData] = useState<AQIResponse | null>(null);
  const [forecast, setForecast] = useState<HourlyForecast[]>([]);
  const [insights, setInsights] = useState<{ insight: ExposureInsight; healthAdvice: HealthAdvice } | null>(null);
  const [prediction, setPrediction] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [history, setHistory] = useState<HistoricalEntry[]>([]);
  const [trendInsights, setTrendInsights] = useState<TrendInsights | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);

  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [dailyTakeaway, setDailyTakeaway] = useState<string>('');
  const [dailyLoading, setDailyLoading] = useState(false);

  const watchId = useRef<number | null>(null);
  const lastAlertTime = useRef<number>(0);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const savedProfile = await getUserProfile(firebaseUser.uid);
          setProfile(savedProfile);

          // Load history from Firestore
          const savedHistory = await getHistory(firebaseUser.uid);
          setHistory(savedHistory);
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setProfile(null);
        setHistory([]);
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Computed PES for today based on active plan
  const currentPES = useMemo(() => {
    if (!aqiData || !profile || !plan) return 0;
    const activityMap = { indoor: 0.2, commuter: 1.0, athlete: 2.5 };
    const healthMap = { none: 1.0, allergy: 1.5, asthma: 2.5 };
    return Math.floor(
      (aqiData.aqi * plan.durationMinutes / 60) *
      activityMap[profile.activityLevel] *
      healthMap[profile.sensitivity]
    );
  }, [aqiData?.aqi, plan, profile]);

  // Auto-Detect Logic on Mount
  useEffect(() => {
    if (profile && !aqiData && !loading) {
      navigator.geolocation.getCurrentPosition(
        (p) => loadData(p.coords.latitude, p.coords.longitude),
        () => setError("Coordinate handshake failed. Please search manually.")
      );
    }
  }, [profile]);

  // Real-time Notification Watcher
  useEffect(() => {
    if (aqiData && profile?.notificationsEnabled) {
      const threshold = profile.alertThreshold || 100;
      const now = Date.now();

      if (aqiData.aqi >= threshold && (now - lastAlertTime.current > 600000)) {
        if (Notification.permission === 'granted') {
          new Notification("PureAir Pro Alert", {
            body: `Atmospheric alert in ${aqiData.location.city}! AQI has reached ${aqiData.aqi} (${aqiData.category}). Protocol: Seek filtration.`,
            icon: '/favicon.ico'
          });
          lastAlertTime.current = now;
        }
      }
    }
  }, [aqiData, profile]);

  // Save profile to Firestore when it changes
  useEffect(() => {
    if (profile && user) {
      saveUserProfile(user.uid, profile).catch(console.error);
      if (!plan) {
        setPlan({
          activity: profile.mainActivity || 'Outdoor Protocol',
          durationMinutes: 45,
          startTime: new Date().toLocaleTimeString()
        });
      }
    }
  }, [profile, user]);

  const handleProfileComplete = async (newProfile: UserProfile) => {
    // Optimistic update - set profile immediately so app continues to work
    setProfile(newProfile);

    // Try to save to Firestore in background (non-blocking)
    if (user) {
      saveUserProfile(user.uid, newProfile).catch(error => {
        console.warn('Failed to save profile to cloud (will retry on next sync):', error);
      });
    }
  };

  const toggleNotifications = async () => {
    if (!profile) return;

    if (!profile.notificationsEnabled && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError("Notification permission denied by system.");
        return;
      }
    }

    setProfile({
      ...profile,
      notificationsEnabled: !profile.notificationsEnabled
    });
  };

  const updateThreshold = (val: number) => {
    if (!profile) return;
    setProfile({ ...profile, alertThreshold: val });
  };

  const refreshInsights = useCallback(async (data: AQIResponse, currentPlan: DailyPlan | null) => {
    if (!profile) return;
    setAiLoading(true);
    setDailyLoading(true);
    try {
      const [aiData, aiPrediction, takeaway] = await Promise.all([
        getAIInsights(data, profile, currentPlan),
        predictFutureAQI(data.location.city, data.aqi),
        getDailyDebrief(data.aqi, currentPES, profile)
      ]);
      setInsights(aiData);
      setPrediction(aiPrediction);
      setDailyTakeaway(takeaway);
    } catch (err) {
      console.error("AI Insights sync failed");
    } finally {
      setAiLoading(false);
      setDailyLoading(false);
    }
  }, [profile, currentPES]);

  useEffect(() => {
    if (aqiData && plan) {
      refreshInsights(aqiData, plan);
    }
  }, [plan, aqiData?.aqi, refreshInsights]);

  const loadData = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAQIData(lat, lon);
      setAqiData(data);
      setForecast(fetchForecastData(data.aqi));
      updateHistory(data);
    } catch (err) {
      setError("Satellite link disruption. Sensors unreachable.");
    } finally {
      setLoading(false);
    }
  }, [profile, currentPES, user]);

  const startLiveTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    if (isLiveTracking && watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      setIsLiveTracking(false);
      return;
    }
    setIsLiveTracking(true);
    watchId.current = navigator.geolocation.watchPosition(
      (p) => loadData(p.coords.latitude, p.coords.longitude),
      () => setIsLiveTracking(false),
      { enableHighAccuracy: true }
    );
  }, [loadData, isLiveTracking]);

  const handleSearch = async (query: string) => {
    setLoading(true);
    const location = await searchCity(query);
    if (location) loadData(location.lat, location.lon);
    else setLoading(false);
  };

  const updateHistory = useCallback(async (data: AQIResponse) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const newEntry: HistoricalEntry = {
      date: today,
      aqi: data.aqi,
      city: data.location.city,
      pes: currentPES
    };

    // Save to Firestore if user is logged in
    if (user) {
      try {
        await saveHistoryEntry(user.uid, newEntry);
      } catch (error) {
        console.error('Error saving history:', error);
      }
    }

    setHistory(prev => {
      const existingIdx = prev.findIndex(h => h.date === today && h.city === data.location.city);
      let updated;
      if (existingIdx !== -1) {
        updated = [...prev];
        updated[existingIdx] = newEntry;
      } else {
        updated = [...prev, newEntry].slice(-90);
      }
      return updated;
    });
  }, [currentPES, user]);

  const loadTrendData = useCallback(async () => {
    if (history.length < 2 || !profile) return;
    setTrendLoading(true);
    try {
      const insights = await getTrendInsights(history, profile);
      setTrendInsights(insights);
    } catch (err) {
      console.error("Trend analysis failed", err);
    } finally {
      setTrendLoading(false);
    }
  }, [history, profile]);

  useEffect(() => {
    if (history.length > 0) {
      const timer = setTimeout(() => loadTrendData(), 1000);
      return () => clearTimeout(timer);
    }
  }, [history.length, loadTrendData]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setProfile(null);
      setHistory([]);
      setAqiData(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show login screen while checking auth or if not authenticated
  // This eliminates the loading spinner delay - Firebase will auto-transition if already logged in
  if (authLoading || !user) {
    return <LoginScreen onLoginSuccess={() => { }} />;
  }

  // Show onboarding if no profile - pass Gmail name to skip asking for it
  if (!profile) {
    return <Onboarding onComplete={handleProfileComplete} userName={user.displayName || undefined} />;
  }

  return (
    <div className="min-h-screen pb-40 transition-all duration-1000 scrollbar-hide">
      <Header
        onLocate={startLiveTracking}
        onSearch={handleSearch}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        isLoading={loading}
        isLive={isLiveTracking}
        notificationsEnabled={profile.notificationsEnabled}
        onToggleNotifications={toggleNotifications}
        userName={profile.name}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        profile={profile}
        onUpdateProfile={handleSignOut}
        onUpdateThreshold={updateThreshold}
      />

      <main className="max-w-7xl mx-auto px-6 mt-16 space-y-16">
        {error && (
          <div className="bg-red-500 text-white px-8 py-4 rounded-3xl text-center shadow-2xl font-black uppercase tracking-widest border-4 border-white/20">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-8 space-y-12">
            <section className="animate-in fade-in slide-in-from-top-10 duration-1000">
              {aqiData ? (
                <AQIHero data={aqiData} isLive={isLiveTracking} userName={profile.name} />
              ) : (
                <div className="glass-card p-20 rounded-[50px] text-center border-dashed border-4 border-slate-300/50">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <h2 className="text-3xl font-black text-slate-400 uppercase tracking-widest">Pinpointing Coordinates...</h2>
                </div>
              )}
            </section>

            {aqiData && (
              <>
                <section>
                  <DailySummary
                    avgAqi={aqiData.aqi}
                    pes={currentPES}
                    takeaway={dailyTakeaway}
                    isLoading={dailyLoading}
                    profile={profile}
                  />
                </section>
                <section>
                  <PollutantGrid pollutants={aqiData.pollutants} aqi={aqiData.aqi} />
                </section>
                <section>
                  <ForecastStrip forecast={forecast} />
                </section>
              </>
            )}
          </div>

          <div className="lg:col-span-4 flex flex-col items-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 w-full text-center lg:text-left px-4">Interface Core</h3>
            <AICharacter
              aqi={aqiData?.aqi || 0}
              message={aqiData ? `Telemetry synchronized, ${profile.name}. Atmospheric analysis protocols are now active. ${prediction ? 'Scientific forecast suggests a ' + prediction.reasoning.split('.')[0] : ''}` : `AURA OS initializing. Waiting for coordinate authorization.`}
              isSpeaking={isSpeaking}
              name="AURA"
            />

            {aqiData && (
              <div className="w-full mt-10 space-y-12">
                {plan && (
                  <section>
                    <ExposureAssessment aqi={aqiData.aqi} plan={plan} profile={profile} />
                  </section>
                )}

                <section>
                  <div className="glass-card p-10 rounded-[50px] space-y-8 border-l-[12px] border-blue-600 shadow-2xl relative overflow-hidden">
                    {aiLoading && (
                      <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">AI Predictive Summary</span>
                    </div>
                    {prediction && (
                      <div className="space-y-4">
                        <p className="text-lg text-slate-800 leading-relaxed font-bold italic">
                          "{prediction.reasoning}"
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {prediction.predictions.map((p: any, i: number) => (
                            <div key={i} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                              <div className="text-[8px] font-black text-slate-400 uppercase mb-1">+{p.hoursAhead}h</div>
                              <div className="text-sm font-black text-slate-900">{p.predictedAqi}</div>
                              <div className="text-[7px] font-black text-blue-600 uppercase">{p.riskLevel}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="pt-6 border-t border-slate-100">
                      <FeedbackControl />
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>

        {aqiData && (
          <div className="space-y-16">
            <section>
              <TravelRoutes currentAqi={aqiData.aqi} location={aqiData.location} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <section>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 px-4">Daily Planner</h3>
                <DailyPlanner onPlanSet={setPlan} />
              </section>
              <section>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 px-4">Chronology</h3>
                <TrendAnalysis history={history} insights={trendInsights} isLoading={trendLoading} />
              </section>
            </div>
          </div>
        )}

        {showAssistant && aqiData && (
          <GeminiAssistant
            aqiData={aqiData}
            profile={profile}
            history={history}
            plan={plan}
            onClose={() => setShowAssistant(false)}
            onSpeakingChange={setIsSpeaking}
          />
        )}
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-slate-900/95 backdrop-blur-3xl text-white px-10 py-6 rounded-[3rem] shadow-2xl z-50 border border-white/10">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
        </button>
        <div className="w-px h-10 bg-white/10" />
        <button
          onClick={() => setShowAssistant(true)}
          className="flex items-center gap-4 font-black text-xs uppercase tracking-[0.3em] bg-blue-600 px-8 py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/30"
        >
          COMMAND AURA
        </button>
      </div>
    </div>
  );
}

export default App;
