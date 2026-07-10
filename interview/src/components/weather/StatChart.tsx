"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

export type StatChartPoint = {
  time: string;
  value: number | null;
};

function formatHour(time: string) {
  const hour = Number(time.slice(11, 13));
  return `${hour}시`;
}

function TooltipContent({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: { value: number; payload: StatChartPoint }[];
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0c1a17]/95 px-3 py-2 text-xs text-white/80 shadow-lg">
      <div className="text-white/45">{formatHour(point.time)}</div>
      <div className="font-semibold text-white">
        {point.value !== null ? `${Math.round(point.value * 10) / 10}${unit}` : "-"}
      </div>
    </div>
  );
}

export function StatChart({
  title,
  value,
  unit,
  data,
  color,
  type = "area",
}: {
  title: string;
  value: string;
  unit: string;
  data: StatChartPoint[];
  color: string;
  type?: "area" | "bar";
}) {
  const gradientId = `stat-chart-gradient-${title.replace(/\s+/g, "-")}`;

  return (
    <div className="flex flex-col rounded-[20px] border border-white/[0.09] bg-white/[0.045] p-5 text-[#eef2f0] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <h3 className="font-heading text-[13px] font-semibold uppercase tracking-[0.08em] text-white/50">
        {title}
      </h3>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-heading text-[28px] font-bold" style={{ color }}>
          {value}
        </span>
        <span className="text-sm text-white/45">{unit}</span>
      </div>

      <div className="mt-3 h-[110px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="time"
                tickFormatter={formatHour}
                interval={5}
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickLine={false}
              />
              <Tooltip content={<TooltipContent unit={unit} />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
              <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="time"
                tickFormatter={formatHour}
                interval={5}
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickLine={false}
              />
              <Tooltip content={<TooltipContent unit={unit} />} cursor={{ stroke: "rgba(255,255,255,0.2)" }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                connectNulls
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
