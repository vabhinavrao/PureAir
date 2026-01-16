
import { GoogleGenAI, Type } from "@google/genai";
import { AQIResponse, UserProfile, HistoricalEntry, DailyPlan } from "../types";

// Lazy initialization to prevent crash if API key is not set
let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!ai) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY environment variable.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const getAIInsights = async (aqiData: AQIResponse, profile?: UserProfile | null, activePlan?: DailyPlan | null) => {
  const currentActivity = activePlan?.activity || profile?.mainActivity;
  const duration = activePlan?.durationMinutes || 30;

  const prompt = `Analyze Air Quality for user ${profile?.name} in ${aqiData.location.city}:
  AQI: ${aqiData.aqi} (${aqiData.category})
  Pollutants: PM2.5: ${aqiData.pollutants.pm25}, PM10: ${aqiData.pollutants.pm10}.
  User Profile: Name: ${profile?.name}, Age: ${profile?.age}, Sensitivity: ${profile?.sensitivity}.
  ACTIVE PLAN: ${currentActivity} for ${duration} minutes.

  Tasks:
  1. Address the user as ${profile?.name}.
  2. Provide actionable health advice specifically tailored to the active plan: "${currentActivity}".
  3. Calculate the risk of doing "${currentActivity}" at ${aqiData.aqi} AQI for ${duration}m.
  4. Be punchy, professional, and data-driven.`;

  const response = await getAI().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          insight: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING },
              activityAdvice: { type: Type.STRING },
              routeRisk: { type: Type.STRING }
            },
            required: ["status", "activityAdvice", "routeRisk"]
          },
          healthAdvice: {
            type: Type.OBJECT,
            properties: {
              general: { type: Type.STRING },
              sensitiveGroups: { type: Type.STRING },
              protectiveMeasures: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["general", "sensitiveGroups", "protectiveMeasures"]
          }
        },
        required: ["insight", "healthAdvice"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const analyzeRoutePollutants = async (origin: string, destination: string, pm25Avg: number, profile: UserProfile) => {
  const prompt = `Analyze a travel corridor from ${origin} to ${destination}. 
  Average PM2.5 concentration: ${pm25Avg} µg/m³. 
  User sensitivity: ${profile.sensitivity}.
  Provide a 1-sentence technical risk assessment and one specific mask/filter recommendation.`;

  const response = await getAI().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          assessment: { type: Type.STRING },
          recommendation: { type: Type.STRING }
        },
        required: ["assessment", "recommendation"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const predictFutureAQI = async (location: string, currentAqi: number) => {
  const prompt = `Predict the AQI for ${location} for the next 6, 12, and 24 hours. 
  Current AQI: ${currentAqi}.
  Provide a brief scientific reasoning for the trend (e.g., wind patterns, industrial cycles).`;

  const response = await getAI().models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          predictions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                hoursAhead: { type: Type.NUMBER },
                predictedAqi: { type: Type.NUMBER },
                riskLevel: { type: Type.STRING }
              },
              required: ["hoursAhead", "predictedAqi", "riskLevel"]
            }
          },
          reasoning: { type: Type.STRING }
        },
        required: ["predictions", "reasoning"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const getTrendInsights = async (history: HistoricalEntry[], profile: UserProfile) => {
  const recentHistory = history.slice(-30);
  const historyStr = recentHistory.map(h => `${h.date}: AQI ${h.aqi} in ${h.city}`).join('\n');
  const prompt = `Act as an environmental epidemiologist. Analyze this historical AQI sequence for ${profile.name} (${profile.age} years old), who frequently does ${profile.mainActivity}:\n\n${historyStr}\n\nTasks:\n1. Address ${profile.name} directly in your summary.\n2. Summarize the cumulative health impact in 2 punchy sentences.\n3. Provide one specific optimization tip for their "${profile.mainActivity}" routine next week.\n4. Determine cumulative risk: Low, Moderate, or Significant.`;

  const response = await getAI().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          improvementSuggestion: { type: Type.STRING },
          cumulativeRisk: { type: Type.STRING, enum: ["Low", "Moderate", "Significant"] }
        },
        required: ["summary", "improvementSuggestion", "cumulativeRisk"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const getDailyDebrief = async (aqi: number, pes: number, profile: UserProfile) => {
  const prompt = `User: ${profile.name}. Today's Metrics: Avg AQI ${aqi}, Personal Exposure Score ${pes}. 
  Sensitivity: ${profile.sensitivity}. Main Activity: ${profile.mainActivity}.
  Generate a punchy, 1-sentence "Daily Takeaway" for an environmental OS dashboard. 
  Focus on biological impact and tomorrow's strategy.`;

  const response = await getAI().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || "Daily telemetry analysis complete. System optimized.";
};
