
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AQIResponse, UserProfile, HistoricalEntry, DailyPlan } from '../types';
import FeedbackControl from './FeedbackControl';

interface Message {
  role: 'ai' | 'user';
  text: string;
}

interface Props {
  aqiData: AQIResponse;
  profile: UserProfile;
  history: HistoricalEntry[];
  plan: DailyPlan | null;
  onClose: () => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

const GeminiAssistant: React.FC<Props> = ({ aqiData, profile, history, plan, onClose, onSpeakingChange }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  const updateSpeakingState = (speaking: boolean) => {
    setIsSpeaking(speaking);
    if (onSpeakingChange) onSpeakingChange(speaking);
  };

  const stopCurrentSpeech = () => {
    window.speechSynthesis.cancel();
    updateSpeakingState(false);
  };

  // Browser-based TTS - reliable and always works
  const speakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    stopCurrentSpeech();
    updateSpeakingState(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.9;
    utterance.volume = 1.0;

    // Try to get a nice voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.name.includes('Samantha') ||
      v.name.includes('Google') ||
      v.name.includes('Premium') ||
      v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => updateSpeakingState(false);
    utterance.onerror = () => updateSpeakingState(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Load voices when available
  useEffect(() => {
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Setup speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setTimeout(() => {
          const syntheticEvent = { preventDefault: () => { } } as React.FormEvent;
          handleSendMessage(syntheticEvent, transcript);
        }, 500);
      };
      recognitionRef.current = recognition;
    }
    return () => stopCurrentSpeech();
  }, []);

  const toggleVoiceMode = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      stopCurrentSpeech();
      recognitionRef.current?.start();
    }
  };

  // Initialize AURA with greeting
  useEffect(() => {
    const initAura = async () => {
      setLoading(true);

      if (!ai) {
        const fallbackText = `AURA online, ${profile.name}. Environmental monitoring active for ${aqiData.location.city}. Current AQI: ${aqiData.aqi}.`;
        setMessages([{ role: 'ai', text: fallbackText }]);
        speakText(fallbackText);
        setLoading(false);
        return;
      }

      try {
        const res = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `You are AURA, a sophisticated AI environmental assistant. Generate a brief, warm, professional greeting (1-2 sentences) for ${profile.name} who is in ${aqiData.location.city}. The current AQI is ${aqiData.aqi} (${aqiData.category}). Sound like a futuristic AI assistant. Keep it concise.`,
        });
        const text = res.text || `AURA online, ${profile.name}. Monitoring air quality in ${aqiData.location.city}. Current AQI: ${aqiData.aqi}.`;
        setMessages([{ role: 'ai', text }]);
        speakText(text);
      } catch (e) {
        console.error("AURA init error:", e);
        const fallbackText = `AURA online, ${profile.name}. Environmental systems active. Current AQI in ${aqiData.location.city}: ${aqiData.aqi}.`;
        setMessages([{ role: 'ai', text: fallbackText }]);
        speakText(fallbackText);
      } finally {
        setLoading(false);
      }
    };
    initAura();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent, manualText?: string) => {
    if (e && e.preventDefault) e.preventDefault();
    const textToSend = manualText || inputValue;
    if (!textToSend.trim() || loading) return;

    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);

    const historyPrompt = messages.slice(-3).map(m => `${m.role === 'ai' ? 'AURA' : 'User'}: ${m.text}`).join('\n');

    if (!ai) {
      const fallbackResponse = `I understand you're asking about "${textToSend}". With an AQI of ${aqiData.aqi} in ${aqiData.location.city}, I recommend staying informed about air quality conditions.`;
      setMessages(prev => [...prev, { role: 'ai', text: fallbackResponse }]);
      speakText(fallbackResponse);
      setLoading(false);
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `You are AURA, an AI environmental health assistant. Current conditions: AQI ${aqiData.aqi} (${aqiData.category}) in ${aqiData.location.city}. PM2.5: ${aqiData.pollutants.pm25}µg/m³.
        
Conversation history:
${historyPrompt}

User question: ${textToSend}

Provide a helpful, data-driven response about air quality, health advice, or environmental conditions. Be concise (2-3 sentences max), professional, and sound like a futuristic AI assistant. Focus on actionable health advice.`,
      });
      const aiText = response.text || "I apologize, I couldn't process that request. Please try again.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      speakText(aiText);
    } catch (error) {
      console.error("AURA response error:", error);
      const errorResponse = `Based on current conditions with AQI at ${aqiData.aqi}, I recommend ${aqiData.aqi > 100 ? 'limiting outdoor exposure' : 'conditions are generally safe for outdoor activities'}.`;
      setMessages(prev => [...prev, { role: 'ai', text: errorResponse }]);
      speakText(errorResponse);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSent = () => {
    setIsCalibrating(true);
    setTimeout(() => setIsCalibrating(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xl">
      <div className="max-w-2xl w-full h-[700px] glass-card rounded-[40px] flex flex-col overflow-hidden shadow-2xl border-2 border-white/40 animate-in zoom-in-95 duration-500">

        <div className="p-8 bg-slate-900 text-white flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg relative overflow-hidden transition-all duration-500 ${isCalibrating ? 'scale-110 shadow-blue-500/50' : ''}`}>
              {isSpeaking && <div className="absolute inset-0 bg-blue-400/40 animate-pulse" />}
              <svg className={`w-7 h-7 relative z-10 ${isSpeaking ? 'scale-110' : ''} ${isCalibrating ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight uppercase leading-none text-blue-400">AURA CORE</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${isCalibrating ? 'bg-blue-400' : (isSpeaking ? 'bg-green-400 animate-pulse shadow-[0_0_10px_#4ade80]' : 'bg-blue-400 opacity-40')}`} />
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                  {isCalibrating ? 'Calibrating Intelligence' : (isSpeaking ? 'AURA Speaking' : 'AURA Ready')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-3 rounded-2xl transition-all ${voiceEnabled ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
              title={voiceEnabled ? 'Voice On' : 'Voice Off'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {voiceEnabled ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                )}
              </svg>
            </button>
            <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl transition-all hover:rotate-90 text-slate-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-white/70 scrollbar-hide">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'ai' ? 'items-start' : 'items-end'}`}>
              <div className={`max-w-[85%] p-6 rounded-[2.5rem] font-bold text-[13px] leading-relaxed shadow-sm transition-all animate-in slide-in-from-bottom-2 ${m.role === 'ai' ? 'bg-white text-slate-800 rounded-tl-none border border-blue-100' : 'bg-slate-900 text-white rounded-tr-none'
                }`}>
                {m.text}
                {m.role === 'ai' && (
                  <div className="mt-4 border-t border-slate-50 pt-3">
                    <FeedbackControl
                      compact
                      context={m.text}
                      onFeedbackSent={handleFeedbackSent}
                    />
                  </div>
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest mt-2 px-4 opacity-30 ${m.role === 'ai' ? 'text-blue-600' : 'text-slate-900'}`}>
                {m.role === 'ai' ? 'AURA OS' : 'AUTHORIZED USER'}
              </span>
            </div>
          ))}
          {loading && <div className="flex items-center gap-3 bg-blue-50/50 w-fit px-6 py-4 rounded-3xl border border-blue-100"><div className="flex gap-1"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" /></div><span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">AURA Processing...</span></div>}
        </div>

        <div className="p-8 border-t border-slate-100 bg-white/95 backdrop-blur-xl">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <button
              type="button"
              onClick={toggleVoiceMode}
              className={`p-5 rounded-[2rem] transition-all flex items-center justify-center ${isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_#ef4444]' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              title="Engage Voice Mode"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <input
              type="text"
              placeholder={isListening ? "Listening..." : "Ask AURA about air quality..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
              className="flex-1 px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold text-sm text-slate-800 focus:border-blue-500 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="px-8 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-500 transition-all disabled:opacity-50"
            >
              Send
            </button>
          </form>

          <div className="flex flex-wrap gap-2 mt-6">
            {["Is it safe for a run?", "Explain PM2.5", "Health tips"].map(cmd => (
              <button key={cmd} onClick={() => setInputValue(cmd)} className="px-4 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-xl text-[9px] font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-all">{cmd}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeminiAssistant;
