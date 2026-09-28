import Link from "next/link";
import { BAND_TONE, toneDot, toneText } from "@/components/ui/status";
import type { HealthBand } from "@/lib/health";
import { cn } from "@/lib/utils";

const BANDS: HealthBand[] = ["Healthy", "Watch", "At Risk", "Critical"];

/** Stacked distribution of projects by health band, with a legend. */
export function HealthDistribution({ counts }: { counts: Record<HealthBand, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div>
      <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={BANDS.map((b) => `${b}: ${counts[b]}`).join(", ")}>
        {BANDS.filter((b) => counts[b] > 0).map((b) => (
          <div
            key={b}
            className={cn("h-full first:rounded-l-full last:rounded-r-full", toneDot(BAND_TONE[b]))}
            style={{ width: `${(counts[b] / total) * 100}%` }}
            title={`${b}: ${counts[b]} projects`}
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
        {BANDS.map((b) => (
          <li key={b} className="flex items-center gap-1.5 text-[12px]">
            <span className={cn("size-2 rounded-[2px]", toneDot(BAND_TONE[b]))} aria-hidden />
            <span className="text-muted">{b}</span>
            <span className="tabular ml-auto font-semibold text-fg sm:ml-0">{counts[b]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One horizontal bar per project, with band thresholds marked on the scale. */
export function HealthBars({
  rows,
}: {
  rows: { id: string; name: string; score: number; band: HealthBand; change: number }[];
}) {
  return (
    <div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/projects/${r.id}`} className="group grid grid-cols-[minmax(0,8.5rem)_1fr_4.5rem] items-center gap-3" title={`${r.name}: ${r.score} (${r.band}), ${r.change >= 0 ? "+" : ""}${r.change} over 3 weeks`}>
              <span className="truncate text-[12.5px] text-muted group-hover:text-fg">{r.name.replace(/ (Campaign|Launch|Program|Production|Relaunch|Refresh|Series)$/, "")}</span>
              <span className="relative h-2 rounded-full bg-surface-3">
                {[50, 75, 90].map((t) => (
                  <span key={t} className="absolute top-[-3px] bottom-[-3px] w-px bg-border-strong" style={{ left: `${t}%` }} aria-hidden />
                ))}
                <span
                  className={cn("absolute inset-y-0 left-0 rounded-full", toneDot(BAND_TONE[r.band]))}
                  style={{ width: `${r.score}%` }}
                />
              </span>
              <span className="tabular flex items-baseline justify-end gap-1.5 text-[12.5px]">
                <span className="font-semibold text-fg">{r.score}</span>
                <span className={cn("text-[11px]", r.change < 0 ? toneText("critical") : r.change > 0 ? toneText("good") : "text-subtle")}>
                  {r.change > 0 ? "▲" : r.change < 0 ? "▼" : "–"}
                  {r.change !== 0 && Math.abs(r.change)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-2 grid grid-cols-[minmax(0,8.5rem)_1fr_4.5rem] gap-3 text-[10.5px] text-subtle">
        <span />
        <span className="relative h-3">
          {[0, 50, 75, 90].map((t) => (
            <span key={t} className="tabular absolute -translate-x-1/2 first:translate-x-0" style={{ left: `${t}%` }}>
              {t}
            </span>
          ))}
        </span>
        <span className="text-right">3-wk Δ</span>
      </div>
    </div>
  );
}
