/**
 * Status brief generator. Builds an audience-specific update from the
 * portfolio data using fixed rules — no language model involved — so every
 * statement can be traced back to a number on the dashboard.
 */
import { getProjects, getRisks, getWaitingItems } from "@/data";
import { capacityConflicts } from "./capacity";
import { SNAPSHOT_DATE } from "./config";
import { addBusinessDays, businessDaysBetween, calendarDaysBetween, formatDate, formatDay, formatFull, plural } from "./dates";
import { listToSentence, lowerFirst, money, orgOf, shortName, signedPct } from "./format";
import { budgetVariancePct, daysWaiting, isActiveRisk, isOverdueWaiting, projectHealth, riskSeverity } from "./health";
import {
  activeProjects,
  endOfWeek,
  needsAttention,
  openDecisions,
  portfolioKpis,
  upcomingLaunches,
  type Attention,
} from "./portfolio";
import { currentPhase, nextMilestone, progressOf } from "./project";
import { currentProjection } from "./schedule";

export type Audience = "executive" | "client" | "internal";

export interface BriefSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface Brief {
  title: string;
  subtitle: string;
  sections: BriefSection[];
}

/** Clients with active projects, busiest first. */
export const clients = () => {
  const count = (c: string) => activeProjects().filter((p) => p.client === c).length;
  return [...new Set(activeProjects().map((p) => p.client))].sort((a, b) => count(b) - count(a) || a.localeCompare(b));
};

function driverOf(a: Attention): string {
  if (a.kind === "budget") return "scope-driven budget pressure";
  if (a.kind === "dependency") return "a cross-project dependency";
  const w = getWaitingItems().find(
    (x) => x.projectId === a.project.id && x.milestoneId && a.issue.startsWith(a.project.milestones.find((m) => m.id === x.milestoneId)!.name),
  );
  if (!w) return "production dependencies";
  if (w.waitingOn === "Vendor") return "a late vendor delivery";
  if (w.waitingOn === "Legal") return "a delayed legal review";
  if (w.kind === "access") return "a client-side technical dependency";
  return "delayed client approvals";
}

/* ------------------------------------------------------------------ */

function executiveBrief(): Brief {
  const k = portfolioKpis();
  const attention = needsAttention();
  const flagged = attention.filter((a) => a.project.status !== "on-track");
  const drivers = [...new Set(flagged.map(driverOf))];
  const declining = activeProjects().filter((p) => {
    const t = projectHealth(p).trend;
    return t[t.length - 1] - t[0] <= -10;
  }).length;

  const overBudget = activeProjects()
    .map((p) => ({ p, v: budgetVariancePct(p) }))
    .filter((x) => x.v > 2)
    .sort((a, b) => b.v - a.v);

  const launches = upcomingLaunches(30);
  const decisionsDue = openDecisions().filter((d) => d.deadline <= endOfWeek());
  const conflicts = capacityConflicts();

  const nextActions = [
    ...flagged.map((a) => `${shortName(a.project.name)}: ${a.action}`),
    ...decisionsDue
      .filter((d) => d.ownerType === "Internal")
      .map((d) => `Resolve ${conflicts[0]?.role.name.toLowerCase() ?? "team"} capacity conflict: ${lowerFirst(d.decision)} (by ${formatDay(d.deadline)})`),
  ];

  return {
    title: "Executive portfolio brief",
    subtitle: `Week of ${formatDate(addBusinessDays(endOfWeek(), -4))} · Generated ${formatFull(SNAPSHOT_DATE)}`,
    sections: [
      {
        heading: "Portfolio summary",
        paragraphs: [
          `${k.onTrack} of ${k.active} active projects are on track. ${k.atRisk + k.blocked} need attention this week (${k.atRisk} at risk, ${k.blocked} blocked), driven mainly by ${listToSentence(drivers)}.`,
          `Average portfolio health is ${k.averageHealth}/100. ${plural(declining, "project has", "projects have")} declined by 10 or more points over three weeks.`,
        ],
      },
      {
        heading: "Top priorities",
        bullets: flagged.slice(0, 3).map((a) => `${a.project.name}: ${a.issue}. ${a.impact}.`),
      },
      {
        heading: "Budget",
        paragraphs: [
          `Active budget is ${money(k.budget)}, with ${money(k.spent)} (${Math.round((k.spent / k.budget) * 100)}%) spent to date. Forecast at completion is ${money(k.forecast)} (${signedPct(k.variancePct)}).`,
          overBudget.length
            ? `Forecast overruns are concentrated in ${listToSentence(overBudget.map((x) => `${shortName(x.p.name)} (${signedPct(x.v)})`))}. All other projects are forecast within budget.`
            : "No material budget overruns are currently forecast.",
        ],
      },
      {
        heading: "Upcoming milestones",
        paragraphs: [`${plural(launches.length, "launch is", "launches are")} scheduled in the next 30 days.`],
        bullets: launches.map(
          (l) =>
            `${formatDay(l.planned)}: ${l.project.name}${l.slip > 0 ? ` (now projected ${formatDate(l.projected)})` : l.health.band === "Healthy" ? " (on track)" : ` (${l.health.band.toLowerCase()})`}`,
        ),
      },
      {
        heading: "Decisions required",
        paragraphs: [`${plural(decisionsDue.length, "stakeholder decision is", "stakeholder decisions are")} due by ${formatDay(endOfWeek())}.`],
        bullets: decisionsDue.map((d) => `${d.decision} (${orgOf(d.owner)}, by ${formatDay(d.deadline)})`),
      },
      { heading: "Next actions", bullets: nextActions },
    ],
  };
}

