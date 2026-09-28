import { getAllocations, getProject, getProjects, getRoles } from "@/data";
import { CAPACITY_WEEKS } from "./config";
import { formatDate } from "./dates";
import type { Role } from "./types";

export interface RoleWeek {
  hours: number;
  capacity: number;
  pct: number;
  contributors: { projectId: string; hours: number }[];
}

export interface RoleLoad {
  role: Role;
  capacity: number;
  weeks: RoleWeek[];
}

const blockedIds = () => new Set(getProjects().filter((p) => p.status === "blocked").map((p) => p.id));

export function roleLoads(): RoleLoad[] {
  const allocations = getAllocations();
  return getRoles().map((role) => {
    const capacity = role.headcount * role.hoursPerPerson;
    const weeks = CAPACITY_WEEKS.map((_, w) => {
      const contributors = allocations
        .filter((a) => a.roleId === role.id && a.hours[w] > 0)
        .map((a) => ({ projectId: a.projectId, hours: a.hours[w] }))
        .sort((a, b) => b.hours - a.hours);
      const hours = contributors.reduce((s, c) => s + c.hours, 0);
      return { hours, capacity, pct: Math.round((hours / capacity) * 100), contributors };
    });
    return { role, capacity, weeks };
  });
}

/** Minimum hours in an over-allocated week for a project to count as affected. */
const MATERIAL_HOURS = 8;

/** Roles over 100% this week or next that a project materially draws on. */
export function constraintsForProject(projectId: string) {
  return roleLoads().flatMap((load) =>
    load.weeks.slice(0, 2).flatMap((week, w) =>
      week.pct > 100 && week.contributors.some((c) => c.projectId === projectId && c.hours >= MATERIAL_HOURS)
        ? [{ role: load.role, week: w, pct: week.pct }]
        : [],
    ),
  ).filter((c, i, arr) => arr.findIndex((x) => x.role.id === c.role.id) === i);
}

export interface CapacityConflict {
  role: Role;
  week: number;
  pct: number;
  projects: string[];
  insight: string;
}

const weekLabel = (w: number) =>
  w === 0 ? "this week" : w === 1 ? "next week" : `the week of ${formatDate(CAPACITY_WEEKS[w])}`;

const names = (ids: string[]) => {
  const list = ids.map((id) => getProject(id)?.name ?? id);
  return list.length <= 1 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`;
};

/** Over-allocated role-weeks with a plain-language explanation of the cause. */
export function capacityConflicts(): CapacityConflict[] {
  const blocked = blockedIds();
  return roleLoads().flatMap((load) =>
    load.weeks.flatMap((week, w) => {
      if (week.pct <= 100) return [];
      const top = week.contributors.filter((c) => c.hours >= MATERIAL_HOURS).slice(0, 2).map((c) => c.projectId);
      const previous = load.weeks[w - 1];
      const releasing = top.filter((id) => blocked.has(id));
      let insight: string;
      if (previous && previous.pct < 85 && releasing.length) {
        insight = `${load.role.name} is under-used ${weekLabel(w - 1)} (${previous.pct}%) because ${names(releasing)} ${releasing.length > 1 ? "are" : "is"} blocked, then peaks at ${week.pct}% ${weekLabel(w)} when that work is released at once.`;
      } else {
        insight = `${load.role.name} is over capacity ${weekLabel(w)} (${week.pct}%) due to overlapping delivery windows across ${names(top)}.`;
      }
      return [{ role: load.role, week: w, pct: week.pct, projects: top, insight }];
    }),
  );
}

export { weekLabel as capacityWeekLabel };
