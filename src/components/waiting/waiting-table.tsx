"use client";

import { ArrowDownWideNarrow, Inbox } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Segmented, Select } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { EscalationBadge, ImpactBadge } from "@/components/ui/status";
import { formatDay } from "@/lib/dates";
import type { WaitingItem, WaitingOn } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface WaitingRow extends WaitingItem {
  projectName: string;
  days: number;
  /** Business days until deadline (negative when past). */
  dueIn: number;
  overdue: boolean;
}

type SortKey = "days" | "impact" | "deadline" | "project";
const IMPACT_RANK = { high: 0, medium: 1, low: 2 };

export function WaitingTable({ rows }: { rows: WaitingRow[] }) {
  const [sort, setSort] = useState<SortKey>("days");
  const [who, setWho] = useState<"all" | WaitingOn>("all");

  const sorted = useMemo(() => {
    const by: Record<SortKey, (a: WaitingRow, b: WaitingRow) => number> = {
      days: (a, b) => b.days - a.days || IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact],
      impact: (a, b) => IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact] || b.days - a.days,
      deadline: (a, b) => a.deadline.localeCompare(b.deadline),
      project: (a, b) => a.projectName.localeCompare(b.projectName) || b.days - a.days,
    };
    return rows.filter((r) => who === "all" || r.waitingOn === who).sort(by[sort]);
  }, [rows, sort, who]);

  const th = "px-3 py-2.5 text-left text-[11.5px] font-medium whitespace-nowrap text-subtle";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 px-5 pb-3">
        <Segmented
          label="Sort"
          value={sort}
          onChange={setSort}
          options={[
            { value: "days", label: <><ArrowDownWideNarrow aria-hidden />Longest waiting</> },
            { value: "impact", label: "Highest impact" },
            { value: "deadline", label: "Deadline" },
            { value: "project", label: "Project" },
          ]}
        />
        <Select
          label="Waiting for"
          value={who}
          onChange={(v) => setWho(v as typeof who)}
          className="ml-auto"
          options={[
            { value: "all", label: "Waiting for: anyone" },
            ...(["Client", "Legal", "Vendor", "Internal"] as WaitingOn[]).map((w) => ({ value: w, label: `Waiting for: ${w}` })),
          ]}
        />
      </div>

      {sorted.length === 0 ? (
        <div className="border-t border-border">
          <EmptyState icon={Inbox} title="Nothing waiting here" description="No items match this filter." />
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full min-w-[1040px] text-[13px]">
            <thead className="border-b border-border bg-surface-2/50">
              <tr>
                <th className={cn(th, "pl-5")}>Project</th>
                <th className={th}>Waiting for</th>
                <th className={th}>Item</th>
                <th className={th}>Owner</th>
                <th className={cn(th, "text-right")}>Days waiting</th>
                <th className={th}>Deadline</th>
                <th className={th}>Impact</th>
                <th className={cn(th, "pr-5")}>Escalation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((r) => (
                <tr key={r.id} className={cn("align-top", r.overdue && "bg-critical/[0.04]")}>
                  <td className="py-3 pr-3 pl-5 whitespace-nowrap">
                    <Link href={`/projects/${r.projectId}`} className="font-medium text-fg hover:underline">
                      {r.projectName}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-muted">{r.waitingOn}</td>
                  <td className="px-3 py-3 text-fg">
                    {r.item}
                    <span className="block text-[11.5px] text-subtle">
                      <span className="capitalize">{r.kind}</span>
                      {r.milestoneId && " · gates a milestone"}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-muted">{r.owner}</td>
                  <td className="tabular px-3 py-3 text-right">
                    <span className={cn("font-semibold", r.days > 3 ? "text-critical-fg" : "text-fg")}>{r.days}</span>
                    <span className="text-subtle"> bd</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="text-fg">{formatDay(r.deadline)}</span>
                    <span className={cn("block text-[11.5px]", r.dueIn < 0 ? "text-critical-fg" : r.dueIn <= 1 ? "text-serious-fg" : "text-subtle")}>
                      {r.dueIn < 0 ? `${-r.dueIn} bd overdue` : r.dueIn === 0 ? "Due today" : `in ${r.dueIn} bd`}
                    </span>
                  </td>
                  <td className="px-3 py-3"><ImpactBadge impact={r.impact} /></td>
                  <td className="py-3 pr-5 pl-3 whitespace-nowrap"><EscalationBadge level={r.escalation} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
