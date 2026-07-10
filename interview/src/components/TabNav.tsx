"use client";

export type TabKey = "home" | "weather";

const TABS: { key: TabKey; label: string }[] = [
  { key: "home", label: "홈" },
  { key: "weather", label: "날씨" },
];

export function TabNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  return (
    <nav className="flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`rounded-full px-5 py-2 font-heading text-[13px] font-semibold uppercase tracking-[0.08em] transition ${
            active === tab.key
              ? "bg-gradient-to-r from-[#3fd8a6] to-[#2ea888] text-[#06231a]"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
