/**
 * Schedule engine — simple critical-path logic over the milestone graph.
 *
 * How a delay flows through a plan:
 *  1. Downstream milestones start after their latest predecessor finishes.
 *  2. Gaps in the plan (contingency) absorb the shift first.
 *  3. A compressible window (usually QA, marked with `minDays`) shrinks
 *     next, down to its minimum.
 *  4. Anything left over moves the launch date.
 *
 * All durations are business days. Everything here is deterministic.
 */
import { SNAPSHOT_DATE } from "./config";
import { addBusinessDays, businessDaysBetween, businessDaysInclusive, maxDate } from "./dates";
import type { ISODate, Milestone, Project } from "./types";
import { getProject } from "@/data";

export interface ProjectedMilestone {
  milestone: Milestone;
  deps: string[];
  plannedDays: number;
  start: ISODate;
  end: ISODate;
  days: number;
  /** Business days the end moved versus plan. */
  shift: number;
  compressed: boolean;
}

export interface Projection {
  milestones: ProjectedMilestone[];
  byId: Record<string, ProjectedMilestone>;
  launchPlanned: ISODate;
  launchProjected: ISODate;
  launchSlip: number;
}

export type Delays = Record<string, number>;

export const depsOf = (project: Project, index: number): string[] =>
  project.milestones[index].dependsOn ?? (index > 0 ? [project.milestones[index - 1].id] : []);

export const launchMilestone = (project: Project) =>
  project.milestones.find((m) => m.kind === "launch")!;

export const plannedDays = (m: Milestone) => businessDaysInclusive(m.start, m.end);

/** Latest date each milestone can finish without touching the launch date. */
function latestFinishes(project: Project): Record<string, ISODate> {
  const launch = launchMilestone(project);
  const ms = project.milestones;
  const successors: Record<string, Milestone[]> = {};
  ms.forEach((m, i) => depsOf(project, i).forEach((d) => (successors[d] ??= []).push(m)));

  const lf: Record<string, ISODate> = { [launch.id]: launch.start };
  for (let i = ms.length - 1; i >= 0; i--) {
    const m = ms[i];
    if (m.id === launch.id) continue;
    const succ = successors[m.id] ?? [];
    const candidates = succ.map((s) =>
      s.kind === "launch"
        ? addBusinessDays(s.start, -1)
        : addBusinessDays(addBusinessDays(lf[s.id], -(plannedDays(s) - 1)), -1),
    );
    lf[m.id] = candidates.length
      ? candidates.sort()[0]
      : addBusinessDays(launch.start, -1);
  }
  return lf;
}

/** Delays already happening: open milestones whose planned end has passed. */
export function currentDelays(project: Project, today = SNAPSHOT_DATE): Delays {
  const delays: Delays = {};
  for (const m of project.milestones) {
    if (!m.completed && m.kind !== "launch" && m.end < today) {
      delays[m.id] = businessDaysBetween(m.end, today);
    }
  }
  return delays;
}

type ExternalMode = "planned" | "projected";

function externalEnd(m: Milestone, mode: ExternalMode, depth: number): ISODate | undefined {
  if (!m.external) return undefined;
  const other = getProject(m.external.projectId);
  if (!other) return undefined;
  if (mode === "planned" || depth > 2) {
    return other.milestones.find((x) => x.id === m.external!.milestoneId)?.end;
  }
  return simulate(other, currentDelays(other), "projected", depth + 1).byId[m.external.milestoneId]?.end;
}

/**
 * Project the schedule forward given delays (business days added to each
 * listed milestone's planned end).
 */
