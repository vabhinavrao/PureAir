
export interface DetailedAddress {
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  colony?: string;
  city: string;
  houseNumber?: string;
}

export interface PollutantData {
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
}

export interface AQILocation {
  city: string;
  lat: number;
  lon: number;
  address?: DetailedAddress;
}

export interface AQIResponse {
  aqi: number;
  category: string;
  color: string;
  pollutants: PollutantData;
  location: AQILocation;
  lastUpdated: string;
}

export interface ExposureInsight {
  status: 'Safe' | 'Caution' | 'Avoid';
  activityAdvice: string;
  routeRisk: string;
}

export interface HealthAdvice {
  general: string;
  sensitiveGroups: string;
  protectiveMeasures: string[];
}

export interface UserProfile {
  name: string;
  age: number;
  activityLevel: 'indoor' | 'commuter' | 'athlete';
  sensitivity: 'none' | 'asthma' | 'allergy';
  mainActivity: string;
  alertThreshold: number;
  notificationsEnabled: boolean;
}

export interface DailyPlan {
  activity: string;
  durationMinutes: number;
  startTime: string;
}

export interface HistoricalEntry {
  date: string;
  aqi: number;
  city: string;
  pes: number;
}

export interface TrendInsights {
  summary: string;
  improvementSuggestion: string;
  cumulativeRisk: 'Low' | 'Moderate' | 'Significant';
}
