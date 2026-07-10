import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userLocation } from "@/db/schema";
import { fetchDailyWeather, fetchAirQuality } from "@/lib/weather";
import { computeAdvice } from "@/lib/advice";

export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  if (!dateParam) {
    return NextResponse.json(
      { error: "date query param is required" },
      { status: 400 },
    );
  }

  const date = new Date(dateParam);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  const [location] = await db.select().from(userLocation).limit(1);
  if (!location) {
    return NextResponse.json(
      { error: "location not set" },
      { status: 400 },
    );
  }

  const [weather, airQuality] = await Promise.all([
    fetchDailyWeather(location.latitude, location.longitude, date),
    fetchAirQuality(location.latitude, location.longitude, date),
  ]);

  if (!weather) {
    return NextResponse.json(
      { error: "weather unavailable" },
      { status: 502 },
    );
  }

  const advice = computeAdvice({
    weatherCode: weather.weatherCode,
    hourlyWeatherCodesToday: weather.hourlyWeatherCodesToday,
    temperatureMax: weather.temperatureMax,
    temperatureMin: weather.temperatureMin,
    previousTemperatureMax: weather.previousTemperatureMax,
    humidityMean: weather.humidityMean,
    precipitationProbability: weather.precipitationProbability,
    windSpeedMax: weather.windSpeedMax,
    uvIndexMax: weather.uvIndexMax,
    pm25Mean: airQuality?.pm25Mean ?? null,
  });

  return NextResponse.json({
    location: { name: location.name, latitude: location.latitude, longitude: location.longitude },
    weatherCode: weather.weatherCode,
    currentWeatherCode: weather.currentWeatherCode,
    temperatureMax: weather.temperatureMax,
    temperatureMin: weather.temperatureMin,
    currentTemperature: weather.currentTemperature,
    humidityMean: weather.humidityMean,
    precipitationProbability: weather.precipitationProbability,
    windSpeedMax: weather.windSpeedMax,
    uvIndexMax: weather.uvIndexMax,
    pm25Mean: airQuality?.pm25Mean ?? null,
    advice,
  });
}
