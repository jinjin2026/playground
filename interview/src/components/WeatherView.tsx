"use client";

import { useEffect, useState } from "react";
import { toDateParam } from "@/lib/date-utils";
import { describeWeatherCode } from "@/lib/weather";
import type { ForecastDay, HourlyPoint } from "@/lib/weather";
import type { SavedLocation } from "./WeatherCard";
import { ForecastStrip } from "./weather/ForecastStrip";
import { TempTrendChart } from "./weather/TempTrendChart";
import { StatChart, type StatChartPoint } from "./weather/StatChart";

type CurrentSummary = {
  currentWeatherCode: number | null;
  weatherCode: number;
  currentTemperature: number | null;
  temperatureMax: number;
  temperatureMin: number;
  humidityMean: number | null;
  windSpeedMax: number | null;
};

type WeatherViewState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      current: CurrentSummary;
      hourly: HourlyPoint[];
      forecastDays: ForecastDay[];
    };

export function WeatherView({
  date,
  location,
}: {
  date: Date;
  location: SavedLocation | null;
}) {
  const [state, setState] = useState<WeatherViewState>({ status: "loading" });

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setState({ status: "loading" });

    const dateParam = toDateParam(date);
    Promise.all([
      fetch(`/api/weather?date=${dateParam}`).then((res) =>
        res.ok ? res.json() : Promise.reject(res),
      ),
      fetch(`/api/weather-detail?date=${dateParam}`).then((res) =>
        res.ok ? res.json() : Promise.reject(res),
      ),
    ])
      .then(([current, detail]) => {
        if (cancelled) return;
        setState({
          status: "ready",
          current,
          hourly: detail.hourly,
          forecastDays: detail.forecastDays,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [date, location]);

  if (!location) {
    return (
      <div className="flex flex-col rounded-[20px] border border-white/[0.09] bg-white/[0.045] p-6 text-[#eef2f0] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <p className="text-sm text-white/45">
          위치를 검색해서 저장하면 상세 날씨를 볼 수 있어요.
        </p>
      </div>
    );
  }

  if (state.status === "loading") {
    return <p className="text-sm text-white/50">불러오는 중...</p>;
  }

  if (state.status === "error") {
    return <p className="text-sm text-red-300">날씨를 불러오지 못했어요.</p>;
  }

  const { current, hourly, forecastDays } = state;
  const code = current.currentWeatherCode ?? current.weatherCode;
  const info = describeWeatherCode(code);

  const toSeries = (
    key: keyof HourlyPoint,
  ): StatChartPoint[] =>
    hourly.map((point) => ({
      time: point.time,
      value: typeof point[key] === "number" ? (point[key] as number) : null,
    }));

  const latestWind = hourly[hourly.length - 1]?.windSpeed;
  const latestPressure = hourly[hourly.length - 1]?.pressure;
  const latestHumidity = hourly[hourly.length - 1]?.humidity;
  const rainTotal = hourly.reduce(
    (sum, point) => sum + (point.precipitation ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col justify-center rounded-[20px] border border-white/[0.09] bg-white/[0.045] p-6 text-[#eef2f0] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <span className="text-[26px] leading-none">{info.emoji}</span>
            <span className="font-heading text-[13px] font-semibold uppercase tracking-[0.1em] text-white/55">
              {location.name}
            </span>
          </div>
          <h3 className="mt-2 font-heading text-[20px] font-semibold text-[#f6f8f7]">
            {info.label}
          </h3>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-heading text-[52px] font-bold text-[#f6f8f7]">
              {current.currentTemperature !== null
                ? Math.round(current.currentTemperature)
                : Math.round(current.temperatureMax)}
              °
            </span>
            <span className="text-sm text-white/55">
              최고 {Math.round(current.temperatureMax)}° · 최저{" "}
              {Math.round(current.temperatureMin)}°
            </span>
          </div>
        </div>

        <ForecastStrip days={forecastDays} />
      </div>

      <TempTrendChart hourly={hourly} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatChart
          title="바람"
          value={latestWind !== undefined && latestWind !== null ? String(Math.round(latestWind)) : "-"}
          unit="m/s"
          color="#8ab4e8"
          data={toSeries("windSpeed")}
        />
        <StatChart
          title="기압"
          value={
            latestPressure !== undefined && latestPressure !== null
              ? String(Math.round(latestPressure))
              : "-"
          }
          unit="hPa"
          color="#c99bf0"
          data={toSeries("pressure")}
        />
        <StatChart
          title="습도"
          value={
            latestHumidity !== undefined && latestHumidity !== null
              ? String(Math.round(latestHumidity))
              : "-"
          }
          unit="%"
          color="#5fd0e0"
          data={toSeries("humidity")}
        />
        <StatChart
          title="강수량"
          value={String(Math.round(rainTotal * 10) / 10)}
          unit="mm"
          color="#4fa8e8"
          data={toSeries("precipitation")}
          type="bar"
        />
      </div>
    </div>
  );
}
