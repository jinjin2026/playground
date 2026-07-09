"use client";

import { useEffect, useState } from "react";
import type { CalendarEvent } from "@/lib/calendar-utils";
import { isSameDay } from "@/lib/calendar-utils";

const weekdayFormatter = new Intl.DateTimeFormat("ko-KR", { weekday: "long" });

function getCountdownParts(diffMs: number) {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function TodayCard({
  events,
  selectedDate,
}: {
  events: CalendarEvent[];
  selectedDate: Date;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dayEvents = events
    .map((event) => ({ ...event, startDate: new Date(event.start) }))
    .filter((event) => isSameDay(event.startDate, selectedDate))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const upcoming = dayEvents.find(
    (event) => event.startDate.getTime() > now.getTime(),
  );
  const highlighted = upcoming ?? dayEvents[0];

  const countdown = upcoming
    ? getCountdownParts(upcoming.startDate.getTime() - now.getTime())
    : null;

  return (
    <div className="flex w-full flex-col rounded-2xl bg-zinc-900 p-6 text-white shadow-lg sm:w-56">
      <div>
        <p className="text-6xl font-light leading-none">
          {selectedDate.getDate()}
        </p>
        <p className="mt-1 text-sm font-medium tracking-wide text-zinc-400">
          {weekdayFormatter.format(selectedDate)}
        </p>
      </div>

      <div className="mt-6">
        <p className="text-2xl font-semibold">
          {selectedDate.getMonth() + 1}월
        </p>
        <p className="text-sm text-zinc-500">{selectedDate.getFullYear()}</p>
      </div>

      <div className="mt-6 border-t border-zinc-700 pt-4">
        {highlighted ? (
          <>
            <p className="truncate text-sm font-medium text-orange-400">
              🎉 {highlighted.title}
            </p>
            {countdown ? (
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[
                  { value: countdown.days, label: "일" },
                  { value: countdown.hours, label: "시간" },
                  { value: countdown.minutes, label: "분" },
                  { value: countdown.seconds, label: "초" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-lg font-semibold tabular-nums">
                      {String(item.value).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] text-zinc-500">{item.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">종료된 일정</p>
            )}
          </>
        ) : (
          <p className="text-sm text-zinc-500">예정된 일정이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
