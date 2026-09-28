import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { WaitingTable, type WaitingRow } from "@/components/waiting/waiting-table";
import { getProject, getWaitingItems } from "@/data";
import { SNAPSHOT_DATE, WAITING_THRESHOLD_DAYS } from "@/lib/config";
import { businessDaysBetween, plural } from "@/lib/dates";
import { daysWaiting, isOverdueWaiting } from "@/lib/health";
import { activeProjects } from "@/lib/portfolio";
import type { WaitingOn } from "@/lib/types";

export const metadata: Metadata = { title: "Waiting Room" };

const GROUPS: { key: WaitingOn; label: string }[] = [
  { key: "Client", label: "Client" },
  { key: "Legal", label: "Legal" },
  { key: "Vendor", label: "Vendor" },
  { key: "Internal", label: "Internal teams" },
];

export default function WaitingRoomPage() {
  const activeIds = new Set(activeProjects().map((p) => p.id));
  const rows: WaitingRow[] = getWaitingItems()
    .filter((w) => activeIds.has(w.projectId))
    .map((w) => ({
      ...w,
      projectName: getProject(w.projectId)!.name,
      days: daysWaiting(w),
      dueIn: businessDaysBetween(SNAPSHOT_DATE, w.deadline),
      overdue: isOverdueWaiting(w),
    }));

  const long = rows.filter((r) => r.days > WAITING_THRESHOLD_DAYS);
  const high = rows.filter((r) => r.impact === "high");
  const dueSoon = rows.filter((r) => r.dueIn >= 0 && r.dueIn <= 2);

  return (
    <>
      <PageHeader
        eyebrow="Dependencies on others"
        title="Waiting Room"
        description="Everything the delivery team cannot move forward without: approvals, deliveries, inputs and access owned by someone else."
      />

      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-border bg-surface px-5 py-4 shadow-card">
          <p className="text-[22px] font-semibold tracking-[-0.02em] text-fg">
            {rows.length} items currently waiting on external action
          </p>
          <p className="mt-2 flex items-start gap-2 text-[13.5px] text-fg">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-critical-fg" aria-hidden />
            <span>
              {plural(long.length, "item has", "items have")} been waiting longer than {WAITING_THRESHOLD_DAYS} business days.{" "}
              <span className="text-muted">
                {high.length} are high impact and {dueSoon.length} {dueSoon.length === 1 ? "is" : "are"} due within two business days.
              </span>
            </span>
          </p>
        </div>
        <div className="grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-border bg-border shadow-card">
          {GROUPS.map((g) => {
            const items = rows.filter((r) => r.waitingOn === g.key);
            return (
              <div key={g.key} className="bg-surface px-3 py-3.5">
                <p className="truncate text-[12px] text-muted">{g.label}</p>
                <p className="tabular mt-1 text-[22px] leading-none font-semibold text-fg">{items.length}</p>
                <p className="mt-1.5 text-[11.5px] text-subtle">
                  {items.length ? `oldest ${Math.max(...items.map((i) => i.days))}d` : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="All waiting items"
          description={`Days waiting are business days since the request. Rows over ${WAITING_THRESHOLD_DAYS} days or past deadline are highlighted.`}
        />
        <WaitingTable rows={rows} />
      </Card>
    </>
  );
}
