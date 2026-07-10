"use client";

import { useEffect, useState } from "react";
import { toDateParam } from "@/lib/date-utils";
import {
  describeWeatherCode,
  RAIN_CODES,
  SNOW_CODES,
} from "@/lib/weather";
import { AdviceList } from "./AdviceList";

export type SavedLocation = { name: string; latitude: number; longitude: number };

type WeatherData = {
  weatherCode: number;
  currentWeatherCode: number | null;
  temperatureMax: number;
  temperatureMin: number;
  currentTemperature: number | null;
  humidityMean: number | null;
  precipitationProbability: number | null;
  windSpeedMax: number | null;
  uvIndexMax: number | null;
  pm25Mean: number | null;
  advice: string[];
};

type WeatherState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: WeatherData };

// 히어로 배경을 날씨 코드 그룹(비/눈/맑음)에 따라 다른 레이어드 텍스처로 렌더링
function heroBackground(code: number): string {
  if (RAIN_CODES.has(code)) {
    return [
      "repeating-linear-gradient(118deg, rgba(255,255,255,0.09) 0px, rgba(255,255,255,0.09) 1px, transparent 1px, transparent 14px)",
      "repeating-linear-gradient(122deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 38px)",
      "radial-gradient(120% 90% at 15% 0%, rgba(90,150,140,0.35) 0%, transparent 55%)",
      "radial-gradient(140% 100% at 100% 100%, rgba(0,0,0,0.55) 0%, transparent 60%)",
      "radial-gradient(160% 120% at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)",
      "linear-gradient(160deg, #1c3934 0%, #0e211d 50%, #071411 100%)",
    ].join(", ");
  }
  if (SNOW_CODES.has(code)) {
    return [
      "repeating-linear-gradient(100deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 20px)",
      "radial-gradient(90% 70% at 15% 0%, rgba(150,190,220,0.35) 0%, transparent 55%)",
      "radial-gradient(140% 100% at 100% 100%, rgba(0,0,0,0.55) 0%, transparent 60%)",
      "radial-gradient(160% 120% at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)",
      "linear-gradient(160deg, #223a4a 0%, #101f28 55%, #070d12 100%)",
    ].join(", ");
  }
  return [
    "radial-gradient(90% 70% at 20% 10%, rgba(255,205,120,0.4) 0%, transparent 55%)",
    "radial-gradient(140% 100% at 100% 100%, rgba(0,0,0,0.5) 0%, transparent 60%)",
    "radial-gradient(160% 120% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
    "linear-gradient(160deg, #4a3c1a 0%, #241b0c 55%, #100c06 100%)",
  ].join(", ");
}

export function WeatherCard({
  date,
  location,
}: {
  date: Date;
  location: SavedLocation | null;
}) {
  const [state, setState] = useState<WeatherState>({ status: "loading" });

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setState({ status: "loading" });

    fetch(`/api/weather?date=${toDateParam(date)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: WeatherData) => {
        if (cancelled) return;
        setState({ status: "ready", data });
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
        <h2 className="font-heading text-[17px] font-semibold text-[#f6f8f7]">
          날씨
        </h2>
        <p className="mt-3 text-sm text-white/45">
          위치를 검색해서 저장하면 날씨를 볼 수 있어요.
        </p>
      </div>
    );
  }

  const code =
    state.status === "ready"
      ? state.data.currentWeatherCode ?? state.data.weatherCode
      : 0;

  const markerPercent =
    state.status === "ready" && state.data.currentTemperature !== null
      ? Math.max(
          0,
          Math.min(
            100,
            ((state.data.currentTemperature - state.data.temperatureMin) /
              (state.data.temperatureMax - state.data.temperatureMin)) *
              100,
          ),
        )
      : null;

  return (
    <div
      className="relative overflow-hidden rounded-[24px] border border-white/[0.12] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
    >
      <div
        className="absolute inset-0 z-0"
        style={{ background: heroBackground(code) }}
      />
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(195deg, rgba(5,12,11,0.1) 0%, rgba(5,12,11,0.45) 55%, rgba(5,12,11,0.82) 100%)",
        }}
      />

      <div className="relative z-[2] flex flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <span className="text-[26px] leading-none">
            {describeWeatherCode(code).emoji}
          </span>
          <span className="font-heading text-[13px] font-semibold uppercase tracking-[0.1em] text-white/55">
            날씨 · {location.name}
          </span>
        </div>

        {state.status === "loading" && (
          <p className="text-sm text-white/50">불러오는 중...</p>
        )}
        {state.status === "error" && (
          <p className="text-sm text-red-300">날씨를 불러오지 못했어요.</p>
        )}

        {state.status === "ready" && (
          <>
            <h3
              className="bg-gradient-to-r from-white to-[#7fe9c9] bg-clip-text font-heading text-[44px] font-bold leading-[1.05] tracking-tight text-transparent"
            >
              {describeWeatherCode(code).label}
            </h3>

            <div className="flex items-baseline gap-4">
              <span className="font-heading text-[64px] font-bold text-[#f6f8f7]">
                {state.data.currentTemperature !== null
                  ? Math.round(state.data.currentTemperature)
                  : Math.round(state.data.temperatureMax)}
                °
              </span>
              <span className="text-sm text-white/55">
                최고 {Math.round(state.data.temperatureMax)}° · 최저{" "}
                {Math.round(state.data.temperatureMin)}°
              </span>
            </div>

            {markerPercent !== null && (
              <div className="flex max-w-[420px] flex-col gap-1.5">
                <div className="relative h-1.5 rounded-full bg-gradient-to-r from-[#4fa8e8] via-[#f2c85b] to-[#e8654f]">
                  <div
                    className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[3px] border-[#06231a] bg-white"
                    style={{ left: `${markerPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-white/40">
                  <span>{Math.round(state.data.temperatureMin)}°</span>
                  <span>{Math.round(state.data.temperatureMax)}°</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2.5">
              {state.data.humidityMean !== null && (
                <span className="whitespace-nowrap rounded-full bg-white/[0.08] px-3.5 py-1.5 text-[12.5px] text-white/75">
                  습도 {Math.round(state.data.humidityMean)}%
                </span>
              )}
              {state.data.precipitationProbability !== null && (
                <span className="whitespace-nowrap rounded-full bg-white/[0.08] px-3.5 py-1.5 text-[12.5px] text-white/75">
                  강수 {Math.round(state.data.precipitationProbability)}%
                </span>
              )}
              {state.data.windSpeedMax !== null && (
                <span className="whitespace-nowrap rounded-full bg-white/[0.08] px-3.5 py-1.5 text-[12.5px] text-white/75">
                  바람 {Math.round(state.data.windSpeedMax)}m/s
                </span>
              )}
              {state.data.pm25Mean !== null && (
                <span className="whitespace-nowrap rounded-full bg-white/[0.08] px-3.5 py-1.5 text-[12.5px] text-white/75">
                  PM2.5 {Math.round(state.data.pm25Mean)}
                </span>
              )}
            </div>

            <AdviceList advice={state.data.advice} />
          </>
        )}
      </div>
    </div>
  );
}
