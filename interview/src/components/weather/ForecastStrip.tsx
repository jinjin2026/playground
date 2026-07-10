import { describeWeatherCode, type ForecastDay } from "@/lib/weather";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function ForecastStrip({ days }: { days: ForecastDay[] }) {
  return (
    <div className="flex flex-col rounded-[20px] border border-white/[0.09] bg-white/[0.045] p-6 text-[#eef2f0] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <h3 className="font-heading text-[13px] font-semibold uppercase tracking-[0.08em] text-white/50">
        5일 예보
      </h3>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {days.map((day) => {
          const info = describeWeatherCode(day.weatherCode);
          const weekday = WEEKDAYS[new Date(`${day.date}T00:00:00`).getDay()];
          return (
            <div
              key={day.date}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.03] px-2 py-3 text-center"
            >
              <span className="text-[12px] font-semibold text-white/55">
                {weekday}
              </span>
              <span className="text-[22px] leading-none">{info.emoji}</span>
              <span className="text-[13px] font-semibold text-[#f6f8f7]">
                {Math.round(day.temperatureMax)}°
              </span>
              <span className="text-[12px] text-white/40">
                {Math.round(day.temperatureMin)}°
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
