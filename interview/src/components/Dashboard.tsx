"use client";

import { useState } from "react";
import type { Todo } from "@/db/schema";
import { TodoList } from "./TodoList";
import { ScheduleLinkCard } from "./ScheduleLinkCard";
import { LocationSearch } from "./LocationSearch";
import { WeatherCard, type SavedLocation } from "./WeatherCard";
import { NewsHeadline } from "./NewsHeadline";

export function Dashboard({
  initialTodos,
  initialLocation,
  initialDate,
}: {
  initialTodos: Todo[];
  initialLocation: SavedLocation | null;
  initialDate: string;
}) {
  const [selectedDate] = useState(() => new Date(`${initialDate}T00:00:00`));
  const [location, setLocation] = useState<SavedLocation | null>(initialLocation);

  return (
    <div
      className="min-h-screen px-6 py-16 font-sans text-[#eef2f0]"
      style={{
        background:
          "linear-gradient(165deg,#0e1c19 0%,#0a1513 55%,#070f0d 100%)",
      }}
    >
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="font-heading text-[34px] font-bold tracking-tight text-[#f6f8f7]">
              아침 대시보드
            </h1>
            <p className="mt-1.5 text-[15px] text-white/50">
              {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월{" "}
              {selectedDate.getDate()}일
            </p>
          </div>
          <div className="whitespace-nowrap rounded-full border border-white/10 px-4 py-2 font-heading text-[13px] font-semibold uppercase tracking-[0.1em] text-white/35">
            Daily Brief
          </div>
        </div>

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <TodoList date={selectedDate} initialTodos={initialTodos} />
            <ScheduleLinkCard date={selectedDate} />
          </div>
          <div className="flex flex-col gap-6">
            <LocationSearch location={location} onLocationChange={setLocation} />
            <WeatherCard date={selectedDate} location={location} />
            <NewsHeadline date={selectedDate} />
          </div>
        </div>
      </main>
    </div>
  );
}
