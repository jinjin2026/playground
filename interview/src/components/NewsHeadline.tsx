"use client";

import { useEffect, useState } from "react";
import { toDateParam } from "@/lib/date-utils";

type WeatherNews = {
  rawHeadline: string;
  plainSummary: string;
  sourceUrl: string;
};

type NewsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; news: WeatherNews };

export function NewsHeadline({ date }: { date: Date }) {
  const [state, setState] = useState<NewsState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    fetch(`/api/weather-news?date=${toDateParam(date)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: WeatherNews) => {
        if (cancelled) return;
        setState({ status: "ready", news: data });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  return (
    <div className="flex flex-col rounded-[20px] border border-white/[0.09] bg-white/[0.045] p-6 text-[#eef2f0] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <h2 className="font-heading text-[17px] font-semibold text-[#f6f8f7]">
        오늘의 날씨 뉴스
      </h2>

      {state.status === "loading" && (
        <p className="mt-3 text-sm text-white/40">불러오는 중...</p>
      )}
      {state.status === "error" && (
        <p className="mt-3 text-sm text-red-400">뉴스를 불러오지 못했어요.</p>
      )}
      {state.status === "ready" && (
        <div className="mt-3">
          <p className="text-sm text-white/75">{state.news.plainSummary}</p>
          {state.news.rawHeadline && (
            <p className="mt-2 text-xs text-white/40">{state.news.rawHeadline}</p>
          )}
          {state.news.sourceUrl && (
            <a
              href={state.news.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-emerald-300 hover:underline"
            >
              기상청 특보 원문 보기 →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
