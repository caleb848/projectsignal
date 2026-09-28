import { getProject } from "@/data";
import { formatDate } from "@/lib/dates";
import { currentProjection, depsOf, downstreamOf, milestoneStates, type MilestoneState } from "@/lib/schedule";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { STATE_META } from "./milestone-states";

const W = 216;
const H = 52;
const GAP_X = 16;
const GAP_Y = 28;

const ACTIVE_DELAY: MilestoneState[] = ["overdue", "waiting", "impacted"];

/**
 * Milestone dependency graph, top to bottom. Milestones sit on rows by
 * dependency depth; parallel workstreams share a row. Edges carrying a delay
 * downstream are drawn in red so the knock-on effect is visible at a glance.
 */
export function DependencyGraph({ project }: { project: Project }) {
  const states = milestoneStates(project);
  const projection = currentProjection(project);
  const delayed = project.milestones.filter((m) => states[m.id] === "overdue").map((m) => m.id);
  const inDelayPath = new Set(delayed.flatMap((id) => [id, ...downstreamOf(project, id)]));

  const level: Record<string, number> = {};
  project.milestones.forEach((m, i) => {
    const deps = depsOf(project, i);
    level[m.id] = deps.length ? 1 + Math.max(...deps.map((d) => level[d])) : 0;
  });
  const rows: string[][] = [];
  project.milestones.forEach((m) => (rows[level[m.id]] ??= []).push(m.id));
  const maxPerRow = Math.max(...rows.map((r) => r.length));
  const width = maxPerRow * W + (maxPerRow - 1) * GAP_X;
  const height = rows.length * H + (rows.length - 1) * GAP_Y;

  const pos: Record<string, { x: number; y: number }> = {};
  rows.forEach((row, r) => {
    const rowWidth = row.length * W + (row.length - 1) * GAP_X;
    row.forEach((id, i) => {
      pos[id] = { x: (width - rowWidth) / 2 + i * (W + GAP_X), y: r * (H + GAP_Y) };
    });
  });

  const edges = project.milestones.flatMap((m, i) =>
    depsOf(project, i).map((d) => ({
      from: d,
      to: m.id,
      hot: inDelayPath.has(d) && inDelayPath.has(m.id) && ACTIVE_DELAY.includes(states[m.id]),
    })),
  );

  return (
    <div className="overflow-x-auto">
      <div className="relative mx-auto" style={{ width, height }}>
        <svg width={width} height={height} className="absolute inset-0" aria-hidden>
          <defs>
            {(["hot", "cold"] as const).map((k) => (
              <marker key={k} id={`arrow-${k}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0L8 4L0 8z" fill={k === "hot" ? "var(--critical)" : "var(--border-strong)"} />
              </marker>
            ))}
          </defs>
          {edges.map((e) => {
            const a = pos[e.from];
            const b = pos[e.to];
            const x1 = a.x + W / 2;
            const y1 = a.y + H;
            const x2 = b.x + W / 2;
            const y2 = b.y - 1;
            const mid = (y1 + y2) / 2;
            return (
              <path
                key={`${e.from}-${e.to}`}
                d={`M${x1} ${y1} C${x1} ${mid} ${x2} ${mid} ${x2} ${y2}`}
                fill="none"
                stroke={e.hot ? "var(--critical)" : "var(--border-strong)"}
                strokeWidth={e.hot ? 2 : 1.25}
                strokeDasharray={e.hot ? "4 3" : undefined}
                markerEnd={`url(#arrow-${e.hot ? "hot" : "cold"})`}
              />
            );
          })}
        </svg>
        {project.milestones.map((m) => {
          const state = states[m.id];
          const meta = STATE_META[state];
          const pm = projection.byId[m.id];
          const ext = m.external && getProject(m.external.projectId);
          return (
            <div
              key={m.id}
              className={cn(
                "absolute flex overflow-hidden rounded-md border bg-surface text-left",
                state === "overdue" ? "border-critical/60" : "border-border",
                state === "complete" && "opacity-70",
              )}
              style={{ left: pos[m.id].x, top: pos[m.id].y, width: W, height: H }}
              title={`${m.name}: ${meta.label}${ext ? ` · depends on ${ext.name}` : ""}`}
            >
              <span className={cn("w-1 shrink-0", meta.dot)} aria-hidden />
              <span className="min-w-0 px-2.5 py-1.5">
                <span className="block truncate text-[12.5px] font-medium text-fg">{m.name}</span>
                <span className={cn("block truncate text-[11px]", meta.text)}>
                  {meta.label}
                  <span className="text-subtle">
                    {" · "}
                    {m.kind === "launch" ? formatDate(pm.start) : `${formatDate(pm.start)}–${formatDate(pm.end)}`}
                  </span>
                </span>
                {ext && (
                  <span className="sr-only">Depends on {ext.name}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {project.milestones.some((m) => m.external) && (
        <p className="mt-4 text-center text-[12px] text-muted">
          {project.milestones
            .filter((m) => m.external)
            .map((m) => {
              const other = getProject(m.external!.projectId)!;
              const otherPm = currentProjection(other).byId[m.external!.milestoneId];
              return `${m.name} also depends on ${other.name} (${otherPm.milestone.name.toLowerCase()}, projected ${formatDate(otherPm.end)}).`;
            })
            .join(" ")}
        </p>
      )}
    </div>
  );
}
