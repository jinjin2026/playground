"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HourlyPoint } from "@/lib/weather";

const SERIES = [
  { key: "temperature", label: "기온", color: "#7fe9c9" },
  { key: "apparentTemperature", label: "체감", color: "#f2c85b" },
  { key: "dewPoint", label: "이슬점", color: "#8ab4e8" },
] as const;

const PRECIPITATION_COLOR = "#4fa8e8";

function formatHour(time: string) {
  const hour = Number(time.slice(11, 13));
  return `${hour}시`;
}

function TooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; payload: HourlyPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0c1a17]/95 px-3 py-2 text-xs text-white/80 shadow-lg">
      <div className="text-white/45">{formatHour(point.time)}</div>
      {SERIES.map((series) => {
        const raw = point[series.key];
        return (
          <div key={series.key} className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: series.color }}
            />
            <span className="text-white/55">{series.label}</span>
            <span className="font-semibold text-white">
              {raw !== null ? `${Math.round(raw * 10) / 10}°` : "-"}
            </span>
          </div>
        );
      })}
      <div className="flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: PRECIPITATION_COLOR }}
        />
        <span className="text-white/55">강수량</span>
        <span className="font-semibold text-white">
          {point.precipitation !== null
            ? `${Math.round(point.precipitation * 10) / 10}mm`
            : "-"}
        </span>
      </div>
    </div>
  );
}

export function TempTrendChart({ hourly }: { hourly: HourlyPoint[] }) {
  const latest = hourly[hourly.length - 1];

  return (
    <div className="flex flex-col rounded-[20px] border border-white/[0.09] bg-white/[0.045] p-6 text-[#eef2f0] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-[13px] font-semibold uppercase tracking-[0.08em] text-white/50">
          기온 추이 · 시간당 강수량
        </h3>
        <div className="flex flex-wrap gap-3">
          {SERIES.map((series) => {
            const raw = latest?.[series.key];
            return (
              <div key={series.key} className="flex items-center gap-1.5 text-[12px]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: series.color }}
                />
                <span className="text-white/50">{series.label}</span>
                <span className="font-semibold" style={{ color: series.color }}>
                  {raw !== null && raw !== undefined
                    ? `${Math.round(raw * 10) / 10}°`
                    : "-"}
                </span>
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 text-[12px]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: PRECIPITATION_COLOR }}
            />
            <span className="text-white/50">강수량</span>
            <span className="font-semibold" style={{ color: PRECIPITATION_COLOR }}>
              {latest?.precipitation !== null && latest?.precipitation !== undefined
                ? `${Math.round(latest.precipitation * 10) / 10}mm`
                : "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={hourly} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="time"
              tickFormatter={formatHour}
              interval={3}
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="temp"
              domain={["auto", "auto"]}
              width={36}
              tickFormatter={(v: number) => `${Math.round(v)}°`}
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="precip"
              orientation="right"
              domain={[0, (max: number) => Math.max(max * 3, 1)]}
              width={42}
              tickFormatter={(v: number) => `${Math.round(v * 10) / 10}mm`}
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<TooltipContent />} cursor={{ stroke: "rgba(255,255,255,0.2)" }} />
            <Bar
              yAxisId="precip"
              dataKey="precipitation"
              name="강수량"
              fill={PRECIPITATION_COLOR}
              fillOpacity={0.35}
              radius={[2, 2, 0, 0]}
              barSize={10}
            />
            {SERIES.map((series) => (
              <Line
                key={series.key}
                yAxisId="temp"
                type="monotone"
                dataKey={series.key}
                name={series.label}
                stroke={series.color}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
