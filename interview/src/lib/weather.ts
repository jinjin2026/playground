export const WEATHER_CODE_INFO: Record<number, { emoji: string; label: string }> = {
  0: { emoji: "☀️", label: "맑음" },
  1: { emoji: "🌤️", label: "대체로 맑음" },
  2: { emoji: "⛅", label: "구름 조금" },
  3: { emoji: "☁️", label: "흐림" },
  45: { emoji: "🌫️", label: "안개" },
  48: { emoji: "🌫️", label: "안개" },
  51: { emoji: "🌦️", label: "약한 이슬비" },
  53: { emoji: "🌦️", label: "이슬비" },
  55: { emoji: "🌦️", label: "강한 이슬비" },
  61: { emoji: "🌧️", label: "약한 비" },
  63: { emoji: "🌧️", label: "비" },
  65: { emoji: "🌧️", label: "강한 비" },
  66: { emoji: "🌧️", label: "어는 비" },
  67: { emoji: "🌧️", label: "강한 어는 비" },
  71: { emoji: "🌨️", label: "약한 눈" },
  73: { emoji: "🌨️", label: "눈" },
  75: { emoji: "❄️", label: "강한 눈" },
  77: { emoji: "🌨️", label: "싸락눈" },
  80: { emoji: "🌧️", label: "약한 소나기" },
  81: { emoji: "🌧️", label: "소나기" },
  82: { emoji: "⛈️", label: "강한 소나기" },
  85: { emoji: "🌨️", label: "소나기 눈" },
  86: { emoji: "🌨️", label: "강한 소나기 눈" },
  95: { emoji: "⛈️", label: "뇌우" },
  96: { emoji: "⛈️", label: "우박 동반 뇌우" },
  99: { emoji: "⛈️", label: "강한 우박 동반 뇌우" },
};

export const RAIN_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);
export const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
export const FOG_CODES = new Set([45, 48]);
export const THUNDERSTORM_CODES = new Set([95, 96, 99]);
export const SHOWER_CODES = new Set([80, 81, 82]);

export function describeWeatherCode(code: number) {
  return WEATHER_CODE_INFO[code] ?? { emoji: "🌡️", label: "알 수 없음" };
}

export type DailyWeather = {
  weatherCode: number;
  currentWeatherCode: number | null;
  temperatureMax: number;
  temperatureMin: number;
  currentTemperature: number | null;
  precipitationProbability: number | null;
  humidityMean: number | null;
  windSpeedMax: number | null;
  uvIndexMax: number | null;
  previousTemperatureMax: number | null;
  hourlyWeatherCodesToday: number[];
};

function toDateParam(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export async function fetchDailyWeather(
  latitude: number,
  longitude: number,
  date: Date,
): Promise<DailyWeather | null> {
  const previousDay = new Date(date);
  previousDay.setDate(previousDay.getDate() - 1);

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max",
  );
  url.searchParams.set("hourly", "relative_humidity_2m,weather_code");
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("start_date", toDateParam(previousDay));
  url.searchParams.set("end_date", toDateParam(date));

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;

  const data = await response.json();
  const dateParam = toDateParam(date);
  const dayIndex: string[] = data?.daily?.time ?? [];
  const selectedIndex = dayIndex.indexOf(dateParam);
  if (selectedIndex === -1) return null;

  const weatherCode = data?.daily?.weather_code?.[selectedIndex];
  const temperatureMax = data?.daily?.temperature_2m_max?.[selectedIndex];
  const temperatureMin = data?.daily?.temperature_2m_min?.[selectedIndex];
  const precipitationProbability =
    data?.daily?.precipitation_probability_max?.[selectedIndex] ?? null;
  const windSpeedMax = data?.daily?.wind_speed_10m_max?.[selectedIndex] ?? null;
  const uvIndexMax = data?.daily?.uv_index_max?.[selectedIndex] ?? null;

  if (
    weatherCode === undefined ||
    temperatureMax === undefined ||
    temperatureMin === undefined
  ) {
    return null;
  }

  const previousTemperatureMax =
    selectedIndex > 0
      ? (data?.daily?.temperature_2m_max?.[selectedIndex - 1] ?? null)
      : null;

  const hourlyTimes: string[] = data?.hourly?.time ?? [];
  const hourlyHumidity: number[] = data?.hourly?.relative_humidity_2m ?? [];
  const hourlyCodes: number[] = data?.hourly?.weather_code ?? [];

  const humidityForDay = hourlyTimes
    .map((time, index) => ({ time, value: hourlyHumidity[index] }))
    .filter(({ time }) => time.startsWith(dateParam))
    .map(({ value }) => value)
    .filter((value): value is number => typeof value === "number");
  const humidityMean =
    humidityForDay.length > 0
      ? humidityForDay.reduce((sum, value) => sum + value, 0) /
        humidityForDay.length
      : null;

  const hourlyWeatherCodesToday = hourlyTimes
    .map((time, index) => ({ time, value: hourlyCodes[index] }))
    .filter(({ time }) => time.startsWith(dateParam))
    .map(({ value }) => value)
    .filter((value): value is number => typeof value === "number");

  const currentTemperature = data?.current?.temperature_2m ?? null;
  const currentWeatherCode = data?.current?.weather_code ?? null;

  return {
    weatherCode,
    currentWeatherCode,
    temperatureMax,
    temperatureMin,
    currentTemperature,
    precipitationProbability,
    humidityMean,
    windSpeedMax,
    uvIndexMax,
    previousTemperatureMax,
    hourlyWeatherCodesToday,
  };
}

export type AirQuality = { pm25Mean: number | null };

export async function fetchAirQuality(
  latitude: number,
  longitude: number,
  date: Date,
): Promise<AirQuality | null> {
  const dateParam = toDateParam(date);
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("hourly", "pm2_5");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("start_date", dateParam);
  url.searchParams.set("end_date", dateParam);

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;

    const data = await response.json();
    const hourlyTimes: string[] = data?.hourly?.time ?? [];
    const hourlyPm25: number[] = data?.hourly?.pm2_5 ?? [];

    const pm25ForDay = hourlyTimes
      .map((time, index) => ({ time, value: hourlyPm25[index] }))
      .filter(({ time }) => time.startsWith(dateParam))
      .map(({ value }) => value)
      .filter((value): value is number => typeof value === "number");

    const pm25Mean =
      pm25ForDay.length > 0
        ? pm25ForDay.reduce((sum, value) => sum + value, 0) / pm25ForDay.length
        : null;

    return { pm25Mean };
  } catch {
    return null;
  }
}
