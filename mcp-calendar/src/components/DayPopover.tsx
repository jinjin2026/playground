"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { CalendarEvent } from "@/lib/calendar-utils";
import { toLocalInputValue } from "@/lib/calendar-utils";

const dateLabelFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
});

const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
});

type FormProps =
  | {
      mode: "create";
      date: Date;
      onCancel: () => void;
      onSaved: (event: CalendarEvent) => void;
    }
  | {
      mode: "edit";
      event: CalendarEvent;
      onCancel: () => void;
      onSaved: (event: CalendarEvent) => void;
      onDeleted: (id: number) => void;
    };

function EventForm(props: FormProps) {
  const { mode, onCancel, onSaved } = props;

  const [title, setTitle] = useState(mode === "edit" ? props.event.title : "");
  const [startInput, setStartInput] = useState(() => {
    if (mode === "create") {
      const d = new Date(props.date);
      d.setHours(9, 0, 0, 0);
      return toLocalInputValue(d);
    }
    return toLocalInputValue(new Date(props.event.start));
  });
  const [endInput, setEndInput] = useState(() => {
    if (mode === "create") {
      const d = new Date(props.date);
      d.setHours(10, 0, 0, 0);
      return toLocalInputValue(d);
    }
    return toLocalInputValue(new Date(props.event.end));
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (mode !== "edit") return;
    if (!window.confirm("이 일정을 삭제하시겠습니까?")) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${props.event.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "삭제에 실패했습니다.");
      }

      props.onDeleted(props.event.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
      setDeleting(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url =
        mode === "create" ? "/api/events" : `/api/events/${props.event.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, start: startInput, end: endInput }),
      });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body?.error ?? "저장에 실패했습니다.");
      }

      onSaved({
        id: body.id,
        title: body.title,
        start: new Date(body.start).toISOString(),
        end: new Date(body.end).toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 p-2.5">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="일정 제목"
        autoFocus
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-500"
      />
      <div className="flex items-center gap-1.5">
        <input
          type="datetime-local"
          value={startInput}
          onChange={(e) => setStartInput(e.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white outline-none focus:border-emerald-500"
        />
        <span className="text-xs text-zinc-500">-</span>
        <input
          type="datetime-local"
          value={endInput}
          onChange={(e) => setEndInput(e.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white outline-none focus:border-emerald-500"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center justify-between gap-1.5">
        {mode === "edit" ? (
          <button
            onClick={handleDelete}
            disabled={saving || deleting}
            className="rounded-md px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
          >
            {deleting ? "삭제 중..." : "삭제"}
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-1.5">
          <button
            onClick={onCancel}
            disabled={saving || deleting}
            className="rounded-md px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || deleting}
            className="rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
          >
            {saving ? "저장 중..." : mode === "create" ? "추가" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DayPopover({
  date,
  anchorRect,
  events,
  onClose,
  onSaved,
  onDeleted,
}: {
  date: Date;
  anchorRect: DOMRect;
  events: CalendarEvent[];
  onClose: () => void;
  onSaved: (event: CalendarEvent) => void;
  onDeleted: (id: number) => void;
}) {
  const [activeId, setActiveId] = useState<number | "new" | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = anchorRect.left;
    let top = anchorRect.bottom + margin;

    if (left + rect.width + margin > vw) {
      left = vw - rect.width - margin;
    }
    if (left < margin) left = margin;

    if (top + rect.height + margin > vh) {
      top = anchorRect.top - rect.height - margin;
    }
    if (top < margin) top = margin;

    setPosition({ top, left });
    setVisible(true);
  }, [anchorRect, activeId, events.length]);

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={panelRef}
        style={{ top: position.top, left: position.left, opacity: visible ? 1 : 0 }}
        className="fixed z-50 w-72 rounded-xl border border-zinc-700 bg-zinc-900 p-3.5 text-white shadow-2xl transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">{dateLabelFormatter.format(date)}</p>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="text-zinc-500 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {sortedEvents.length === 0 && activeId !== "new" && (
            <p className="text-xs text-zinc-500">일정이 없습니다.</p>
          )}

          {sortedEvents.map((event) =>
            activeId === event.id ? (
              <EventForm
                key={event.id}
                mode="edit"
                event={event}
                onCancel={() => setActiveId(null)}
                onSaved={(saved) => {
                  onSaved(saved);
                  setActiveId(null);
                }}
                onDeleted={(id) => {
                  onDeleted(id);
                  setActiveId(null);
                }}
              />
            ) : (
              <button
                key={event.id}
                onClick={() => setActiveId(event.id)}
                className="rounded-lg bg-zinc-800 px-3 py-2 text-left hover:bg-zinc-700"
              >
                <p className="truncate text-sm font-medium">{event.title}</p>
                <p className="text-xs text-zinc-500">
                  {timeFormatter.format(new Date(event.start))} -{" "}
                  {timeFormatter.format(new Date(event.end))}
                </p>
              </button>
            ),
          )}

          {activeId === "new" ? (
            <EventForm
              mode="create"
              date={date}
              onCancel={() => setActiveId(null)}
              onSaved={(saved) => {
                onSaved(saved);
                setActiveId(null);
              }}
            />
          ) : (
            <button
              onClick={() => setActiveId("new")}
              className="mt-0.5 rounded-lg border border-dashed border-zinc-600 px-3 py-2 text-sm text-zinc-400 hover:border-emerald-500 hover:text-emerald-400"
            >
              + 새 일정 추가
            </button>
          )}
        </div>
      </div>
    </>
  );
}
