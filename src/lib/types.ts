/**
 * Domain types for ProjectSignal.
 *
 * Mock data in `src/data` conforms to these types. Anything that can be
 * derived (progress, current phase, health score, milestone state, schedule
 * impact) is deliberately NOT stored — it is calculated in `src/lib` so the
 * dashboard stays internally consistent when the data changes.
 */

/** Calendar date in `YYYY-MM-DD` form. */
export type ISODate = string;
/** Date-time in `YYYY-MM-DDTHH:mm` form. */
export type ISODateTime = string;

export type ProjectStatus = "on-track" | "at-risk" | "blocked" | "completed";

export type ProjectType =
  | "Integrated Campaign"
  | "Product Launch"
  | "Social Campaign"
  | "Website"
  | "Video Production"
  | "Paid Media"
  | "Brand Identity"
  | "Content Series"
  | "Landing Pages"
  | "Event Campaign"
  | "CRM / Lifecycle"
  | "Creative Refresh";

export type MilestoneKind = "work" | "approval" | "delivery" | "qa" | "launch";

export interface Milestone {
  id: string;
  name: string;
  kind: MilestoneKind;
  /** Planned start (business day). */
  start: ISODate;
  /** Planned end (business day, inclusive). */
  end: ISODate;
  completed?: boolean;
  /**
   * Ids of milestones in the same project that must finish first.
   * Defaults to the previous milestone in the list. Use `[]` for none.
   */
  dependsOn?: string[];
  /** A milestone in another project that must finish first. */
  external?: { projectId: string; milestoneId: string };
  /**
   * Marks a window that can be compressed when upstream work slips
   * (typically QA). The value is the minimum acceptable length in business days.
   */
  minDays?: number;
  owner?: string;
}

export type Rating = "good" | "watch" | "concern";

export interface Assessment {
  rating: Rating;
  note: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  type: ProjectType;
  owner: string;
  /** Status as set by the PM. The calculated health score sits alongside it. */
  status: ProjectStatus;
  objective: string;
  budget: number;
  spent: number;
  /** Estimate at completion. */
  forecast: number;
  teamSize: number;
  deliverables: number;
  /** PM-assessed dimensions that are not calculated from data. */
  scope: Assessment;
  quality: Assessment;
  /** Milestones in dependency order. Exactly one must have kind "launch". */
  milestones: Milestone[];
  /** Health scores from the three previous weekly snapshots, oldest first. */
  healthHistory: number[];
}

export type RiskCategory =
  | "Timeline"
  | "Budget"
  | "Approval"
  | "Resource"
  | "Vendor"
  | "Scope"
  | "Production"
  | "Technical";

/** 1 = Low, 2 = Medium, 3 = High */
export type Level = 1 | 2 | 3;

export interface Risk {
  id: string;
  projectId: string;
  title: string;
  category: RiskCategory;
  probability: Level;
  impact: Level;
  owner: string;
  /** What happens if the risk materialises. */
  consequence: string;
  mitigation: string;
  status: "open" | "monitoring" | "resolved";
  raised: ISODate;
  resolved?: ISODate;
  resolution?: string;
}

export type WaitingOn = "Client" | "Vendor" | "Legal" | "Internal";

export interface WaitingItem {
  id: string;
  projectId: string;
  waitingOn: WaitingOn;
  kind: "approval" | "delivery" | "input" | "access";
  item: string;
  owner: string;
  requested: ISODate;
  deadline: ISODate;
  impact: "high" | "medium" | "low";
  escalation: "none" | "reminder" | "escalated" | "sponsor";
  /** The milestone this item gates, if any. */
  milestoneId?: string;
}

export interface Decision {
  id: string;
  projectId: string;
  decision: string;
  context: string;
  options?: string[];
  owner: string;
  ownerType: "Client" | "Internal";
  deadline: ISODate;
  impactIfDelayed: string;
  status: "open" | "decided";
  outcome?: string;
}

export type ActivityType =
  | "feedback"
  | "timeline"
  | "delivery"
  | "budget"
  | "approval-requested"
  | "approval-received"
  | "risk-escalated"
  | "risk-resolved"
  | "scope"
  | "decision";

export interface Activity {
  id: string;
  projectId: string;
  at: ISODateTime;
  type: ActivityType;
  text: string;
  actor: string;
}

export interface Role {
  id: string;
  name: string;
  headcount: number;
  /** Productive hours per person per week. */
  hoursPerPerson: number;
}

export interface Allocation {
  projectId: string;
  roleId: string;
  /** Planned hours for each week in `CAPACITY_WEEKS`. */
  hours: number[];
}
