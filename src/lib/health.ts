/**
 * Project health score (0–100).
 *
 * A transparent, rule-based score. Every project starts at 100 and loses
 * points for six observable signals, each capped so no single signal can
 * dominate. The breakdown is shown in the UI so anyone can check the math.
 */
import { getDecisions, getRisks, getWaitingItems } from "@/data";
import { constraintsForProject } from "./capacity";
import { SNAPSHOT_DATE, WAITING_THRESHOLD_DAYS } from "./config";
import { businessDaysBetween } from "./dates";
import { currentDelays, timelineSummary, type TimelineSummary } from "./schedule";
import type { Project, Rating, Risk, WaitingItem } from "./types";

export type HealthBand = "Healthy" | "Watch" | "At Risk" | "Critical";

export const HEALTH_BANDS: { band: HealthBand; min: number; description: string }[] = [
  { band: "Healthy", min: 90, description: "No material issues. Routine monitoring." },
  { band: "Watch", min: 75, description: "Early warning signs. Review at weekly status." },
  { band: "At Risk", min: 50, description: "Needs PM intervention this week." },
  { band: "Critical", min: 0, description: "Escalate. Launch, budget or scope is in jeopardy." },
];

export const bandFor = (score: number): HealthBand =>
  HEALTH_BANDS.find((b) => score >= b.min)!.band;

export interface ScoreFactor {
  key: string;
  label: string;
  max: number;
  points: number;
  detail: string;
}

/** The rules, in plain language, as shown on the methodology page. */
export const SCORING_RULES: { key: string; label: string; max: number; rule: string }[] = [
  { key: "timeline", label: "Timeline risk", max: 25, rule: "Contingency used −6 · QA window compressed −12 · QA at minimum −20 · launch date moves −25" },
  { key: "budget", label: "Budget variance", max: 20, rule: "−2 per 1% the forecast exceeds the approved budget" },
  { key: "risks", label: "Open high-impact risks", max: 20, rule: "Critical risk −10 · High −5 · Medium −2 (open or monitoring)" },
  { key: "approvals", label: "Delayed approvals & dependencies", max: 15, rule: `−5 per waiting item older than ${WAITING_THRESHOLD_DAYS} business days or past its deadline` },
  { key: "resources", label: "Resource constraints", max: 10, rule: "−5 per team over 100% this week or next where the project has 8+ hours booked" },
  { key: "milestones", label: "Milestone delays", max: 10, rule: "−5 per open milestone past its planned end date" },
];

export type RiskSeverity = "Critical" | "High" | "Medium" | "Low";

export const riskScore = (r: Risk) => r.probability * r.impact;
export function riskSeverity(r: Risk): RiskSeverity {
  const s = riskScore(r);
  return s >= 9 ? "Critical" : s >= 6 ? "High" : s >= 3 ? "Medium" : "Low";
}
const SEVERITY_POINTS: Record<RiskSeverity, number> = { Critical: 10, High: 5, Medium: 2, Low: 0 };

export const isActiveRisk = (r: Risk) => r.status !== "resolved";

export const daysWaiting = (w: WaitingItem) => businessDaysBetween(w.requested, SNAPSHOT_DATE);
export const isOverdueWaiting = (w: WaitingItem) =>
  daysWaiting(w) > WAITING_THRESHOLD_DAYS || w.deadline < SNAPSHOT_DATE;

const TIMELINE_POINTS: Record<TimelineSummary["state"], number> = {
  "on-plan": 0,
  "buffer-used": 6,
  compressed: 12,
  "at-minimum": 20,
  slip: 25,
};

export const budgetVariancePct = (p: Project) => ((p.forecast - p.budget) / p.budget) * 100;

export interface HealthResult {
  score: number;
  band: HealthBand;
  factors: ScoreFactor[];
  timeline: TimelineSummary;
  dimensions: { key: string; label: string; rating: Rating; note: string }[];
  trend: number[];
}

const cache = new Map<string, HealthResult>();