export function simulate(
  project: Project,
  delays: Delays = {},
  externals: ExternalMode = "projected",
  depth = 0,
): Projection {
  const lf = latestFinishes(project);
  const byId: Record<string, ProjectedMilestone> = {};
  const out: ProjectedMilestone[] = [];

  project.milestones.forEach((m, i) => {
    const deps = depsOf(project, i);
    const pDays = plannedDays(m);
    let start = m.start;
    let end = m.end;
    let compressed = false;

    if (!m.completed) {
      const predEnd = maxDate(
        ...deps.map((d) => byId[d]?.end),
        externalEnd(m, externals, depth),
      );
      const earliest = predEnd ? addBusinessDays(predEnd, 1) : m.start;
      start = maxDate(m.start, earliest);

      if (m.kind === "launch") {
        end = start;
      } else {
        end = addBusinessDays(start, pDays - 1);
        const delay = delays[m.id];
        if (delay) end = maxDate(end, addBusinessDays(m.end, delay));
        if (m.minDays && end > lf[m.id]) {
          end = maxDate(lf[m.id], addBusinessDays(start, m.minDays - 1));
          compressed = businessDaysInclusive(start, end) < pDays;
        }
      }
    }

    const pm: ProjectedMilestone = {
      milestone: m,
      deps,
      plannedDays: pDays,
      start,
      end,
      days: m.kind === "launch" ? 1 : businessDaysInclusive(start, end),
      shift: businessDaysBetween(m.end, end),
      compressed,
    };
    byId[m.id] = pm;
    out.push(pm);
  });

  const launch = launchMilestone(project);
  const projected = byId[launch.id].start;
  return {
    milestones: out,
    byId,
    launchPlanned: launch.start,
    launchProjected: projected,
    launchSlip: businessDaysBetween(launch.start, projected),
  };
}

const projectionCache = new Map<string, Projection>();

/** The schedule as it stands today, with all current delays applied. */
export function currentProjection(project: Project): Projection {
  const cached = projectionCache.get(project.id);
  if (cached) return cached;
  const projection = simulate(project, currentDelays(project));
  projectionCache.set(project.id, projection);
  return projection;
}

/* ------------------------------------------------------------------ */
/* Milestone state                                                     */
/* ------------------------------------------------------------------ */

export type MilestoneState =
  | "complete"
  | "in-progress"
  | "overdue"
  | "waiting"
  | "impacted"
  | "upcoming";

export function milestoneStates(project: Project, today = SNAPSHOT_DATE) {
  const projection = currentProjection(project);
  const states: Record<string, MilestoneState> = {};
  for (const pm of projection.milestones) {
    const m = pm.milestone;
    const predsDone = pm.deps.every((d) => project.milestones.find((x) => x.id === d)?.completed);
    if (m.completed) states[m.id] = "complete";
    else if (m.kind !== "launch" && m.end < today) states[m.id] = "overdue";
    else if (m.start <= today && !predsDone) states[m.id] = "waiting";
    else if (m.start <= today) states[m.id] = "in-progress";
    else if (pm.shift > 0 || pm.compressed || (m.kind === "launch" && projection.launchSlip > 0))
      states[m.id] = "impacted";
    else states[m.id] = "upcoming";
  }
  return states;
}

