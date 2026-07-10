"use client";

import { useState } from "react";
import type { SavedLocation } from "./WeatherCard";

type Candidate = {
  name: string;
  latitude: number;
  longitude: number;
  country: string | null;
  admin1: string | null;
};

export function LocationSearch({
  location,
  onLocationChange,
}: {
  location: SavedLocation | null;
  onLocationChange: (location: SavedLocation) => void;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/location/search?q=${encodeURIComponent(query.trim())}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "검색 실패");
      setCandidates(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "검색 실패");
    } finally {
      setSearching(false);
    }
  }

  async function handleSelect(candidate: Candidate) {
    try {
      const res = await fetch("/api/location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: candidate.name,
          latitude: candidate.latitude,
          longitude: candidate.longitude,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      onLocationChange(data);
      setCandidates([]);
      setQuery("");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    }
  }

  return (
    <div className="flex flex-col rounded-[20px] border border-white/[0.09] bg-white/[0.045] p-6 text-[#eef2f0] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-[17px] font-semibold text-[#f6f8f7]">
          위치
        </h2>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-xs font-semibold text-emerald-300 hover:underline"
        >
          {location ? "위치 변경" : "위치 설정"}
        </button>
      </div>

      <p className="mt-2 text-sm text-white/60">
        {location ? location.name : "저장된 위치가 없어요."}
      </p>

      {open && (
        <div className="mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              name="location-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="도시 이름 검색"
              className="flex-1 rounded-full bg-white/[0.06] px-4 py-2.5 text-sm text-[#eef2f0] outline-none placeholder:text-white/35 focus:ring-1 focus:ring-emerald-400/60"
            />
            <button
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              className="whitespace-nowrap rounded-full bg-gradient-to-r from-[#3fd8a6] to-[#2ea888] px-4.5 py-2.5 text-[13px] font-semibold text-[#06231a] transition hover:brightness-110 disabled:opacity-50"
            >
              검색
            </button>
          </div>

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

          {candidates.length > 0 && (
            <ul className="mt-3 flex flex-col divide-y divide-white/[0.07] border-t border-white/[0.07]">
              {candidates.map((c) => (
                <li key={`${c.name}-${c.latitude}-${c.longitude}`}>
                  <button
                    onClick={() => handleSelect(c)}
                    className="w-full py-2 text-left text-sm transition hover:text-emerald-300"
                  >
                    {c.name}
                    {c.admin1 && `, ${c.admin1}`}
                    {c.country && ` (${c.country})`}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
