import { getProjects, getRisks, getWaitingItems } from "@/data";
import { isActiveRisk, projectHealth, riskSeverity, type HealthBand, type RiskSeverity } from "./health";
import { currentPhase, progressOf } from "./project";
import { currentProjection } from "./schedule";
import type { ISODate, ProjectStatus, ProjectType } from "./types";

/** Flat, serialisable project summary for tables and filters. */
export interface ProjectRow {
  id: string;
  name: string;
  client: string;
  type: ProjectType;
  owner: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  spent: number;
  forecast: number;
  launch: ISODate;
  launchProjected: ISODate;
  phase: string;
  pendingApprovals: number;
  openRisks: number;
  riskLevel: RiskSeverity | "None";
  score: number;
  band: HealthBand;
}

const ORDER: RiskSeverity[] = ["Critical", "High", "Medium", "Low"];

export function projectRows(): ProjectRow[] {
  return getProjects().map((p) => {
    const risks = getRisks().filter((r) => r.projectId === p.id && isActiveRisk(r));
    const health = projectHealth(p);
    const projection = currentProjection(p);
    const top = ORDER.find((s) => risks.some((r) => riskSeverity(r) === s));
    return {
      id: p.id,
      name: p.name,
      client: p.client,
      type: p.type,
      owner: p.owner,
      status: p.status,
      progress: progressOf(p),
      budget: p.budget,
      spent: p.spent,
      forecast: p.forecast,
      launch: projection.launchPlanned,
      launchProjected: projection.launchProjected,
      phase: currentPhase(p),
      pendingApprovals: getWaitingItems().filter((w) => w.projectId === p.id && w.kind === "approval").length,
      openRisks: risks.length,
      riskLevel: top ?? "None",
      score: health.score,
      band: health.band,
    };
  });
}
