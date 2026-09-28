import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { KpiTile } from "@/components/overview/kpi-tile";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/status";
import { getProject } from "@/data";
import { capacityConflicts, capacityWeekLabel, roleLoads } from "@/lib/capacity";
import { CAPACITY_WEEKS } from "@/lib/config";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Capacity" };

function loadClass(pct: number) {
  if (pct > 100) return "bg-critical-soft text-critical-fg font-semibold";
  if (pct >= 90) return "bg-warn-soft text-warn-fg font-semibold";
  if (pct >= 70) return "bg-surface-3 text-fg";
  return "bg-surface-2 text-muted";
}

export default function CapacityPage() {
  const loads = roleLoads();
  const conflicts = capacityConflicts();
  const totalCap = loads.reduce((s, l) => s + l.capacity, 0);
  const week = (w: number) => loads.reduce((s, l) => s + l.weeks[w].hours, 0);
  const overRoles = new Set(conflicts.map((c) => c.role.id));

  return (
    <>
      <PageHeader
        eyebrow="Resources"
        title="Capacity"
        description="Planned hours by discipline for the next four weeks, against productive capacity (headcount × 30 hours). Over 100% means work will slip or needs extra resource."
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label="Allocated this week" value={`${Math.round((week(0) / totalCap) * 100)}%`} sub={`${week(0)} of ${totalCap} hours`} />
        <KpiTile label="Available this week" value={`${totalCap - week(0)}h`} sub="Unbooked productive hours" />
        <KpiTile label="Over-allocated teams" value={overRoles.size} tone={overRoles.size ? "critical" : "good"} sub="Any week in the next four" />
        <KpiTile
          label="Demand next week"
          value={`${Math.round((week(1) / totalCap) * 100)}%`}
          sub={`${week(1) >= week(0) ? "+" : ""}${week(1) - week(0)} hours vs this week`}
        />
      </section>

      {conflicts.length > 0 && (
        <div className="mt-6 space-y-2">
          {conflicts.map((c) => (
            <div key={`${c.role.id}-${c.week}`} className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-card">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-critical-fg" aria-hidden />
              <p className="text-[13.5px] text-fg">{c.insight}</p>
            </div>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader
          title="Allocation by team"
          description="Percentage of productive capacity booked each week. Hover a cell for the project breakdown."
        />
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full min-w-[820px] text-[13px]">
            <thead className="border-b border-border bg-surface-2/50">
              <tr className="text-[11.5px] text-subtle">
                <th className="py-2.5 pr-3 pl-5 text-left font-medium">Team</th>
                <th className="px-3 text-left font-medium">This week: allocated vs available</th>
                {CAPACITY_WEEKS.map((w, i) => (
                  <th key={w} className="px-2 text-center font-medium">
                    {i === 0 ? "This week" : i === 1 ? "Next week" : `Wk of ${formatDate(w)}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loads.map((l) => {
                const now = l.weeks[0];
                return (
                  <tr key={l.role.id}>
                    <td className="py-3 pr-3 pl-5">
                      <p className="font-medium text-fg">{l.role.name}</p>
                      <p className="text-[12px] text-subtle">{l.role.headcount} people · {l.capacity}h/wk</p>
                    </td>
                    <td className="px-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-2 w-40 rounded-full bg-surface-3">
                          <div
                            className={cn("h-full rounded-full", now.pct > 100 ? "bg-critical" : now.pct >= 90 ? "bg-warn" : "bg-fg/60")}
                            style={{ width: `${Math.min(100, now.pct)}%` }}
                          />
                        </div>
                        <span className="tabular text-[12px] text-muted">
                          {now.hours}h · {Math.max(0, l.capacity - now.hours)}h free
                        </span>
                      </div>
                    </td>
                    {l.weeks.map((w, i) => (
                      <td key={i} className="px-1.5 py-2">
                        <div
                          className={cn("tabular rounded-md px-2 py-2 text-center text-[13px]", loadClass(w.pct))}
                          title={`${l.role.name}, ${capacityWeekLabel(i)}: ${w.hours}h of ${w.capacity}h\n${w.contributors
                            .map((c) => `${getProject(c.projectId)!.name}: ${c.hours}h`)
                            .join("\n")}`}
                        >
                          {w.pct}%
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border px-5 py-3 text-[11.5px] text-subtle">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-[3px] bg-surface-2 ring-1 ring-border" />Under 70%</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-[3px] bg-surface-3" />70–89%</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-[3px] bg-warn-soft" />90–100% (little slack)</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-[3px] bg-critical-soft" />Over 100%</span>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {conflicts.map((c) => {
          const w = loads.find((l) => l.role.id === c.role.id)!.weeks[c.week];
          return (
            <Card key={`${c.role.id}-${c.week}`}>
              <CardHeader
                title={`${c.role.name}: ${capacityWeekLabel(c.week)}`}
                description={`${w.hours}h booked against ${w.capacity}h · ${w.hours - w.capacity}h over`}
                action={<Badge tone="critical">{c.pct}%</Badge>}
              />
              <div className="px-5 pb-5">
                <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
                  {w.contributors.map((ct, i) => (
                    <div
                      key={ct.projectId}
                      className={cn("h-full", ["bg-fg/80", "bg-fg/55", "bg-fg/35", "bg-fg/20"][Math.min(i, 3)])}
                      style={{ width: `${(ct.hours / w.hours) * 100}%` }}
                      title={`${getProject(ct.projectId)!.name}: ${ct.hours}h`}
                    />
                  ))}
                </div>
                <div className="relative mt-1 h-3">
                  <span
                    className="absolute top-[-16px] h-5 w-[2px] bg-critical"
                    style={{ left: `${(w.capacity / w.hours) * 100}%` }}
                    aria-hidden
                  />
                  <span className="absolute text-[10.5px] text-critical-fg" style={{ left: `calc(${(w.capacity / w.hours) * 100}% - 3.5rem)` }}>
                    capacity
                  </span>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {w.contributors.map((ct, i) => (
                    <li key={ct.projectId} className="flex items-center gap-2.5 text-[13px]">
                      <span className={cn("size-2 rounded-[2px]", ["bg-fg/80", "bg-fg/55", "bg-fg/35", "bg-fg/20"][Math.min(i, 3)])} aria-hidden />
                      <Link href={`/projects/${ct.projectId}`} className="flex-1 text-fg hover:underline">
                        {getProject(ct.projectId)!.name}
                      </Link>
                      <span className="tabular text-muted">{ct.hours}h</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
