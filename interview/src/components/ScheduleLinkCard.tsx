"use client";

import { useEffect, useState } from "react";
import { toDateParam } from "@/lib/date-utils";

const MCP_CALENDAR_URL =
  process.env.NEXT_PUBLIC_MCP_CALENDAR_URL ?? "http://localhost:3000";

type PreviewEvent = { id: number; title: string; start: string; end: string };

type ScheduleLinkState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "unavailable" }
  | { status: "ready"; events: PreviewEvent[] };

const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function ScheduleLinkCard({ date }: { date: Date }) {
  const [state, setState] = useState<ScheduleLinkState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    fetch(`/api/schedule-preview?date=${toDateParam(date)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { available: boolean; events: PreviewEvent[] }) => {
        if (cancelled) return;
        if (!data.available) {
          setState({ status: "unavailable" });
          return;
        }
        setState({ status: "ready", events: data.events });
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
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-[17px] font-semibold text-[#f6f8f7]">
          오늘 일정
        </h2>
        <a
          href={MCP_CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="whitespace-nowrap rounded-full bg-gradient-to-r from-[#3fd8a6] to-[#2ea888] px-3.5 py-1.5 text-xs font-semibold text-[#06231a] transition hover:brightness-110"
        >
          mcp-calendar에서 열기
        </a>
      </div>

      <div className="mt-4 flex flex-col">
        {state.status === "loading" && (
          <p className="py-4 text-sm text-white/40">불러오는 중...</p>
        )}
        {state.status === "error" && (
          <p className="py-4 text-sm text-red-400">일정을 불러오지 못했어요.</p>
        )}
        {state.status === "unavailable" && (
          <p className="py-4 text-sm text-white/40">
            mcp-calendar 앱이 실행되어 있지 않아요 · 열려면 그 프로젝트에서{" "}
            <code className="rounded bg-white/10 px-1">npm run dev</code>가
            필요해요.
          </p>
        )}
        {state.status === "ready" && state.events.length === 0 && (
          <p className="py-4 text-sm text-white/40">오늘 예정된 일정이 없어요.</p>
        )}
        {state.status === "ready" &&
          state.events.map((event) => (
            <a
              key={event.id}
              href={MCP_CALENDAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 border-t border-white/[0.07] py-2.5 first:border-t-0 transition hover:text-emerald-300"
            >
              <span className="w-14 shrink-0 text-xs tabular-nums text-white/40">
                {timeFormatter.format(new Date(event.start))}
              </span>
              <span className="flex-1 truncate text-sm">{event.title}</span>
            </a>
          ))}
      </div>
    </div>
  );
}
