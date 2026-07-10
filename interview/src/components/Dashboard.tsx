"use client";

import { useState } from "react";
import type { Todo } from "@/db/schema";
import { HomeView } from "./HomeView";
import { WeatherView } from "./WeatherView";
import { type SavedLocation } from "./WeatherCard";
import { TabNav, type TabKey } from "./TabNav";

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
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  return (
    <div
      className="min-h-screen px-6 py-16 font-sans text-[#eef2f0]"
      style={{
        background:
          "linear-gradient(165deg,#0e1c19 0%,#0a1513 55%,#070f0d 100%)",
      }}
    >
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-[34px] font-bold tracking-tight text-[#f6f8f7]">
              아침 대시보드
            </h1>
            <p className="mt-1.5 text-[15px] text-white/50">
              {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월{" "}
              {selectedDate.getDate()}일
            </p>
          </div>
          <TabNav active={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === "home" ? (
          <HomeView
            date={selectedDate}
            initialTodos={initialTodos}
            location={location}
            onLocationChange={setLocation}
          />
        ) : (
          <WeatherView date={selectedDate} location={location} />
        )}
      </main>
    </div>
  );
}