/* ------------------------------------------------------------------ */

const CLIENT_STATUS: Record<string, { label: string; phrase: string }> = {
  "on-track": { label: "On track", phrase: "on track" },
  "at-risk": { label: "At risk, action needed this week", phrase: "at risk" },
  blocked: { label: "Paused, waiting on your input", phrase: "waiting on your input" },
};

function clientBrief(client: string): Brief {
  const projects = activeProjects().filter((p) => p.client === client);
  const horizon = addBusinessDays(SNAPSHOT_DATE, 10);

  const sections: BriefSection[] = [
    {
      heading: "Summary",
      paragraphs: [
        `${plural(projects.length, "active project")} for ${client}. ${listToSentence(
          projects.map((p) => `${p.name} is ${CLIENT_STATUS[p.status].phrase}`),
        )}.`,
      ],
    },
  ];

  for (const p of projects) {
    const projection = currentProjection(p);
    const needs = getWaitingItems().filter((w) => w.projectId === p.id && (w.waitingOn === "Client" || w.waitingOn === "Legal"));
    const decisions = openDecisions(p.id).filter((d) => d.ownerType === "Client");
    const comingUp = p.milestones.filter((m) => !m.completed && m.start > SNAPSHOT_DATE && m.start <= horizon);
    const launchLine =
      projection.launchSlip > 0
        ? `Launch: planned ${formatDay(projection.launchPlanned)}, now projected ${formatDay(projection.launchProjected)} until the items below are resolved.`
        : `Launch: ${formatDay(projection.launchPlanned)}, on schedule.`;

    sections.push({
      heading: p.name,
      paragraphs: [
        `Status: ${CLIENT_STATUS[p.status].label}. Progress ${progressOf(p)}%, currently in ${lowerFirst(currentPhase(p))}.`,
        launchLine,
        `Budget: ${money(p.spent)} of ${money(p.budget)} used to date.`,
      ],
      bullets: [
        ...needs.map((w) => `We need: ${lowerFirst(w.item)} by ${formatDay(w.deadline)}${w.deadline < SNAPSHOT_DATE ? " (overdue)" : ""}`),
        ...decisions.map((d) => `Decision needed by ${formatDay(d.deadline)}: ${lowerFirst(d.decision)}. If delayed: ${lowerFirst(d.impactIfDelayed)}`),
        ...comingUp.map((m) => `Coming up: ${m.name}, ${formatDay(m.start)}`),
      ],
    });
  }

  return {
    title: `Status update for ${client}`,
    subtitle: `Prepared ${formatFull(SNAPSHOT_DATE)}`,
    sections,
  };
}

