/**
 * Portfolio-level logic: KPIs, "needs attention" reasoning and insights.
 * Every sentence here is assembled from the data by fixed rules.
 */
import { getDecisions, getProject, getProjects, getRisks, getWaitingItems } from "@/data";
import { capacityConflicts } from "./capacity";
import { SNAPSHOT_DATE } from "./config";
import {
  addBusinessDays,
  businessDays,
  calendarDaysBetween,
  formatDate,
  formatDay,
  formatMonth,
  toDate,
} from "./dates";
import { lowerFirst, money, orgOf, shortName } from "./format";
import {
  bandFor,
  budgetVariancePct,
  isActiveRisk,
  isOverdueWaiting,
  projectHealth,
  riskSeverity,
  type HealthResult,
} from "./health";
import { analyzeDelay, currentDelays, currentProjection, launchMilestone } from "./schedule";
import type { Decision, ISODate, Project } from "./types";

export const activeProjects = () => getProjects().filter((p) => p.status !== "completed");

export const launchLabel = (p: Project) => lowerFirst(launchMilestone(p).name);

/** Friday of the snapshot week. */
export function endOfWeek(today = SNAPSHOT_DATE): ISODate {
  const day = toDate(today).getUTCDay();
  return addBusinessDays(today, Math.max(0, 5 - day));
}

export function openDecisions(projectId?: string): Decision[] {
  return getDecisions()
    .filter((d) => d.status === "open" && (!projectId || d.projectId === projectId))
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
}

/* ------------------------------------------------------------------ */
/* KPIs                                                                */
/* ------------------------------------------------------------------ */

export function portfolioKpis() {
  const active = activeProjects();
  const activeIds = new Set(active.map((p) => p.id));
  const waiting = getWaitingItems().filter((w) => activeIds.has(w.projectId));
  const month = SNAPSHOT_DATE.slice(0, 7);
  const launchesThisMonth = active.filter((p) => launchMilestone(p).start.startsWith(month));
  const budget = active.reduce((s, p) => s + p.budget, 0);
  const forecast = active.reduce((s, p) => s + p.forecast, 0);
  const spent = active.reduce((s, p) => s + p.spent, 0);
  const scores = active.map((p) => projectHealth(p).score);

  return {
    active: active.length,
    onTrack: active.filter((p) => p.status === "on-track").length,
    atRisk: active.filter((p) => p.status === "at-risk").length,
    blocked: active.filter((p) => p.status === "blocked").length,
    completed: getProjects().length - active.length,
    budget,
    forecast,
    spent,
    variancePct: ((forecast - budget) / budget) * 100,
    pendingApprovals: waiting.filter((w) => w.kind === "approval").length,
    overdueApprovals: waiting.filter((w) => w.kind === "approval" && isOverdueWaiting(w)).length,
    waiting: waiting.length,
    launchesThisMonth: launchesThisMonth.length,
    monthLabel: formatMonth(SNAPSHOT_DATE).split(" ")[0],
    decisionsThisWeek: openDecisions().filter((d) => d.deadline <= endOfWeek()).length,
    averageHealth: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  };
}

export function upcomingLaunches(days = 45) {
  return activeProjects()
    .map((p) => {
      const projection = currentProjection(p);
      return {
        project: p,
        planned: projection.launchPlanned,
        projected: projection.launchProjected,
        slip: projection.launchSlip,
        daysAway: calendarDaysBetween(SNAPSHOT_DATE, projection.launchPlanned),
        health: projectHealth(p),
      };
    })
    .filter((l) => l.daysAway >= 0 && l.daysAway <= days)
    .sort((a, b) => a.planned.localeCompare(b.planned));
}

/* ------------------------------------------------------------------ */
/* Needs attention                                                     */
/* ------------------------------------------------------------------ */

export interface Attention {
  project: Project;
  health: HealthResult;
  severity: number;
  kind: "milestone" | "dependency" | "budget" | "risk";
  /** Short headline, e.g. "Final creative approval is 3 business days overdue". */
  issue: string;
  /** Same fact phrased to follow "because". */
  because: string;
  impact: string;
  action: string;
  actionBy?: ISODate;
  signals: string[];
}

const TIMELINE_SEVERITY = { slip: 100, "at-minimum": 80, compressed: 60, "buffer-used": 30, "on-plan": 10 };

function decisionAction(d: Decision) {
  return {
    action: `${orgOf(d.owner)} to decide by ${formatDay(d.deadline)}: ${lowerFirst(d.decision)}`,
    actionBy: d.deadline,
  };
}