export function projectHealth(project: Project): HealthResult {
  const cached = cache.get(project.id);
  if (cached) return cached;

  const risks = getRisks().filter((r) => r.projectId === project.id && isActiveRisk(r));
  const waiting = getWaitingItems().filter((w) => w.projectId === project.id);
  const overdueWaiting = waiting.filter(isOverdueWaiting);
  const constraints = constraintsForProject(project.id);
  const delays = currentDelays(project);
  const delayedCount = Object.keys(delays).length;
  const timeline = timelineSummary(project);
  const variance = budgetVariancePct(project);

  const bySeverity = (s: RiskSeverity) => risks.filter((r) => riskSeverity(r) === s).length;
  const riskPoints = risks.reduce((sum, r) => sum + SEVERITY_POINTS[riskSeverity(r)], 0);

  const factors: ScoreFactor[] = [
    {
      key: "timeline",
      label: "Timeline risk",
      max: 25,
      points: TIMELINE_POINTS[timeline.state],
      detail: timeline.sentence,
    },
    {
      key: "budget",
      label: "Budget variance",
      max: 20,
      points: Math.max(0, Math.round(variance * 2)),
      detail:
        variance > 0
          ? `Forecast ${variance.toFixed(1)}% over approved budget.`
          : `Forecast ${Math.abs(variance).toFixed(1)}% under approved budget.`,
    },
    {
      key: "risks",
      label: "Open high-impact risks",
      max: 20,
      points: riskPoints,
      detail: risks.length
        ? `${bySeverity("Critical")} critical, ${bySeverity("High")} high, ${bySeverity("Medium")} medium open.`
        : "No open risks.",
    },
    {
      key: "approvals",
      label: "Delayed approvals & dependencies",
      max: 15,
      points: overdueWaiting.length * 5,
      detail: overdueWaiting.length
        ? `${overdueWaiting.length} of ${waiting.length} waiting ${waiting.length === 1 ? "item" : "items"} overdue.`
        : waiting.length
          ? `${waiting.length} waiting, none overdue.`
          : "Nothing waiting on others.",
    },
    {
      key: "resources",
      label: "Resource constraints",
      max: 10,
      points: constraints.length * 5,
      detail: constraints.length
        ? `${constraints.map((c) => `${c.role.name} ${c.pct}%`).join(", ")}.`
        : "No over-allocated teams.",
    },
    {
      key: "milestones",
      label: "Milestone delays",
      max: 10,
      points: delayedCount * 5,
      detail: delayedCount ? `${delayedCount} open ${delayedCount === 1 ? "milestone" : "milestones"} past due.` : "No overdue milestones.",
    },
  ].map((f) => ({ ...f, points: Math.min(f.points, f.max) }));

  const score = project.status === "completed" ? 100 : 100 - factors.reduce((s, f) => s + f.points, 0);

  const pendingApprovals = waiting.filter((w) => w.kind === "approval");
  const openDecisions = getDecisions().filter((d) => d.projectId === project.id && d.status === "open");

  const rate = (points: number, watchAt: number, concernAt: number): Rating =>
    points >= concernAt ? "concern" : points >= watchAt ? "watch" : "good";

  const dimensions = [
    {
      key: "timeline",
      label: "Timeline",
      rating: rate(TIMELINE_POINTS[timeline.state], 6, 12),
      note: timeline.sentence,
    },
    {
      key: "budget",
      label: "Budget",
      rating: variance > 5 ? "concern" : variance > 2 ? "watch" : ("good" as Rating),
      note: `${variance > 0 ? "+" : ""}${variance.toFixed(1)}% forecast vs budget.`,
    },
    { key: "scope", label: "Scope", ...project.scope },
    {
      key: "resources",
      label: "Resources",
      rating: constraints.length > 1 ? "concern" : constraints.length ? "watch" : ("good" as Rating),
      note: constraints.length
        ? `Draws on ${constraints.map((c) => `${c.role.name} (${c.pct}%)`).join(", ")}.`
        : "Required teams within capacity.",
    },
    {
      key: "approvals",
      label: "Approvals",
      rating: overdueWaiting.length ? "concern" : pendingApprovals.length || openDecisions.length ? "watch" : ("good" as Rating),
      note: overdueWaiting.length
        ? `${overdueWaiting.length} overdue; ${pendingApprovals.length} approvals pending.`
        : pendingApprovals.length
          ? `${pendingApprovals.length} pending, within deadline.`
          : "No approvals outstanding.",
    },
    { key: "quality", label: "Quality", ...project.quality },
  ] satisfies HealthResult["dimensions"];

  const result: HealthResult = {
    score,
    band: bandFor(score),
    factors,
    timeline,
    dimensions,
    trend: [...project.healthHistory, score],
  };
  cache.set(project.id, result);
  return result;
}
