import { getProject } from "@/data";
import { riskScore } from "@/lib/health";
import { shortName } from "@/lib/format";
import type { Level, Risk } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABEL: Record<Level, string> = { 1: "Low", 2: "Medium", 3: "High" };

function cellTone(score: number) {
  if (score >= 9) return "bg-critical-soft";
  if (score >= 6) return "bg-serious-soft";
  if (score >= 3) return "bg-warn-soft";
  return "bg-surface-2";
}

/** 3×3 probability × impact matrix of active risks. */
export function RiskMatrix({ risks }: { risks: Risk[] }) {
  const levels: Level[] = [3, 2, 1];
  return (
    <div className="flex gap-2">
      <div className="flex w-4 items-center justify-center">
        <span className="-rotate-90 text-[11px] whitespace-nowrap text-subtle">Probability →</span>
      </div>
      <div className="flex-1">
        <div className="grid grid-cols-[3.25rem_repeat(3,1fr)] gap-1">
          {levels.map((p) => (
            <div key={p} className="contents">
              <span className="flex items-center text-[11px] text-subtle">{LABEL[p]}</span>
              {([1, 2, 3] as Level[]).map((i) => {
                const cell = risks.filter((r) => r.probability === p && r.impact === i);
                return (
                  <div
                    key={i}
                    className={cn("flex min-h-[64px] flex-col justify-between rounded-md p-2", cellTone(p * i))}
                    title={cell.map((r) => `${shortName(getProject(r.projectId)!.name)}: ${r.title}`).join("\n") || "No risks"}
                  >
                    <span className={cn("tabular text-[18px] leading-none font-semibold", cell.length ? "text-fg" : "text-subtle/60")}>
                      {cell.length}
                    </span>
                    <span className="line-clamp-2 text-[10.5px] leading-tight text-muted">
                      {[...new Set(cell.map((r) => shortName(getProject(r.projectId)!.name)))].join(", ")}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
          <span />
          {([1, 2, 3] as Level[]).map((i) => (
            <span key={i} className="pt-1 text-center text-[11px] text-subtle">{LABEL[i]}</span>
          ))}
        </div>
        <p className="mt-1 text-center text-[11px] text-subtle">Impact →</p>
      </div>
    </div>
  );
}

export const sortByScore = (a: Risk, b: Risk) => riskScore(b) - riskScore(a);
