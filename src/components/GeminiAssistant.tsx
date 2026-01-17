
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
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

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const GeminiAssistant: React.FC<Props> = ({ aqiData, profile, history, plan, onClose, onSpeakingChange }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("AURA Error: Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env.local");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey || '' });

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const GlobalCtx = (window as any).AURA_AUDIO_CONTEXT;
      if (GlobalCtx && GlobalCtx.sampleRate === 24000) {
        audioContextRef.current = GlobalCtx;
      } else {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000
        });
        (window as any).AURA_AUDIO_CONTEXT = audioContextRef.current;
      }
    }
    return audioContextRef.current!;
  };

  const updateSpeakingState = (speaking: boolean) => {
    setIsSpeaking(speaking);
    if (onSpeakingChange) onSpeakingChange(speaking);
  };

  const stopCurrentSpeech = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch (e) { }
      currentSourceRef.current = null;
    }
    updateSpeakingState(false);
  };

  const speakText = async (text: string) => {
    try {
      stopCurrentSpeech();
      updateSpeakingState(true);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `System Instruction: You are AURA. Output the following response: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (base64Audio) {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') await ctx.resume();

        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        source.onended = () => {
          if (currentSourceRef.current === source) {
            updateSpeakingState(false);
            currentSourceRef.current = null;
          }
        };

        currentSourceRef.current = source;
        source.start(0);
      } else {
        updateSpeakingState(false);
      }
    } catch (err) {
      console.error("AURA Voice Error:", err);
      updateSpeakingState(false);
    }
  };

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

  useEffect(() => {
    const initAura = async () => {
      setLoading(true);
      try {
        const res = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `System: You are AURA, a high-tech environmental OS. Provide a brief, professional, and personalized 1-sentence greeting for ${profile.name} in ${aqiData.location.city}. Mention the current AQI is ${aqiData.aqi}.`,
        });
        const text = res.text || `AURA online, ${profile.name}. Monitoring ${aqiData.aqi} AQI in ${aqiData.location.city}.`;
        setMessages([{ role: 'ai', text }]);
        speakText(text);
      } catch (e) {
        setMessages([{ role: 'ai', text: "AURA online. Text-only protocols active." }]);
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

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `System: You are AURA. ${aqiData.aqi} AQI in ${aqiData.location.city}. Context: ${historyPrompt}. User: ${textToSend}. Response: Data-driven health focus.`,
      });
      const aiText = response.text || "Analysis incomplete.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      speakText(aiText);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Transmission error." }]);
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
                  {isCalibrating ? 'Calibrating Intelligence' : (isSpeaking ? 'AURA Transmitting' : 'AURA Standby')}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl transition-all hover:rotate-90 text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
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
          {loading && <div className="flex items-center gap-3 bg-blue-50/50 w-fit px-6 py-4 rounded-3xl border border-blue-100"><div className="flex gap-1"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" /></div><span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Processing Telemetry...</span></div>}
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
              placeholder={isListening ? "Listening..." : "Command AURA via text or voice..."}
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
            {["Is it safe for a run?", "Explain PM2.5", "Routine update"].map(cmd => (
              <button key={cmd} onClick={() => setInputValue(cmd)} className="px-4 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-xl text-[9px] font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-all">{cmd}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeminiAssistant;
