
import { AQIResponse, AQILocation, DetailedAddress } from "../types";
import { getAQIConfig } from "../constants";

export interface HourlyForecast {
  time: string;
  aqi: number;
  label: string;
}

// Cache configuration
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const CACHE_KEY_PREFIX = 'pureair_aqi_cache_';

interface CachedData {
  data: AQIResponse;
  timestamp: number;
}

// API Configuration
const WAQI_API_URL = 'https://api.waqi.info';
const OPENAQ_API_URL = 'https://api.openaq.org/v3';
const REQUEST_TIMEOUT_MS = 10000;

// Get API tokens from environment (defined in vite.config.ts)
const getWaqiToken = () => process.env.WAQI_API_TOKEN || '';
const getOpenAQKey = () => process.env.OPENAQ_API_KEY || '';

// ========== Cache Utilities ==========

const getCacheKey = (lat: number, lon: number): string => {
  return `${CACHE_KEY_PREFIX}${lat.toFixed(2)}_${lon.toFixed(2)}`;
};

const getFromCache = (lat: number, lon: number): AQIResponse | null => {
  try {
    const key = getCacheKey(lat, lon);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed: CachedData = JSON.parse(cached);
    const now = Date.now();

    if (now - parsed.timestamp < CACHE_DURATION_MS) {
      console.log('[AQI Cache] Using cached data');
      return parsed.data;
    }

    // Cache expired
    localStorage.removeItem(key);
    return null;
  } catch {
    return null;
  }
};

