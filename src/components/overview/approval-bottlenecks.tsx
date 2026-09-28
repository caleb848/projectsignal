import { getProject } from "@/data";
import { daysWaiting, isOverdueWaiting } from "@/lib/health";
import { orgOf, shortName } from "@/lib/format";
import type { WaitingItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Pending approvals grouped by the organisation that owns them. */
export function ApprovalBottlenecks({ items }: { items: WaitingItem[] }) {
  const approvals = items.filter((w) => w.kind === "approval");
  const groups = Object.values(
    approvals.reduce<Record<string, { org: string; items: WaitingItem[] }>>((acc, w) => {
      const org = orgOf(w.owner);
      (acc[org] ??= { org, items: [] }).items.push(w);
      return acc;
    }, {}),
  )
    .map((g) => ({
      ...g,
      overdue: g.items.filter(isOverdueWaiting).length,
      oldest: Math.max(...g.items.map(daysWaiting)),
    }))
    .sort((a, b) => b.oldest - a.oldest || b.items.length - a.items.length);

  const max = Math.max(...groups.map((g) => g.oldest), 1);

  return (
    <div>
      <div className="mb-2 grid grid-cols-[minmax(0,1fr)_7rem_2.5rem] gap-3 text-[11px] font-medium uppercase tracking-[0.06em] text-subtle">
        <span>Approver</span>
        <span>Oldest (days)</span>
        <span className="text-right">Items</span>
      </div>
      <ul className="space-y-2.5">
        {groups.map((g) => (
          <li
            key={g.org}
            className="grid grid-cols-[minmax(0,1fr)_7rem_2.5rem] items-center gap-3"
            title={g.items.map((w) => `${shortName(getProject(w.projectId)!.name)}: ${w.item} (${daysWaiting(w)}d)`).join("\n")}
          >
            <span className="min-w-0">
              <span className="block truncate text-[13px] text-fg">{g.org}</span>
              <span className="block truncate text-[11.5px] text-subtle">
                {g.overdue > 0 && <span className="font-medium text-critical-fg">{g.overdue} overdue · </span>}
                {[...new Set(g.items.map((w) => shortName(getProject(w.projectId)!.name)))].join(", ")}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 flex-1 rounded-full bg-surface-3">
                <span
                  className={cn("block h-full rounded-full", g.overdue ? "bg-critical" : "bg-fg/50")}
                  style={{ width: `${(g.oldest / max) * 100}%` }}
                />
              </span>
              <span className="tabular w-4 text-right text-[12px] font-medium text-fg">{g.oldest}</span>
            </span>
            <span className="tabular text-right text-[12.5px] text-muted">
              {g.items.length}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
