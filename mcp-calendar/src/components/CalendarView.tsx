"use client";

import { useState } from "react";

export type CalendarEvent = {
  id: number;
  title: string;
  start: string;
  end: string;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildMonthGrid(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const daysInMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
  ).getDate();

  const cells: (Date | null)[] = Array(firstDay.getDay()).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
});

const detailFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function EventDetailModal({
  event,
  onClose,
  onSaved,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onSaved: (updated: CalendarEvent) => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [startInput, setStartInput] = useState(
    toLocalInputValue(new Date(event.start)),
  );
  const [endInput, setEndInput] = useState(
    toLocalInputValue(new Date(event.end)),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
            일정 상세
          </h3>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          {detailFormatter.format(new Date(event.start))} -{" "}
          {detailFormatter.format(new Date(event.end))}
        </p>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            제목
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-black outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            시작
            <input
              type="datetime-local"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-black outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            종료
            <input
              type="datetime-local"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-black outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </label>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-black px-3 py-1.5 text-sm text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CalendarView({
  events,
  initialMonth,
}: {
  events: CalendarEvent[];
  initialMonth: string;
}) {
  const [eventList, setEventList] = useState(events);
  const [current, setCurrent] = useState(() => new Date(initialMonth));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const today = new Date(initialMonth);

  const cells = buildMonthGrid(current);
  const monthLabel = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(current);

  const parsedEvents = eventList.map((event) => ({
    ...event,
    startDate: new Date(event.start),
    endDate: new Date(event.end),
  }));

  function goToPrevMonth() {
    setCurrent((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCurrent((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function goToToday() {
    setCurrent(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  function handleSaved(updated: CalendarEvent) {
    setEventList((prev) =>
      prev.map((event) => (event.id === updated.id ? updated : event)),
    );
    setSelectedEvent(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="rounded-md border border-zinc-200 px-2.5 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            오늘
          </button>
          <button
            onClick={goToPrevMonth}
            aria-label="이전 달"
            className="rounded-md border border-zinc-200 px-2.5 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            ‹
          </button>
          <button
            onClick={goToNextMonth}
            aria-label="다음 달"
            className="rounded-md border border-zinc-200 px-2.5 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800">
        {cells.map((date, index) => {
          const dayEvents = date
            ? parsedEvents
                .filter((event) => isSameDay(event.startDate, date))
                .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
            : [];
          const isToday = date ? isSameDay(date, today) : false;

          return (
            <div
              key={index}
              className={`min-h-24 bg-white p-1.5 dark:bg-zinc-900 ${
                date ? "" : "bg-zinc-50 dark:bg-zinc-950"
              }`}
            >
              {date && (
                <>
                  <div
                    className={`mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      isToday
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        onClick={() =>
                          setSelectedEvent({
                            id: event.id,
                            title: event.title,
                            start: event.start,
                            end: event.end,
                          })
                        }
                        title={`${event.title} (${timeFormatter.format(event.startDate)} - ${timeFormatter.format(event.endDate)})`}
                        className="w-full truncate rounded bg-zinc-100 px-1 py-0.5 text-left text-[11px] text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                      >
                        {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-zinc-400">
                        +{dayEvents.length - 3}개 더보기
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <EventDetailModal
          key={selectedEvent.id}
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
