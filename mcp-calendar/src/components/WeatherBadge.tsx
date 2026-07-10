"use client";

import { useEffect, useState } from "react";
import { isSameDay } from "@/lib/calendar-utils";
import { describeWeatherCode, getWeatherDetailsUrl } from "@/lib/weather";

type WeatherState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      weatherCode: number;
      currentWeatherCode: number | null;
      temperatureMax: number;
      temperatureMin: number;
      currentTemperature: number | null;
      note: string;
    };

function toDateParam(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function WeatherBadge({ date }: { date: Date }) {
  const [state, setState] = useState<WeatherState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    fetch(`/api/weather?date=${toDateParam(date)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (cancelled) return;
        setState({ status: "ready", ...data });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  if (state.status === "loading") {
    return <span className="text-xs text-zinc-600">···</span>;
  }

  if (state.status === "error") {
    return <span className="text-xs text-zinc-600">날씨 없음</span>;
  }

  const isToday = isSameDay(date, new Date());
  const displayWeatherCode =
    isToday && state.currentWeatherCode !== null
      ? state.currentWeatherCode
      : state.weatherCode;
  const { emoji, label } = describeWeatherCode(displayWeatherCode);
  const showCurrent = isToday && state.currentTemperature !== null;

  return (
    <a
      href={getWeatherDetailsUrl(date)}
      target="_blank"
      rel="noopener noreferrer"
      title={`${label} · ${Math.round(state.temperatureMax)}° / ${Math.round(state.temperatureMin)}° · 자세히 보기`}
      className="flex flex-col items-end text-right"
    >
      <span className="text-4xl leading-none">{emoji}</span>
      <span className="mt-1 text-xs leading-snug text-zinc-400">
        {state.note}
      </span>
      <span className="mt-1 whitespace-nowrap text-[10px] tabular-nums text-zinc-500">
        {showCurrent && `현재 ${Math.round(state.currentTemperature as number)}° · `}
        최고 {Math.round(state.temperatureMax)}° / 최저 {Math.round(state.temperatureMin)}°
      </span>
    </a>
  );
}