function scheduleImpact(p: Project, health: HealthResult): string {
  const t = health.timeline;
  const { projection, window } = t;
  const launch = `${formatDate(projection.launchPlanned)} ${launchLabel(p)}`;
  switch (t.state) {
    case "slip": {
      const dependents = getProjects().flatMap((other) =>
        other.milestones
          .filter((m) => m.external?.projectId === p.id)
          .map((m) => `${shortName(other.name)}'s ${lowerFirst(m.name)}`),
      );
      return `${launchMilestone(p).name} moves ${businessDays(projection.launchSlip)}, from ${formatDate(projection.launchPlanned)} to ${formatDate(projection.launchProjected)}${dependents.length ? ` and pushes back ${dependents.join(", ")}` : ""}`;
    }
    case "at-minimum":
      return `${window!.milestone.name} cut to its ${window!.days}-day minimum; no buffer left before the ${launch}`;
    case "compressed":
      return `${window!.milestone.name} reduced from ${window!.plannedDays} to ${window!.days} days; no contingency left`;
    case "buffer-used":
      return `Schedule contingency partly used; the ${launch} is still protected`;
    default:
      return `Absorbed by plan contingency; the ${launch} is not yet affected`;
  }
}

export function attentionFor(p: Project): Attention {
  const health = projectHealth(p);
  const projection = health.timeline.projection;
  const waiting = getWaitingItems().filter((w) => w.projectId === p.id);
  const risks = getRisks().filter((r) => r.projectId === p.id && isActiveRisk(r));
  const decisions = openDecisions(p.id);
  const candidates: Omit<Attention, "project" | "health" | "signals">[] = [];

  // 1. Overdue milestones, judged by what they do to the schedule.
  const delays = currentDelays(p);
  const worst = Object.entries(delays).sort((a, b) => b[1] - a[1])[0];
  if (worst) {
    const [id, delay] = worst;
    const m = p.milestones.find((x) => x.id === id)!;
    const w = waiting.find((x) => x.milestoneId === id);
    const issue = `${m.name} is ${businessDays(delay)} overdue`;
    const analysis = analyzeDelay(p, id, delay);
    let action: string;
    let actionBy: ISODate | undefined;
    if (projection.launchSlip === 0 && analysis.latestSafeEnd >= SNAPSHOT_DATE) {
      const from = w ? ` from ${orgOf(w.owner)}` : "";
      action = `Secure ${lowerFirst(m.name.replace(/\s*\(.*\)/, ""))}${from} by ${formatDay(analysis.latestSafeEnd)} to protect the ${formatDate(projection.launchPlanned)} ${launchLabel(p)}`;
      actionBy = analysis.latestSafeEnd;
    } else if (decisions[0]) {
      ({ action, actionBy } = decisionAction(decisions[0]));
    } else {
      action = `Re-baseline the ${launchLabel(p)} date with the client`;
    }
    candidates.push({
      severity: TIMELINE_SEVERITY[health.timeline.state],
      kind: "milestone",
      issue,
      because: `${lowerFirst(m.name)} is ${businessDays(delay)} overdue${w ? ` (waiting on ${w.waitingOn.toLowerCase()})` : ""}`,
      impact: scheduleImpact(p, health),
      action,
      actionBy,
    });
  }

  // 2. Cross-project dependencies that have moved.
  for (const pm of projection.milestones) {
    const ext = pm.milestone.external;
    if (!ext || pm.milestone.completed) continue;
    const other = getProject(ext.projectId)!;
    const otherProjection = currentProjection(other);
    const otherEnd = otherProjection.byId[ext.milestoneId];
    if (otherEnd.shift <= 0 && otherProjection.launchSlip <= 0) continue;
    candidates.push({
      severity: TIMELINE_SEVERITY[health.timeline.state] + 5,
      kind: "dependency",
      issue: `Depends on ${other.name}, now projected ${formatDate(otherEnd.end)}`,
      because: `${lowerFirst(pm.milestone.name)} depends on ${other.name}, which is now projected to ${lowerFirst(otherEnd.milestone.name)} on ${formatDate(otherEnd.end)} instead of ${formatDate(otherEnd.milestone.end)}`,
      impact: scheduleImpact(p, health),
      action: `Confirm the fallback plan now and track ${shortName(other.name)} daily until its date is secured`,
    });
  }

  // 3. Budget pressure.
  const variance = budgetVariancePct(p);
  if (variance > 5) {
    const budgetRisk = risks.find((r) => r.category === "Scope") ?? risks.find((r) => r.category === "Budget");
    const d = decisions[0];
    candidates.push({
      severity: 50 + variance,
      kind: "budget",
      issue: `Forecast ${variance.toFixed(1)}% over budget`,
      because: `it is forecast to finish ${variance.toFixed(1)}% over budget (${money(p.forecast)} against ${money(p.budget)})${budgetRisk?.category === "Scope" ? " after an unfunded scope increase" : ""}`,
      impact: budgetRisk?.consequence.replace(/\.$/, "") ?? `${money(p.forecast - p.budget)} unfunded`,
      ...(d ? decisionAction(d) : { action: "Agree a recovery plan or budget change with the client" }),
    });
  }

  // 4. The most severe open risk.
  const topRisk = [...risks].sort((a, b) => b.probability * b.impact - a.probability * a.impact)[0];
  if (topRisk && riskSeverity(topRisk) !== "Low") {
    candidates.push({
      severity: riskSeverity(topRisk) === "Critical" ? 55 : riskSeverity(topRisk) === "High" ? 25 : 5,
      kind: "risk",
      issue: topRisk.title,
      because: `of an open ${riskSeverity(topRisk).toLowerCase()} risk: ${lowerFirst(topRisk.title)}`,
      impact: topRisk.consequence.replace(/\.$/, ""),
      action: topRisk.mitigation.split(". ")[0].replace(/\.$/, ""),
    });
  }

  const best = candidates.sort((a, b) => b.severity - a.severity)[0] ?? {
    severity: 0,
    kind: "risk" as const,
    issue: "No material issues",
    because: "no material issues are open",
    impact: "None",
    action: "Routine monitoring",
  };

  const overdue = waiting.filter(isOverdueWaiting).length;
  const constraint = health.factors.find((f) => f.key === "resources")!;
  const signals = [
    overdue ? `${overdue} overdue waiting ${overdue === 1 ? "item" : "items"}` : "",
    decisions.length ? `${decisions.length} open ${decisions.length === 1 ? "decision" : "decisions"}` : "",
    constraint.points ? constraint.detail.replace(/\.$/, "") : "",
    variance > 2 ? `Budget ${variance > 0 ? "+" : ""}${variance.toFixed(1)}%` : "",
  ].filter(Boolean);

  return { project: p, health, signals, ...best };
}

