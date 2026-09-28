"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface CategoryDatum {
  category: string;
  Critical: number;
  High: number;
  Medium: number;
  Low: number;
}

const SERIES = [
  { key: "Critical", color: "var(--critical)" },
  { key: "High", color: "var(--serious)" },
  { key: "Medium", color: "var(--warn)" },
  { key: "Low", color: "var(--border-strong)" },
] as const;

/** Active risks by category, stacked by severity. */
export function CategoryChart({ data }: { data: CategoryDatum[] }) {
  return (
    <div>
      <div className="h-[232px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }} barCategoryGap={5}>
            <CartesianGrid horizontal={false} stroke="var(--grid)" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--fg-subtle)" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="category" width={78} tick={{ fontSize: 12, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "var(--surface-2)" }}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--fg)",
              }}
              labelStyle={{ color: "var(--fg)", fontWeight: 600 }}
            />
            {SERIES.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="a"
                fill={s.color}
                stroke="var(--surface)"
                strokeWidth={1}
                radius={i === SERIES.length - 1 ? [0, 3, 3, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-[11.5px] text-subtle">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-[2px]" style={{ background: s.color }} />
            {s.key}
          </span>
        ))}
      </div>
    </div>
  );
}
