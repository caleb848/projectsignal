import Link from "next/link";
import { HealthScore } from "@/components/ui/status";
import { formatDate, plural, toDate } from "@/lib/dates";
import type { upcomingLaunches } from "@/lib/portfolio";

type Launch = ReturnType<typeof upcomingLaunches>[number];

export function UpcomingLaunches({ launches }: { launches: Launch[] }) {
  return (
    <ul className="divide-y divide-border">
      {launches.map((l) => {
        const d = toDate(l.planned);
        return (
          <li key={l.project.id}>
            <Link href={`/projects/${l.project.id}`} className="flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-surface-2/60">
              <span className="flex w-10 shrink-0 flex-col items-center rounded-md border border-border py-1">
                <span className="text-[10px] font-medium uppercase tracking-wide text-subtle">
                  {d.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}
                </span>
                <span className="tabular text-[15px] leading-tight font-semibold text-fg">{d.getUTCDate()}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-fg">{l.project.name}</span>
                <span className="block text-[12px] text-subtle">
                  {l.slip > 0 ? (
                    <span className="text-critical-fg">Projected {formatDate(l.projected)} · {plural(l.slip, "day")} late</span>
                  ) : (
                    <>in {plural(l.daysAway, "day")}</>
                  )}
                </span>
              </span>
              <HealthScore score={l.health.score} band={l.health.band} size="sm" showBand={false} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
