import { ArrowRight, ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityFeed } from "@/components/activity-feed";
import { DependencyGraph } from "@/components/project/dependency-graph";
import { MilestoneTimeline } from "@/components/project/milestone-timeline";
import { DecisionList, HealthDimensions, ScoreBreakdown, TrendSparkline, WaitingList } from "@/components/project/panels";
import { RiskRegister } from "@/components/project/risk-register";
import { ScenarioSimulator } from "@/components/project/scenario-simulator";
import { Card, CardHeader, CardLink } from "@/components/ui/card";
import { HealthScore, ProgressBar, StatusBadge } from "@/components/ui/status";
import { getActivity, getDecisions, getProject, getProjects, getRisks, getWaitingItems } from "@/data";
import { addBusinessDays, formatDate, formatLong } from "@/lib/dates";
import { money, signedPct } from "@/lib/format";
import { budgetVariancePct, projectHealth } from "@/lib/health";
import { attentionFor } from "@/lib/portfolio";
import { currentPhase, progressOf } from "@/lib/project";
import { SNAPSHOT_DATE } from "@/lib/config";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return getProjects().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: getProject(id)?.name ?? "Project" };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const health = projectHealth(project);
  const projection = health.timeline.projection;
  const attention = project.status === "completed" ? null : attentionFor(project);
  const risks = getRisks().filter((r) => r.projectId === id);
  const waiting = getWaitingItems().filter((w) => w.projectId === id);
  const decisions = getDecisions()
    .filter((d) => d.projectId === id)
    .sort((a, b) => Number(a.status === "decided") - Number(b.status === "decided") || a.deadline.localeCompare(b.deadline));
  const activity = getActivity().filter((a) => a.projectId === id);
  const variance = budgetVariancePct(project);
  const progress = progressOf(project);
  const trendLabels = [-3, -2, -1].map((w) => formatDate(addBusinessDays(SNAPSHOT_DATE, w * 5))).concat("Now");

  const summary: [string, React.ReactNode][] = [
    ["Client", project.client],
    ["Project type", project.type],
    ["Project manager", project.owner],
    ["Start date", formatLong(project.milestones[0].start)],
    [
      "Launch date",
      projection.launchSlip > 0 ? (
        <>
          <s className="text-subtle">{formatLong(projection.launchPlanned)}</s>{" "}
          <span className="font-medium text-critical-fg">{formatLong(projection.launchProjected)}</span>
        </>
      ) : (
        formatLong(projection.launchPlanned)
      ),
    ],
    ["Current phase", currentPhase(project)],
    ["Team size", `${project.teamSize} people`],
    ["Deliverables", project.deliverables],
  ];

  return (
    <>
      <Link href="/projects" className="mb-4 inline-flex items-center gap-1 text-[12.5px] text-subtle hover:text-fg">
        <ChevronLeft className="size-3.5" aria-hidden />
        Projects
      </Link>

      <div className="flex flex-col gap-5 pb-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-fg">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="mt-1 text-[13.5px] text-muted">
            {project.client} · {project.type} · {project.owner}
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-fg">{project.objective}</p>
        </div>
        <div className="flex shrink-0 items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3 shadow-card">
          <HealthScore score={health.score} band={health.band} size="lg" showBand={false} />
          <div>
            <p className="text-[11.5px] text-subtle">Health score</p>
            <p className="text-[15px] font-semibold text-fg">{health.band}</p>
            <Link href="/scoring" className="text-[12px] text-muted underline decoration-border-strong underline-offset-2 hover:text-fg">
              How it&apos;s calculated
            </Link>
          </div>
        </div>
      </div>

      {attention && attention.severity > 10 && (
        <div className="mb-6 rounded-lg border border-border bg-surface px-5 py-4 shadow-card">
          <p className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-subtle">PM focus this week</p>
          <div className="mt-2 grid gap-x-8 gap-y-2 text-[13px] md:grid-cols-3">
            <div>
              <p className="text-subtle">Issue</p>
              <p className="text-fg">{attention.issue}</p>
            </div>
            <div>
              <p className="text-subtle">Impact</p>
              <p className="text-fg">{attention.impact}</p>
            </div>
            <div>
              <p className="text-subtle">Required action</p>
              <p className="flex items-start gap-1.5 font-medium text-fg">
                <ArrowRight className="mt-[3px] size-3.5 shrink-0 text-accent" aria-hidden />
                {attention.action}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Project summary" />
          <div className="px-5 pb-5">
            <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-[13px]">
              {summary.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-subtle">{k}</dt>
                  <dd className="text-fg">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 space-y-4 border-t border-border pt-4">
              <div>
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-muted">Progress</span>
                  <span className="tabular font-medium text-fg">{progress}%</span>
                </div>
                <ProgressBar value={progress} className="mt-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-muted">Budget spent</span>
                  <span className="tabular font-medium text-fg">
                    {money(project.spent)} of {money(project.budget)}
                  </span>
                </div>
                <ProgressBar value={(project.spent / project.budget) * 100} className="mt-1.5" tone={variance > 2 ? "serious" : "neutral"} />
                <p className={cn("mt-1.5 text-[12px]", variance > 2 ? "text-serious-fg" : "text-subtle")}>
                  Forecast at completion {money(project.forecast)} ({signedPct(variance)})
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Project health"
            description="Six dimensions. Timeline, budget, resources and approvals are calculated; scope and quality are PM-assessed."
          />
          <div className="grid gap-6 px-5 pb-5 md:grid-cols-[1fr_260px]">
            <HealthDimensions dimensions={health.dimensions} />
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-[12px] font-medium text-muted">Score trend (weekly)</p>
                <TrendSparkline values={health.trend} labels={trendLabels} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Milestones"
          description="Current projection against the original plan. Delays flow downstream through dependencies."
        />
        <div className="px-5 pb-5">
          <MilestoneTimeline project={project} />
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Dependencies" description="Red dashed paths show where a delay is travelling downstream." />
          <div className="px-5 pb-6">
            <DependencyGraph project={project} />
          </div>
        </Card>
        <div className="flex min-w-0 flex-col gap-6">
          {project.status !== "completed" && (
            <Card>
              <CardHeader title="Scenario mode" description="Simple rule-based what-if: slip a milestone and see what happens downstream." />
              <div className="px-5 pb-5">
                <ScenarioSimulator projectId={project.id} />
              </div>
            </Card>
          )}
          <Card>
            <CardHeader title="Score breakdown" description="Every point deducted, and why" action={<CardLink href="/scoring">Method</CardLink>} />
            <div className="px-5 pb-5">
              <ScoreBreakdown health={health} />
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Risk register"
          description={`${risks.filter((r) => r.status !== "resolved").length} active, ${risks.filter((r) => r.status === "resolved").length} resolved`}
          action={<CardLink href="/risks">Risk Radar</CardLink>}
        />
        <RiskRegister risks={risks} />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Decisions required" description="Stakeholder decisions this project needs to keep moving" />
          <div className="border-t border-border">
            <DecisionList decisions={decisions} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Waiting on others" action={<CardLink href="/waiting">Waiting Room</CardLink>} />
          <div className="border-t border-border">
            <WaitingList items={waiting} />
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Activity" description="Most recent first" />
        <div className="px-5 pb-5">
          {activity.length ? (
            <ActivityFeed items={activity} showProject={false} />
          ) : (
            <p className="text-[13px] text-subtle">No recent activity.</p>
          )}
        </div>
      </Card>
    </>
  );
}
