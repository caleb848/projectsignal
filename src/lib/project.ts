import { SNAPSHOT_DATE } from "./config";
import { businessDaysInclusive } from "./dates";
import { milestoneStates, plannedDays } from "./schedule";
import type { Milestone, Project, ProjectStatus } from "./types";

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  "on-track": "On Track",
  "at-risk": "At Risk",
  blocked: "Blocked",
  completed: "Completed",
};

/** Share of planned work complete, weighted by milestone duration. */
export function progressOf(project: Project, today = SNAPSHOT_DATE): number {
  const work = project.milestones.filter((m) => m.kind !== "launch");
  const total = work.reduce((s, m) => s + plannedDays(m), 0);
  const states = milestoneStates(project, today);
  const done = work.reduce((s, m) => {
    if (m.completed) return s + plannedDays(m);
    if (states[m.id] === "in-progress" || states[m.id] === "overdue") {
      const elapsed = today >= m.end ? plannedDays(m) : businessDaysInclusive(m.start, today);
      return s + Math.min(0.8, elapsed / plannedDays(m)) * plannedDays(m);
    }
    return s;
  }, 0);
  return project.status === "completed" ? 100 : Math.round((done / total) * 100);
}

/** The earliest open milestone that is due to have started, else the next one. */
export function currentMilestone(project: Project, today = SNAPSHOT_DATE): Milestone | undefined {
  const open = project.milestones.filter((m) => !m.completed);
  return open.find((m) => m.start <= today) ?? open[0];
}

export function currentPhase(project: Project): string {
  return project.status === "completed" ? "Complete" : currentMilestone(project)?.name ?? "—";
}

export function nextMilestone(project: Project, today = SNAPSHOT_DATE): Milestone | undefined {
  return project.milestones.find((m) => !m.completed && m.start > today);
}
