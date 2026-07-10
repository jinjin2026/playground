export const WEATHER_LOCATION = {
  name: "Seoul",
  latitude: 37.5665,
  longitude: 126.978,
};

export type DailyWeather = {
  weatherCode: number;
  currentWeatherCode: number | null;
  temperatureMax: number;
  temperatureMin: number;
  currentTemperature: number | null;
  note: string;
};

const WEATHER_CODE_INFO: Record<number, { emoji: string; label: string }> = {
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

const RAIN_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

export function describeWeatherCode(code: number) {
  return WEATHER_CODE_INFO[code] ?? { emoji: "🌡️", label: "알 수 없음" };
}

function toDateParam(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getWeatherDetailsUrl(date: Date) {
  const query = `${WEATHER_LOCATION.name} weather ${toDateParam(date)}`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function buildWeatherNote({
  weatherCode,
  temperatureMax,
  temperatureMin,
  precipitationProbability,
  humidityMean,
  previousTemperatureMax,
}: {
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbability: number | null;
  humidityMean: number | null;
  previousTemperatureMax: number | null;
}) {
  if (
    RAIN_CODES.has(weatherCode) ||
    (precipitationProbability !== null && precipitationProbability >= 50)
  ) {
    return "우산이 필요해요";
  }

  if (SNOW_CODES.has(weatherCode)) {
    return "눈이 와요, 따뜻하게 입으세요";
  }

  if (temperatureMax >= 33) {
    return "오늘 정말 더워요, 물 챙기세요";
  }

  if (temperatureMin <= 0) {
    return "오늘 많이 추워요, 따뜻하게 입으세요";
  }

  if (humidityMean !== null && humidityMean >= 75) {
    return "오늘 정말 습해요";
  }

  if (previousTemperatureMax !== null) {
    const diff = Math.round(temperatureMax - previousTemperatureMax);
    if (diff <= -3) {
      return `오늘은 어제보다 ${Math.abs(diff)}도 낮아요`;
    }
    if (diff >= 3) {
      return `오늘은 어제보다 ${diff}도 높아요`;
    }
  }

  return "오늘 날씨는 쾌적해요";
}

export async function fetchDailyWeather(
  date: Date,
): Promise<DailyWeather | null> {
  const previousDay = new Date(date);
  previousDay.setDate(previousDay.getDate() - 1);

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(WEATHER_LOCATION.latitude));
  url.searchParams.set("longitude", String(WEATHER_LOCATION.longitude));
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("hourly", "relative_humidity_2m");
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

  const note = buildWeatherNote({
    weatherCode,
    temperatureMax,
    temperatureMin,
    precipitationProbability,
    humidityMean,
    previousTemperatureMax,
  });

  const currentTemperature = data?.current?.temperature_2m ?? null;
  const currentWeatherCode = data?.current?.weather_code ?? null;

  return {
    weatherCode,
    currentWeatherCode,
    temperatureMax,
    temperatureMin,
    currentTemperature,
    note,
  };
}