const saveToCache = (lat: number, lon: number, data: AQIResponse): void => {
  try {
    const key = getCacheKey(lat, lon);
    const cacheData: CachedData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch {
    console.warn('[AQI Cache] Failed to save to cache');
  }
};

// ========== Fetch with Timeout ==========

const fetchWithTimeout = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// ========== Address Lookup ==========

const fetchDetailedAddress = async (lat: number, lon: number): Promise<DetailedAddress> => {
  try {
    const response = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    const addr = data.address;
    return {
      road: addr.road,
      suburb: addr.suburb || addr.neighbourhood || addr.residential,
      colony: addr.neighbourhood || addr.suburb,
      city: addr.city || addr.town || addr.village || "Metropolitan Area",
      houseNumber: addr.house_number
    };
  } catch {
    return { city: "Remote Coordinate" };
  }
};

// ========== AQICN/WAQI API (Primary) ==========

interface WAQIResponse {
  status: string;
  data: {
    aqi: number;
    idx: number;
    city: {
      name: string;
      geo: [number, number];
    };
    iaqi: {
      pm25?: { v: number };
      pm10?: { v: number };
      no2?: { v: number };
      so2?: { v: number };
      co?: { v: number };
      o3?: { v: number };
    };
    time: {
      s: string;
      iso: string;
    };
  };
}

const fetchFromWAQI = async (lat: number, lon: number): Promise<AQIResponse> => {
  const token = getWaqiToken();
  if (!token) {
    throw new Error('WAQI API token not configured');
  }

  const url = `${WAQI_API_URL}/feed/geo:${lat};${lon}/?token=${token}`;
  console.log('[WAQI] Fetching from primary API...');

  const response = await fetchWithTimeout(url);
  const result: WAQIResponse = await response.json();

  if (result.status !== 'ok' || !result.data) {
    throw new Error(`WAQI API error: ${result.status}`);
  }

  const data = result.data;
  const aqi = data.aqi;
  const config = getAQIConfig(aqi);

  // Get detailed address for better location info
  const detailedAddr = await fetchDetailedAddress(lat, lon);
  const cityName = detailedAddr.city || data.city?.name?.split(',')[0] || 'Unknown';

  return {
    aqi,
    category: config.label,
    color: config.color,
    location: {
      city: cityName,
      lat,
      lon,
      address: detailedAddr
    },
    lastUpdated: new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    pollutants: {
      pm25: data.iaqi?.pm25?.v ?? Math.floor(aqi * 0.58),
      pm10: data.iaqi?.pm10?.v ?? Math.floor(aqi * 0.85),
      no2: data.iaqi?.no2?.v ?? 0,
      so2: data.iaqi?.so2?.v ?? 0,
      co: data.iaqi?.co?.v ?? 0,
      o3: data.iaqi?.o3?.v ?? 0,
    }
  };
};

// ========== OpenAQ API (Fallback) ==========

interface OpenAQLocation {
  id: number;
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface OpenAQSensorData {
  parameter: {
    id: number;
    name: string;
    units: string;
  };
  value: number;
  datetime: {
    utc: string;
  };
}

interface OpenAQLatestResponse {
  results: OpenAQSensorData[];
}

// EPA AQI Breakpoints for PM2.5 (µg/m³)
const calculateAQI = (pm25: number): number => {
  const breakpoints = [
    { cLow: 0, cHigh: 12, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
    { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
  ];

  for (const bp of breakpoints) {
    if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
      return Math.round(
        ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow
      );
    }
  }
  return pm25 > 500.4 ? 500 : 0;
};

const fetchFromOpenAQ = async (lat: number, lon: number): Promise<AQIResponse> => {
  const apiKey = getOpenAQKey();
  console.log('[OpenAQ] Fetching from fallback API...');

  const headers: HeadersInit = apiKey ? { 'X-API-Key': apiKey } : {};

  // Step 1: Find nearby locations (25km radius)
  const locationsUrl = `${OPENAQ_API_URL}/locations?coordinates=${lat},${lon}&radius=25000&limit=5`;
  const locationsResponse = await fetchWithTimeout(locationsUrl, { headers });
  const locationsData = await locationsResponse.json();

  if (!locationsData.results || locationsData.results.length === 0) {
    throw new Error('No OpenAQ stations found nearby');
  }

  const nearestLocation: OpenAQLocation = locationsData.results[0];

  // Step 2: Get latest measurements from the nearest station
  const latestUrl = `${OPENAQ_API_URL}/locations/${nearestLocation.id}/latest`;
  const latestResponse = await fetchWithTimeout(latestUrl, { headers });
  const latestData: OpenAQLatestResponse = await latestResponse.json();

  if (!latestData.results || latestData.results.length === 0) {
    throw new Error('No recent measurements from OpenAQ station');
  }

  // Extract pollutant values
  const pollutants: Record<string, number> = {};
  for (const sensor of latestData.results) {
    const name = sensor.parameter.name.toLowerCase();
    pollutants[name] = sensor.value;
  }

  // Calculate AQI from PM2.5 or PM10
  const pm25 = pollutants['pm25'] ?? pollutants['pm2.5'] ?? 0;
  const pm10 = pollutants['pm10'] ?? 0;
  const aqi = pm25 > 0 ? calculateAQI(pm25) : (pm10 > 0 ? Math.round(pm10 * 0.7) : 50);

  const config = getAQIConfig(aqi);
  const detailedAddr = await fetchDetailedAddress(lat, lon);

  return {
    aqi,
    category: config.label,
    color: config.color,
    location: {
      city: detailedAddr.city || nearestLocation.name,
      lat,
      lon,
      address: detailedAddr
    },
    lastUpdated: new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    pollutants: {
      pm25: pm25 || Math.floor(aqi * 0.58),
      pm10: pm10 || Math.floor(aqi * 0.85),
      no2: pollutants['no2'] ?? 0,
      so2: pollutants['so2'] ?? 0,
      co: pollutants['co'] ?? 0,
      o3: pollutants['o3'] ?? 0,
    }
  };
};

// ========== Simulated Data (Graceful Degradation) ==========

const generateSimulatedData = async (lat: number, lon: number): Promise<AQIResponse> => {
  console.warn('[AQI] Using simulated data - API unavailable');
  const detailedAddr = await fetchDetailedAddress(lat, lon);
  const geoSeed = (lat * 100) + (lon * 100);
  const hourSeed = new Date().getHours();
  const baseValue = Math.floor((Math.abs(Math.sin(geoSeed + hourSeed)) * 220) + 15);
  const config = getAQIConfig(baseValue);

  return {
    aqi: baseValue,
    category: config.label,
    color: config.color,
    location: {
      city: detailedAddr.city,
      lat,
      lon,
      address: detailedAddr
    },
    lastUpdated: new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    pollutants: {
      pm25: Math.floor(baseValue * 0.58),
      pm10: Math.floor(baseValue * 0.85),
      no2: Math.floor(Math.abs(Math.cos(geoSeed)) * 50 + 10),
      so2: Math.floor(Math.abs(Math.sin(geoSeed)) * 15 + 2),
      co: parseFloat((Math.abs(Math.tan(geoSeed / 100)) * 1.5 + 0.2).toFixed(2)),
      o3: Math.floor(Math.abs(Math.sin(geoSeed * 2)) * 80 + 5),
    }
  };
};

// ========== Main Exported Functions ==========

export const fetchAQIData = async (lat: number, lon: number): Promise<AQIResponse> => {
  // 1. Check cache first
  const cached = getFromCache(lat, lon);
  if (cached) return cached;

  // 2. Try AQICN/WAQI (Primary API)
  try {
    const data = await fetchFromWAQI(lat, lon);
    console.log('[WAQI] Successfully fetched real AQI data');
    saveToCache(lat, lon, data);
    return data;
  } catch (error) {
    console.warn('[WAQI] Primary API failed:', error instanceof Error ? error.message : error);
  }

  // 3. Try OpenAQ (Fallback API)
  try {
    const data = await fetchFromOpenAQ(lat, lon);
    console.log('[OpenAQ] Successfully fetched real AQI data from fallback');
    saveToCache(lat, lon, data);
    return data;
  } catch (error) {
    console.warn('[OpenAQ] Fallback API failed:', error instanceof Error ? error.message : error);
  }

  // 4. Graceful degradation to simulated data
  const simulated = await generateSimulatedData(lat, lon);
  return simulated;
};

export const fetchForecastData = (baseAqi: number): HourlyForecast[] => {
  const forecast: HourlyForecast[] = [];
  const currentHour = new Date().getHours();

  for (let i = 1; i <= 12; i++) {
    const targetHour = (currentHour + i) % 24;
    let variance = Math.sin(i / 2) * 20;
    if ((targetHour >= 8 && targetHour <= 10) || (targetHour >= 17 && targetHour <= 20)) {
      variance += 40;
    }

    const predictedAqi = Math.max(10, Math.floor(baseAqi + variance));
    forecast.push({
      time: `${targetHour}:00`,
      aqi: predictedAqi,
      label: getAQIConfig(predictedAqi).label
    });
  }
  return forecast;
};

export const searchCity = async (query: string): Promise<AQILocation | null> => {
  try {
    const response = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`
    );
    const data = await response.json();
    if (data.length > 0) {
      const addr = data[0].address;
      return {
        city: data[0].display_name.split(',')[0],
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        address: {
          road: addr.road,
          suburb: addr.suburb || addr.neighbourhood,
          city: addr.city || addr.town || addr.village || "Unknown Area"
        }
      };
    }
    return null;
  } catch {
    return null;
  }
};
