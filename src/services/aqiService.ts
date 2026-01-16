
import { AQIResponse, AQILocation, DetailedAddress } from "../types";
import { getAQIConfig } from "../constants";

export interface HourlyForecast {
  time: string;
  aqi: number;
  label: string;
}

const fetchDetailedAddress = async (lat: number, lon: number): Promise<DetailedAddress> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
    const data = await response.json();
    const addr = data.address;
    return {
      road: addr.road,
      suburb: addr.suburb || addr.neighbourhood || addr.residential,
      colony: addr.neighbourhood || addr.suburb,
      city: addr.city || addr.town || addr.village || "Metropolitan Area",
      houseNumber: addr.house_number
    };
  } catch (err) {
    return { city: "Remote Coordinate" };
  }
};

export const fetchAQIData = async (lat: number, lon: number): Promise<AQIResponse> => {
  await new Promise(resolve => setTimeout(resolve, 600));
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
      lat: lat,
      lon: lon,
      address: detailedAddr
    },
    lastUpdated: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
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
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`);
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
