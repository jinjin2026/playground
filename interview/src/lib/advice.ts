import {
  FOG_CODES,
  THUNDERSTORM_CODES,
  SNOW_CODES,
  SHOWER_CODES,
} from "./weather";

export type WeatherSignals = {
  weatherCode: number;
  hourlyWeatherCodesToday: number[];
  temperatureMax: number;
  temperatureMin: number;
  previousTemperatureMax: number | null;
  humidityMean: number | null;
  precipitationProbability: number | null;
  windSpeedMax: number | null;
  uvIndexMax: number | null;
  pm25Mean: number | null;
};

const HUMIDITY_HIGH = 75;
const PRECIP_HIGH = 70;
const PRECIP_MED_LOW = 30;
const WIND_HIGH = 8;
const WIND_VERY_HIGH = 14;
const TEMP_HOT = 33;
const TEMP_COLD = 0;
const TEMP_VERY_COLD = -10;
const TEMP_SWING = 10;
const PM25_VERY_UNHEALTHY = 76;
const UV_HIGH = 6;
const UV_VERY_HIGH = 9;
const TROPICAL_NIGHT_MIN = 25;
const ICY_ROAD_TEMP_MIN = -2;
const ICY_ROAD_TEMP_MAX = 2;

function codeSeenToday(signals: WeatherSignals, codes: Set<number>) {
  return (
    codes.has(signals.weatherCode) ||
    signals.hourlyWeatherCodesToday.some((c) => codes.has(c))
  );
}

export function computeAdvice(s: WeatherSignals): string[] {
  const advice: string[] = [];
  const isClear = s.weatherCode === 0 || s.weatherCode === 1;

  // 1. 습도 75% 이상
  if (s.humidityMean !== null && s.humidityMean >= HUMIDITY_HIGH) {
    advice.push("손수건/제습 티슈 챙기기");
  }

  // 2 / 3. 강수확률 구간 (상호 배타)
  if (
    s.precipitationProbability !== null &&
    s.precipitationProbability >= PRECIP_HIGH
  ) {
    advice.push("우산 대신 장화/부츠 착용");
  } else if (
    s.precipitationProbability !== null &&
    s.precipitationProbability >= PRECIP_MED_LOW
  ) {
    advice.push("우산 챙기기");
  }

  // 4. 자외선 강함 (uv_index_max 있으면 사용, 없으면 맑음+고온 프록시)
  const highUv =
    s.uvIndexMax !== null
      ? s.uvIndexMax >= UV_HIGH
      : isClear && s.temperatureMax >= 28;
  if (highUv) advice.push("선글라스·모자·양산 챙기기");

  // 5 / 6. 풍속
  if (s.windSpeedMax !== null && s.windSpeedMax >= WIND_HIGH) {
    advice.push("머리 묶기");
  }
  if (s.windSpeedMax !== null && s.windSpeedMax >= WIND_VERY_HIGH) {
    advice.push("우산 대신 우비 착용");
  }

  // 7 / 8. 폭염
  if (s.temperatureMax >= TEMP_HOT) {
    advice.push("물병 챙기기");
  }
  if (
    s.temperatureMax >= TEMP_HOT &&
    s.humidityMean !== null &&
    s.humidityMean >= HUMIDITY_HIGH
  ) {
    advice.push("통풍 잘되는 헐렁한 옷");
  }

  // 9 / 10. 한파
  if (s.temperatureMin <= TEMP_COLD) {
    advice.push("목도리·장갑·핫팩");
  }
  if (s.temperatureMin <= TEMP_VERY_COLD) {
    advice.push("방한 마스크 (호흡기 보호)");
  }

  // 11. 일교차
  if (
    s.previousTemperatureMax !== null &&
    Math.abs(s.temperatureMax - s.previousTemperatureMax) >= TEMP_SWING
  ) {
    advice.push("얇은 겉옷(가디건/자켓) 챙기기");
  }

  // 12. 초미세먼지 매우나쁨
  if (s.pm25Mean !== null && s.pm25Mean >= PM25_VERY_UNHEALTHY) {
    advice.push("마스크(KF94) 착용");
  }

  // 13. 자외선 매우 강함
  const veryStrongUv =
    s.uvIndexMax !== null
      ? s.uvIndexMax >= UV_VERY_HIGH
      : isClear && s.temperatureMax >= TEMP_HOT;
  if (veryStrongUv) advice.push("자외선 차단제 덧바르기 알림");

  // 14. 눈 예보
  if (codeSeenToday(s, SNOW_CODES)) {
    advice.push("미끄럼 방지 신발 + 오늘 밤엔 크리스마스 영화 한 편 어때요?");
  }

  // 15. 결빙 가능 (0도 근처 + 강수/눈 신호)
  const nearFreezing =
    s.temperatureMin <= ICY_ROAD_TEMP_MAX && s.temperatureMax >= ICY_ROAD_TEMP_MIN;
  const hasPrecipSignal =
    (s.precipitationProbability !== null &&
      s.precipitationProbability >= PRECIP_MED_LOW) ||
    codeSeenToday(s, SNOW_CODES);
  if (nearFreezing && hasPrecipSignal) {
    advice.push("도로 미끄럼 주의");
  }

  // 16. 안개
  if (codeSeenToday(s, FOG_CODES)) {
    advice.push("밝은색 옷 착용, 출근길 여유시간 두기");
  }

  // 17. 열대야
  if (s.temperatureMin >= TROPICAL_NIGHT_MIN) {
    advice.push("얇은 잠옷·시원한 침구");
  }

  // 18. 천둥번개
  if (codeSeenToday(s, THUNDERSTORM_CODES)) {
    advice.push("우산 대신 우비, 야외활동 자제");
  }

  // 19. 짧고 강한 소나기
  if (codeSeenToday(s, SHOWER_CODES)) {
    advice.push("여벌 옷/방수 가방 챙기기");
  }

  return advice;
}