/** Active projects that need a PM's attention, most urgent first. */
export function needsAttention(): Attention[] {
  return activeProjects()
    .map(attentionFor)
    .filter((a) => a.project.status !== "on-track" || a.health.band !== "Healthy")
    .sort((a, b) => a.health.score - b.health.score);
}

/* ------------------------------------------------------------------ */
/* Insights                                                            */
/* ------------------------------------------------------------------ */

export function attentionSentence(a: Attention, lead: string): string {
  return `${a.project.name} ${lead} (health ${a.health.score}) because ${a.because}. ${a.impact}. ${a.action}.`;
}

export function portfolioInsights(): { title: string; body: string; projectId?: string }[] {
  const attention = needsAttention();
  const insights: { title: string; body: string; projectId?: string }[] = attention.slice(0, 3).map((a, i) => ({
    title: i === 0 ? "Highest-risk project" : a.kind === "budget" ? "Budget pressure" : a.kind === "dependency" ? "Cross-project dependency" : "Schedule pressure",
    body: attentionSentence(a, i === 0 ? "is currently the highest-risk project" : "needs attention"),
    projectId: a.project.id,
  }));

  const dependency = attention.find((a) => a.kind === "dependency");
  if (dependency && !insights.some((i) => i.projectId === dependency.project.id)) {
    insights.push({
      title: "Cross-project dependency",
      body: `${dependency.project.name} is on track but exposed: ${dependency.because}. ${dependency.impact}.`,
      projectId: dependency.project.id,
    });
  }

  const budgetHeavy = attention.find((a) => a.kind === "budget");
  if (budgetHeavy && !insights.some((i) => i.projectId === budgetHeavy.project.id)) {
    insights.push({
      title: "Budget pressure",
      body: attentionSentence(budgetHeavy, "needs attention"),
      projectId: budgetHeavy.project.id,
    });
  }

  const conflict = capacityConflicts()[0];
  if (conflict) insights.push({ title: "Resource conflict", body: conflict.insight });
  return insights;
}

export function deterioratingProjects() {
  return activeProjects()
    .map((p) => {
      const h = projectHealth(p);
      return { project: p, health: h, change: h.score - h.trend[0], weekChange: h.score - h.trend[h.trend.length - 2] };
    })
    .filter((x) => x.change <= -10)
    .sort((a, b) => a.change - b.change);
}

export function portfolioHealthDistribution() {
  const counts = { Healthy: 0, Watch: 0, "At Risk": 0, Critical: 0 };
  for (const p of activeProjects()) counts[bandFor(projectHealth(p).score)]++;
  return counts;
}
