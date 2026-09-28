import { FileText } from "lucide-react";
import Link from "next/link";
import { ActivityFeed } from "@/components/activity-feed";
import { BudgetBullets } from "@/components/charts/budget-bullets";
import { HealthBars, HealthDistribution } from "@/components/charts/health-bars";
import { ApprovalBottlenecks } from "@/components/overview/approval-bottlenecks";
import { AttentionList } from "@/components/overview/attention-list";
import { KpiTile } from "@/components/overview/kpi-tile";
import { UpcomingLaunches } from "@/components/overview/upcoming-launches";
import { buttonClass } from "@/components/ui/button";
import { Card, CardHeader, CardLink, PageHeader } from "@/components/ui/card";
import { getActivity, getWaitingItems } from "@/data";
import { SNAPSHOT_DATE } from "@/lib/config";
import { formatFull } from "@/lib/dates";
import { money, signedPct } from "@/lib/format";
import { projectHealth } from "@/lib/health";
import {
  activeProjects,
  needsAttention,
  portfolioHealthDistribution,
  portfolioKpis,
  upcomingLaunches,
} from "@/lib/portfolio";

export default function OverviewPage() {
  const k = portfolioKpis();
  const attention = needsAttention();
  const active = activeProjects();
  const healthRows = active
    .map((p) => {
      const h = projectHealth(p);
      return { id: p.id, name: p.name, score: h.score, band: h.band, change: h.score - h.trend[0] };
    })
    .sort((a, b) => a.score - b.score);
  const budgetRows = [...active].sort((a, b) => (b.forecast - b.budget) / b.budget - (a.forecast - a.budget) / a.budget);
  const activeIds = new Set(active.map((p) => p.id));

  return (
    <>
      <PageHeader
        eyebrow="Command centre"
        title="Project Portfolio"
        description={
          <>
            Which projects need attention right now, and why. Snapshot as of {formatFull(SNAPSHOT_DATE)}.
          </>
        }
        actions={
          <Link href="/brief" className={buttonClass("secondary")}>
            <FileText aria-hidden />
            Executive brief
          </Link>
        }
      />

      <section aria-label="Portfolio KPIs" className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <KpiTile label="Active projects" value={k.active} sub={`+${k.completed} completed`} href="/projects" />
        <KpiTile label="On track" value={k.onTrack} tone="good" sub={`${Math.round((k.onTrack / k.active) * 100)}% of portfolio`} href="/projects?status=on-track" />
        <KpiTile label="At risk" value={k.atRisk} tone="serious" sub="Act this week" href="/projects?status=at-risk" />
        <KpiTile label="Blocked" value={k.blocked} tone="critical" sub="Waiting on client" href="/projects?status=blocked" />
        <KpiTile label="Active budget" value={money(k.budget)} sub={`Forecast ${signedPct(k.variancePct)}`} />
        <KpiTile label="Pending approvals" value={k.pendingApprovals} sub={`${k.overdueApprovals} overdue`} href="/waiting" />
        <KpiTile label={`Launches in ${k.monthLabel}`} value={k.launchesThisMonth} sub={`${k.decisionsThisWeek} decisions this week`} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Needs attention"
            description={`${attention.length} projects, ordered by health score. Each shows the issue, its downstream impact and the action that protects the launch.`}
            action={<CardLink href="/risks">Risk Radar</CardLink>}
          />
          <div className="border-t border-border">
            <AttentionList items={attention} />
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Portfolio health"
              description={`Average ${k.averageHealth}/100 across ${k.active} active projects`}
              action={<CardLink href="/scoring">How it&apos;s scored</CardLink>}
            />
            <div className="space-y-5 px-5 pb-5">
              <HealthDistribution counts={portfolioHealthDistribution()} />
              <HealthBars rows={healthRows} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Upcoming launches" description="Next 30 days, with projected dates" />
            <div className="border-t border-border">
              <UpcomingLaunches launches={upcomingLaunches(30)} />
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Budget utilization"
            description={`${money(k.spent)} of ${money(k.budget)} spent (${Math.round((k.spent / k.budget) * 100)}%). Sorted by forecast variance.`}
          />
          <div className="px-5 pb-5">
            <BudgetBullets rows={budgetRows} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Approval bottlenecks"
            description={`${k.pendingApprovals} approvals pending, by approver`}
            action={<CardLink href="/waiting">Waiting Room</CardLink>}
          />
          <div className="px-5 pb-5">
            <ApprovalBottlenecks items={getWaitingItems().filter((w) => activeIds.has(w.projectId))} />
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent activity" description="Across all projects, newest first" />
        <div className="grid gap-x-10 px-5 pb-5 md:grid-cols-2">
          <ActivityFeed items={getActivity().slice(0, 5)} />
          <div className="mt-4 md:mt-0">
            <ActivityFeed items={getActivity().slice(5, 10)} />
          </div>
        </div>
      </Card>
    </>
  );
}
