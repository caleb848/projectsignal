import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/card";
import { Badge, SeverityBadge } from "@/components/ui/status";
import { formatDate } from "@/lib/dates";
import { riskScore, riskSeverity } from "@/lib/health";
import type { Level, Risk } from "@/lib/types";
import { cn } from "@/lib/utils";

const LEVEL: Record<Level, string> = { 1: "Low", 2: "Medium", 3: "High" };
const STATUS: Record<Risk["status"], string> = { open: "Open", monitoring: "Monitoring", resolved: "Resolved" };

export function RiskRegister({ risks }: { risks: Risk[] }) {
  if (!risks.length) {
    return <EmptyState icon={ShieldCheck} title="No risks logged" description="Nothing on the register for this project." />;
  }
  const sorted = [...risks].sort(
    (a, b) => Number(a.status === "resolved") - Number(b.status === "resolved") || riskScore(b) - riskScore(a),
  );
  const th = "px-3 py-2.5 text-left text-[11.5px] font-medium whitespace-nowrap text-subtle";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-[13px]">
        <thead className="border-y border-border bg-surface-2/50">
          <tr>
            <th className={cn(th, "pl-5")}>Risk</th>
            <th className={th}>Category</th>
            <th className={th}>Probability</th>
            <th className={th}>Impact</th>
            <th className={th}>Severity</th>
            <th className={th}>Owner</th>
            <th className={cn(th, "w-[32%]")}>Mitigation</th>
            <th className={cn(th, "pr-5")}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((r) => (
            <tr key={r.id} className={cn("align-top", r.status === "resolved" && "text-subtle")}>
              <td className="py-3 pr-3 pl-5">
                <p className={cn("font-medium", r.status === "resolved" ? "text-muted" : "text-fg")}>{r.title}</p>
                <p className="mt-0.5 text-[12px] text-subtle">
                  {r.status === "resolved" ? r.resolution : `If it happens: ${r.consequence}`}
                </p>
              </td>
              <td className="px-3 py-3 text-muted">{r.category}</td>
              <td className="px-3 py-3 text-muted">{LEVEL[r.probability]}</td>
              <td className="px-3 py-3 text-muted">{LEVEL[r.impact]}</td>
              <td className="px-3 py-3">{r.status === "resolved" ? <span className="text-subtle">–</span> : <SeverityBadge severity={riskSeverity(r)} />}</td>
              <td className="px-3 py-3 whitespace-nowrap text-muted">{r.owner}</td>
              <td className="px-3 py-3 text-muted">{r.mitigation}</td>
              <td className="py-3 pr-5 pl-3 whitespace-nowrap">
                {r.status === "resolved" ? (
                  <Badge tone="good">Resolved {formatDate(r.resolved!)}</Badge>
                ) : (
                  <Badge tone={r.status === "open" ? "neutral" : "accent"} icon={false}>{STATUS[r.status]}</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
