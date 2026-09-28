import { ArrowUpRight, Lightbulb, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CategoryChart, type CategoryDatum } from "@/components/risks/category-chart";
import { RiskMatrix, sortByScore } from "@/components/risks/risk-matrix";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/card";
import { HealthScore, SEVERITY_TONE, SeverityBadge, toneDot } from "@/components/ui/status";
import { getProject, getRisks } from "@/data";
import { formatDate } from "@/lib/dates";
import { isActiveRisk, riskSeverity, type RiskSeverity } from "@/lib/health";
import { activeProjects, deterioratingProjects, portfolioInsights } from "@/lib/portfolio";
import type { RiskCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Risk Radar" };

const SEVERITIES: RiskSeverity[] = ["Critical", "High", "Medium", "Low"];
const CATEGORIES: RiskCategory[] = ["Timeline", "Budget", "Approval", "Resource", "Vendor", "Scope", "Production", "Technical"];

export default function RiskRadarPage() {
  const activeIds = new Set(activeProjects().map((p) => p.id));
  const all = getRisks().filter((r) => activeIds.has(r.projectId) || r.status === "resolved");
  const active = all.filter(isActiveRisk).sort(sortByScore);
  const resolved = all.filter((r) => r.status === "resolved").sort((a, b) => b.resolved!.localeCompare(a.resolved!));
  const insights = portfolioInsights();
  const deteriorating = deterioratingProjects();

  const byCategory: CategoryDatum[] = CATEGORIES.map((category) => {
    const row: CategoryDatum = { category, Critical: 0, High: 0, Medium: 0, Low: 0 };
    active.filter((r) => r.category === category).forEach((r) => row[riskSeverity(r)]++);
    return row;
  });

  const counts = Object.fromEntries(SEVERITIES.map((s) => [s, active.filter((r) => riskSeverity(r) === s).length])) as Record<RiskSeverity, number>;

  return (
    <>
      <PageHeader
        eyebrow="Portfolio risk"
        title="Risk Radar"
        description={`${active.length} active risks across ${activeIds.size} projects: ${counts.Critical} critical, ${counts.High} high, ${counts.Medium} medium and ${counts.Low} low. Severity = probability × impact.`}
      />

      <Card>
        <CardHeader
          title="What needs attention, and why"
          description="Generated from the schedule, budget, risk and capacity data using fixed rules. Every date comes from the dependency engine."
        />
        <ol className="grid gap-px border-t border-border bg-border md:grid-cols-2">
          {insights.map((ins, i) => (
            <li
              key={i}
              className={cn("bg-surface px-5 py-4", (i === 0 || (i === insights.length - 1 && insights.length % 2 === 0)) && "md:col-span-2")}
            >
              <p className="flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.08em] text-subtle">
                <Lightbulb className="size-3.5" aria-hidden />
                {ins.title}
              </p>
              <p className={cn("mt-1.5 leading-relaxed text-fg", i === 0 ? "text-[15px]" : "text-[13.5px]")}>{ins.body}</p>
              {ins.projectId && (
                <Link href={`/projects/${ins.projectId}`} className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-muted hover:text-fg">
                  Open project <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              )}
            </li>
          ))}
        </ol>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Risk matrix" description="Active risks by probability and impact" />
          <div className="px-5 pb-5">
            <RiskMatrix risks={active} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Risks by category" description="Where risk is concentrated" />
          <div className="px-5 pb-5">
            <CategoryChart data={byCategory} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Deteriorating health" description="Down 10+ points over three weeks" />
          <ul className="divide-y divide-border border-t border-border">
            {deteriorating.length === 0 && <li className="px-5 py-6 text-[13px] text-subtle">No projects are deteriorating.</li>}
            {deteriorating.map((d) => (
              <li key={d.project.id}>
                <Link href={`/projects/${d.project.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/60">
                  <HealthScore score={d.health.score} band={d.health.band} showBand={false} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-fg">{d.project.name}</span>
                    <span className="tabular block text-[12px] text-subtle">{d.health.trend.join(" → ")}</span>
                  </span>
                  <span className="tabular text-[13px] font-semibold text-critical-fg">▼{Math.abs(d.change)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {SEVERITIES.map((s) => {
            const list = active.filter((r) => riskSeverity(r) === s);
            return (
              <Card key={s}>
                <CardHeader
                  title={
                    <span className="inline-flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", toneDot(SEVERITY_TONE[s]))} aria-hidden />
                      {s}
                      <span className="font-normal text-subtle">{list.length}</span>
                    </span>
                  }
                  description={
                    { Critical: "High probability, high impact. Escalate now.", High: "Likely or severe. Mitigation in flight.", Medium: "Monitor weekly.", Low: "Logged for visibility." }[s]
                  }
                />
                {list.length === 0 ? (
                  <p className="border-t border-border px-5 py-4 text-[13px] text-subtle">No {s.toLowerCase()} risks.</p>
                ) : (
                  <ul className="divide-y divide-border border-t border-border">
                    {list.map((r) => {
                      const p = getProject(r.projectId)!;
                      return (
                        <li key={r.id} className="grid gap-x-6 gap-y-1.5 px-5 py-3.5 md:grid-cols-[1fr_1fr]">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[13.5px] font-medium text-fg">{r.title}</p>
                              <SeverityBadge severity={s} />
                            </div>
                            <p className="mt-0.5 text-[12px] text-subtle">
                              <Link href={`/projects/${p.id}`} className="hover:text-fg">{p.name}</Link> · {r.category} · {r.owner}
                              {r.status === "monitoring" && " · Monitoring"}
                            </p>
                            <p className="mt-1.5 text-[12.5px] text-muted">If it happens: {r.consequence}</p>
                          </div>
                          <div className="text-[12.5px]">
                            <p className="text-subtle">Mitigation</p>
                            <p className="text-fg">{r.mitigation}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>

        <Card className="self-start">
          <CardHeader title="Recently resolved" description="What the team closed out, and how" />
          {resolved.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No resolved risks yet" />
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {resolved.map((r) => (
                <li key={r.id} className="px-5 py-3.5">
                  <p className="flex items-start gap-2 text-[13px] font-medium text-fg">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-good-fg" aria-hidden />
                    {r.title}
                  </p>
                  <p className="mt-1 pl-5.5 text-[12.5px] text-muted">{r.resolution}</p>
                  <p className="mt-1 pl-5.5 text-[12px] text-subtle">
                    {getProject(r.projectId)!.name} · resolved {formatDate(r.resolved!)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
