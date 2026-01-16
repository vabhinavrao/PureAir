
export const AQI_LEVELS = [
  { max: 50, label: 'Good', color: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' },
  { max: 100, label: 'Moderate', color: 'bg-yellow-400', text: 'text-yellow-600', light: 'bg-yellow-50' },
  { max: 150, label: 'Unhealthy for Sensitive Groups', color: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50' },
  { max: 200, label: 'Unhealthy', color: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' },
  { max: 300, label: 'Very Unhealthy', color: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-50' },
  { max: 500, label: 'Hazardous', color: 'bg-rose-900', text: 'text-rose-900', light: 'bg-rose-50' },
];

export const getAQIConfig = (aqi: number) => {
  return AQI_LEVELS.find(level => aqi <= level.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
};
