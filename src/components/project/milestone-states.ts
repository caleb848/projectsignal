import type { MilestoneState } from "@/lib/schedule";

export const STATE_META: Record<
  MilestoneState,
  { label: string; bar: string; dot: string; text: string }
> = {
  complete: { label: "Complete", bar: "bg-fg/25", dot: "bg-fg/40", text: "text-subtle" },
  "in-progress": { label: "In progress", bar: "bg-accent", dot: "bg-accent", text: "text-accent-fg" },
  overdue: { label: "Delayed", bar: "bg-critical", dot: "bg-critical", text: "text-critical-fg" },
  waiting: { label: "Waiting on dependency", bar: "bg-serious", dot: "bg-serious", text: "text-serious-fg" },
  impacted: { label: "Impacted downstream", bar: "bg-warn", dot: "bg-warn", text: "text-warn-fg" },
  upcoming: { label: "Upcoming", bar: "bg-surface-3 ring-1 ring-inset ring-border-strong", dot: "bg-border-strong", text: "text-muted" },
};

export const STATE_ORDER: MilestoneState[] = ["complete", "in-progress", "overdue", "waiting", "impacted", "upcoming"];
