"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/lib/calendar-utils";
import { isSameDay } from "@/lib/calendar-utils";
import { TodayCard } from "@/components/TodayCard";
import { DayPopover } from "@/components/DayPopover";

export type { CalendarEvent };

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

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

type PopoverState = { date: Date; anchorRect: DOMRect };

export function CalendarView({
  events,
  initialMonth,
}: {
  events: CalendarEvent[];
  initialMonth: string;
}) {
  const [eventList, setEventList] = useState(events);
  const [current, setCurrent] = useState(() => new Date(initialMonth));
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const today = new Date(initialMonth);
  const [selectedDate, setSelectedDate] = useState(today);

  const cells = buildMonthGrid(current);
  const monthLabel = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(current);

  function goToPrevMonth() {
    setCurrent((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCurrent((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function goToToday() {
    setCurrent(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  function handleSaved(saved: CalendarEvent) {
    setEventList((prev) =>
      prev.some((event) => event.id === saved.id)
        ? prev.map((event) => (event.id === saved.id ? saved : event))
        : [...prev, saved],
    );
  }

  function handleDeleted(id: number) {
    setEventList((prev) => prev.filter((event) => event.id !== id));
  }

  const popoverEvents = popover
    ? eventList.filter((event) => isSameDay(new Date(event.start), popover.date))
    : [];

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <TodayCard events={eventList} selectedDate={selectedDate} />

      <div className="flex-1 rounded-2xl bg-zinc-900 p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={goToToday}
            className="rounded-md px-2 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            오늘
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={goToPrevMonth}
              aria-label="이전 달"
              className="text-zinc-400 hover:text-white"
            >
              ‹
            </button>
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              {monthLabel}
            </h2>
            <button
              onClick={goToNextMonth}
              aria-label="다음 달"
              className="text-zinc-400 hover:text-white"
            >
              ›
            </button>
          </div>
          <div className="w-10" />
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] font-medium text-zinc-500">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, index) => {
            const dayEvents = date
              ? eventList.filter((event) =>
                  isSameDay(new Date(event.start), date),
                )
              : [];
            const isToday = date ? isSameDay(date, today) : false;
            const isSelected = date ? isSameDay(date, selectedDate) : false;

            return (
              <div
                key={index}
                onClick={(e) => {
                  if (!date) return;
                  setSelectedDate(date);
                  setPopover({ date, anchorRect: e.currentTarget.getBoundingClientRect() });
                }}
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-full text-sm transition ${
                  date ? "cursor-pointer hover:bg-zinc-800" : ""
                } ${isToday ? "bg-orange-500 font-semibold text-white" : "text-zinc-300"} ${
                  isSelected && !isToday ? "ring-1 ring-inset ring-emerald-400" : ""
                }`}
              >
                {date && (
                  <>
                    <span>{date.getDate()}</span>
                    {dayEvents.length > 0 && (
                      <span
                        className={`h-1 w-1 rounded-full ${
                          isToday ? "bg-white" : "bg-emerald-400"
                        }`}
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {popover && (
        <DayPopover
          key={popover.date.toISOString()}
          date={popover.date}
          anchorRect={popover.anchorRect}
          events={popoverEvents}
          onClose={() => setPopover(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