/** Ids of every milestone downstream of `id` (transitively). */
export function downstreamOf(project: Project, id: string): Set<string> {
  const result = new Set<string>();
  let frontier = [id];
  while (frontier.length) {
    const next: string[] = [];
    project.milestones.forEach((m, i) => {
      if (!result.has(m.id) && depsOf(project, i).some((d) => frontier.includes(d))) {
        result.add(m.id);
        next.push(m.id);
      }
    });
    frontier = next;
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Timeline summary                                                    */
/* ------------------------------------------------------------------ */

export type TimelineState = "on-plan" | "buffer-used" | "compressed" | "at-minimum" | "slip";

export interface TimelineSummary {
  state: TimelineState;
  projection: Projection;
  /** The compressible window most affected (or the first one if none are). */
  window?: ProjectedMilestone;
  sentence: string;
}

export function timelineSummary(project: Project): TimelineSummary {
  const projection = currentProjection(project);
  const delays = currentDelays(project);
  const open = projection.milestones.filter((pm) => !pm.milestone.completed);
  const windows = open.filter((pm) => pm.milestone.minDays);
  const window = windows.find((w) => w.compressed) ?? windows[0];
  const bufferUsed = open.some((pm) => pm.shift > 0 && delays[pm.milestone.id] === undefined);

  let state: TimelineState = "on-plan";
  let sentence = "Tracking to plan; no schedule buffer used.";
  if (project.status === "completed") {
    sentence = "Launched on schedule.";
  } else if (projection.launchSlip > 0) {
    state = "slip";
    sentence = `Launch projected to move ${projection.launchSlip} business ${projection.launchSlip === 1 ? "day" : "days"}.`;
  } else if (window?.compressed && window.days <= (window.milestone.minDays ?? 0)) {
    state = "at-minimum";
    sentence = `${window.milestone.name} is at its ${window.days}-day minimum; no buffer left.`;
  } else if (window?.compressed) {
    state = "compressed";
    sentence = `${window.milestone.name} reduced from ${window.plannedDays} to ${window.days} days.`;
  } else if (bufferUsed) {
    state = "buffer-used";
    sentence = "Schedule contingency partly used; launch protected.";
  }
  return { state, projection, window, sentence };
}

/* ------------------------------------------------------------------ */
/* Scenario analysis                                                   */
/* ------------------------------------------------------------------ */

export type ScenarioRisk = "None" | "Low" | "Medium" | "High" | "Critical";

export interface ScenarioResult {
  milestone: Milestone;
  delay: number;
  plan: Projection;
  scenario: Projection;
  /** Downstream milestones whose start moves. */
  shifted: { milestone: Milestone; plannedStart: ISODate; newStart: ISODate; shift: number }[];
  window?: { name: string; plannedDays: number; newDays: number; minDays: number };
  /** Delay this milestone can absorb before any window compresses. */
  contingency: number;
  contingencyRemaining: number;
  /** Largest delay that still protects the launch date. */
  breakingPoint: number;
  latestSafeEnd: ISODate;
  launchSlip: number;
  risk: ScenarioRisk;
}

function withDelay(project: Project, id: string, delay: number): Projection {
  return simulate(project, { ...currentDelays(project), [id]: delay });
}

export function analyzeDelay(project: Project, milestoneId: string, delay: number): ScenarioResult {
  const milestone = project.milestones.find((m) => m.id === milestoneId)!;
  const base = { ...currentDelays(project) };
  delete base[milestoneId];
  const plan = simulate(project, base);
  const scenario = withDelay(project, milestoneId, delay);
  const downstream = downstreamOf(project, milestoneId);

  let contingency = 0;
  let breakingPoint = 0;
  for (let d = 1; d <= 40; d++) {
    const p = withDelay(project, milestoneId, d);
    const touched = p.launchSlip > plan.launchSlip || p.milestones.some((pm) => pm.compressed && !plan.byId[pm.milestone.id].compressed) ||
      p.milestones.some((pm) => pm.days < plan.byId[pm.milestone.id].days);
    if (!touched && contingency === d - 1) contingency = d;
    if (p.launchSlip <= plan.launchSlip) breakingPoint = d;
    else break;
  }

  const shifted = scenario.milestones
    .filter((pm) => downstream.has(pm.milestone.id) && pm.milestone.kind !== "launch")
    .map((pm) => ({
      milestone: pm.milestone,
      plannedStart: plan.byId[pm.milestone.id].start,
      newStart: pm.start,
      shift: businessDaysBetween(plan.byId[pm.milestone.id].start, pm.start),
    }))
    .filter((s) => s.shift > 0);

  const windowPm =
    scenario.milestones.find((pm) => downstream.has(pm.milestone.id) && pm.milestone.minDays && pm.days < plan.byId[pm.milestone.id].days) ??
    scenario.milestones.find((pm) => downstream.has(pm.milestone.id) && pm.milestone.minDays);
  const window = windowPm && {
    name: windowPm.milestone.name,
    plannedDays: plan.byId[windowPm.milestone.id].days,
    newDays: windowPm.days,
    minDays: windowPm.milestone.minDays!,
  };

  const launchSlip = scenario.launchSlip - plan.launchSlip;
  let risk: ScenarioRisk = "None";
  if (launchSlip > 0) risk = "Critical";
  else if (window && window.newDays <= window.minDays && window.newDays < window.plannedDays) risk = "High";
  else if (window && window.newDays < window.plannedDays) risk = "Medium";
  else if (shifted.length) risk = "Low";

  return {
    milestone,
    delay,
    plan,
    scenario,
    shifted,
    window,
    contingency,
    contingencyRemaining: Math.max(0, contingency - delay),
    breakingPoint,
    latestSafeEnd: addBusinessDays(milestone.end, breakingPoint),
    launchSlip,
    risk,
  };
}