/* ------------------------------------------------------------------ */

function internalBrief(): Brief {
  const k = portfolioKpis();
  const projects = activeProjects()
    .map((p) => ({ p, h: projectHealth(p) }))
    .sort((a, b) => a.h.score - b.h.score);
  const attentionById = new Map(needsAttention().map((a) => [a.project.id, a]));
  const projectName = (id: string) => getProjects().find((p) => p.id === id)!.name;

  const chase = getWaitingItems()
    .filter(isOverdueWaiting)
    .sort((a, b) => daysWaiting(b) - daysWaiting(a));
  const risks = getRisks()
    .filter((r) => isActiveRisk(r) && ["Critical", "High"].includes(riskSeverity(r)))
    .sort((a, b) => b.probability * b.impact - a.probability * a.impact);

  return {
    title: "Internal team status",
    subtitle: `Delivery stand-up notes · ${formatFull(SNAPSHOT_DATE)}`,
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          `${k.active} active projects: ${k.onTrack} on track, ${k.atRisk} at risk, ${k.blocked} blocked. Average health ${k.averageHealth}. ${k.waiting} items waiting on others (${chase.length} overdue). ${k.pendingApprovals} approvals pending.`,
        ],
      },
      {
        heading: "Project status (lowest health first)",
        bullets: projects.map(({ p, h }) => {
          const a = attentionById.get(p.id);
          const next = nextMilestone(p);
          return `${p.name} · ${p.owner} · ${h.score} ${h.band} · ${currentPhase(p)}.${a ? ` ${a.issue}.` : ""}${next ? ` Next: ${next.name} ${formatDate(next.start)}.` : ""}`;
        }),
      },
      {
        heading: "Chase list",
        bullets: chase.map(
          (w) =>
            `${shortName(projectName(w.projectId))}: ${w.item} (${w.owner}). ${daysWaiting(w)} business days waiting${w.deadline < SNAPSHOT_DATE ? `, ${businessDaysBetween(w.deadline, SNAPSHOT_DATE)} past deadline` : ""}. Escalation: ${w.escalation === "none" ? "not yet" : w.escalation}.`,
        ),
      },
      { heading: "Capacity", bullets: capacityConflicts().map((c) => c.insight) },
      {
        heading: "Risks to review",
        bullets: risks.map((r) => `${shortName(projectName(r.projectId))}: ${r.title} (${riskSeverity(r)}, ${r.owner}). ${r.mitigation.split(". ")[0].replace(/\.$/, "")}.`),
      },
      {
        heading: "Open decisions",
        bullets: openDecisions().map((d) => {
          const days = calendarDaysBetween(SNAPSHOT_DATE, d.deadline);
          return `${d.decision} (${d.owner}, ${days <= 0 ? "due today" : `due ${formatDay(d.deadline)}`})`;
        }),
      },
    ],
  };
}

export function generateBrief(audience: Audience, client?: string): Brief {
  if (audience === "client") return clientBrief(client ?? clients()[0]);
  if (audience === "internal") return internalBrief();
  return executiveBrief();
}

export function briefToText(brief: Brief): string {
  const lines = [brief.title.toUpperCase(), brief.subtitle, ""];
  for (const s of brief.sections) {
    lines.push(s.heading.toUpperCase());
    s.paragraphs?.forEach((p) => lines.push(p));
    s.bullets?.forEach((b) => lines.push(`- ${b}`));
    lines.push("");
  }
  return lines.join("\n").trim();
}
