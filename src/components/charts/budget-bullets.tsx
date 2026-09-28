import Link from "next/link";
import { money, signedPct } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface BudgetRow {
  id: string;
  name: string;
  budget: number;
  spent: number;
  forecast: number;
}

/**
 * Bullet chart per project. Track = approved budget, fill = spent to date,
 * tick = forecast at completion. Overruns extend past the budget line.
 */
export function BudgetBullets({ rows }: { rows: BudgetRow[] }) {
  const maxRatio = Math.max(1.05, ...rows.map((r) => r.forecast / r.budget));
  const scale = (v: number, budget: number) => `${((v / budget) / maxRatio) * 100}%`;

  return (
    <div>
      <ul className="space-y-3">
        {rows.map((r) => {
          const variance = ((r.forecast - r.budget) / r.budget) * 100;
          const over = variance > 0.5;
          return (
            <li key={r.id}>
              <Link
                href={`/projects/${r.id}`}
                className="group grid grid-cols-1 gap-1.5 sm:grid-cols-[minmax(0,10rem)_1fr_9rem] sm:items-center sm:gap-4"
                title={`${r.name}: ${money(r.spent)} spent of ${money(r.budget)}; forecast ${money(r.forecast)} (${signedPct(variance)})`}
              >
                <span className="truncate text-[12.5px] text-muted group-hover:text-fg">{r.name}</span>
                <span className="relative h-3">
                  <span className="absolute inset-y-0 left-0 rounded-[3px] bg-surface-3" style={{ width: scale(r.budget, r.budget) }} />
                  <span
                    className="absolute inset-y-[3px] left-0 rounded-[2px] bg-fg/70"
                    style={{ width: scale(r.spent, r.budget) }}
                  />
                  {over && (
                    <span
                      className="absolute inset-y-0 rounded-r-[3px] bg-serious/35"
                      style={{ left: scale(r.budget, r.budget), width: `calc(${scale(r.forecast, r.budget)} - ${scale(r.budget, r.budget)})` }}
                    />
                  )}
                  <span
                    className={cn("absolute -top-[3px] -bottom-[3px] w-[2px] rounded-full", over ? "bg-serious" : "bg-fg")}
                    style={{ left: `calc(${scale(r.forecast, r.budget)} - 1px)` }}
                  />
                </span>
                <span className="tabular flex items-baseline justify-between gap-2 text-[12px] sm:justify-end">
                  <span className="text-muted">
                    {money(r.spent)} / {money(r.budget)}
                  </span>
                  <span className={cn("w-12 text-right font-medium", over ? "text-serious-fg" : "text-subtle")}>{signedPct(variance)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-subtle">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-[2px] bg-fg/70" />Spent to date</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-[2px] bg-surface-3 ring-1 ring-border" />Approved budget</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-[2px] rounded-full bg-fg" />Forecast at completion</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-[2px] bg-serious/35" />Forecast overrun</span>
      </div>
    </div>
  );
}
