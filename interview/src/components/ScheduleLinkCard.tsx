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

function toTimeInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function combineDateAndTime(date: Date, time: string): Date | null {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

export function ScheduleLinkCard({ date }: { date: Date }) {
  const [state, setState] = useState<ScheduleLinkState>({ status: "loading" });

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  function loadSchedule() {
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
  }

  useEffect(() => loadSchedule(), [date]);

  async function handleAdd() {
    if (!title.trim()) return;
    const start = combineDateAndTime(date, startTime);
    const end = combineDateAndTime(date, endTime);
    if (!start || !end) {
      setFormError("시간 형식이 올바르지 않아요");
      return;
    }

    setAdding(true);
    setFormError(null);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          start: start.toISOString(),
          end: end.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "추가 실패");

      setTitle("");
      loadSchedule();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "추가 실패");
    } finally {
      setAdding(false);
    }
  }

  function startEditing(event: PreviewEvent) {
    setEditingId(event.id);
    setEditTitle(event.title);
    setEditStart(toTimeInputValue(event.start));
    setEditEnd(toTimeInputValue(event.end));
  }

  async function handleSaveEdit(id: number) {
    const start = combineDateAndTime(date, editStart);
    const end = combineDateAndTime(date, editEnd);
    if (!editTitle.trim() || !start || !end) return;

    setSavingId(id);
    try {
      const res = await fetch(`/api/schedule/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          start: start.toISOString(),
          end: end.toISOString(),
        }),
      });
      if (!res.ok) throw new Error();
      setEditingId(null);
      loadSchedule();
    } catch {
      setFormError("수정 실패");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: number) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      loadSchedule();
    } catch {
      setFormError("삭제 실패");
    } finally {
      setSavingId(null);
    }
  }

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

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="text"
          name="schedule-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="일정 제목"
          className="min-w-[140px] flex-1 rounded-full bg-white/[0.06] px-4 py-2.5 text-sm text-[#eef2f0] outline-none placeholder:text-white/35 focus:ring-1 focus:ring-emerald-400/60"
        />
        <input
          type="time"
          name="schedule-start"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="rounded-full bg-white/[0.06] px-3 py-2.5 text-sm text-[#eef2f0] outline-none focus:ring-1 focus:ring-emerald-400/60"
        />
        <input
          type="time"
          name="schedule-end"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="rounded-full bg-white/[0.06] px-3 py-2.5 text-sm text-[#eef2f0] outline-none focus:ring-1 focus:ring-emerald-400/60"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !title.trim()}
          className="whitespace-nowrap rounded-full bg-gradient-to-r from-[#3fd8a6] to-[#2ea888] px-4.5 py-2.5 text-[13px] font-semibold text-[#06231a] transition hover:brightness-110 disabled:opacity-50"
        >
          추가
        </button>
      </div>

      {formError && <p className="mt-2 text-xs text-red-400">{formError}</p>}

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
          state.events.map((event) =>
            editingId === event.id ? (
              <div
                key={event.id}
                className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] py-2.5 first:border-t-0"
              >
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="min-w-[100px] flex-1 rounded-full bg-white/[0.06] px-3 py-1.5 text-sm text-[#eef2f0] outline-none focus:ring-1 focus:ring-emerald-400/60"
                />
                <input
                  type="time"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  className="rounded-full bg-white/[0.06] px-2.5 py-1.5 text-xs text-[#eef2f0] outline-none focus:ring-1 focus:ring-emerald-400/60"
                />
                <input
                  type="time"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                  className="rounded-full bg-white/[0.06] px-2.5 py-1.5 text-xs text-[#eef2f0] outline-none focus:ring-1 focus:ring-emerald-400/60"
                />
                <button
                  onClick={() => handleSaveEdit(event.id)}
                  disabled={savingId === event.id}
                  className="whitespace-nowrap rounded-full bg-gradient-to-r from-[#3fd8a6] to-[#2ea888] px-3.5 py-1.5 text-xs font-semibold text-[#06231a] transition hover:brightness-110 disabled:opacity-50"
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs text-white/40 transition hover:text-white/70"
                >
                  취소
                </button>
              </div>
            ) : (
              <div
                key={event.id}
                className="flex items-center gap-3 border-t border-white/[0.07] py-2.5 first:border-t-0"
              >
                <a
                  href={MCP_CALENDAR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center gap-3 truncate transition hover:text-emerald-300"
                >
                  <span className="w-14 shrink-0 text-xs tabular-nums text-white/40">
                    {timeFormatter.format(new Date(event.start))}
                  </span>
                  <span className="flex-1 truncate text-sm">{event.title}</span>
                </a>
                <button
                  onClick={() => startEditing(event)}
                  className="text-xs text-white/30 transition hover:text-emerald-300"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  disabled={savingId === event.id}
                  className="text-xs text-white/30 transition hover:text-red-400 disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            ),
          )}
      </div>
    </div>
  );
}
