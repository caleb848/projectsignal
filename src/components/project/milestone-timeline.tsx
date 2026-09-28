import { SNAPSHOT_DATE } from "@/lib/config";
import { calendarDaysBetween, formatDate, toDate, toISO } from "@/lib/dates";
import { currentProjection, milestoneStates } from "@/lib/schedule";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { STATE_META, STATE_ORDER } from "./milestone-states";

/**
 * Gantt-style milestone view. Ghost outline = original plan; solid bar =
 * current projection. Colour and a text label both carry the state.
 */
export function MilestoneTimeline({ project }: { project: Project }) {
  const projection = currentProjection(project);
  const states = milestoneStates(project);
  const first = project.milestones[0].start;
  const last = [projection.launchProjected, projection.launchPlanned].sort().at(-1)!;
  const start = toISO(new Date(toDate(first).getTime() - 2 * 86_400_000));
  const span = calendarDaysBetween(start, last) + Math.max(6, Math.round(calendarDaysBetween(start, last) * 0.1));
  const x = (iso: string) => (calendarDaysBetween(start, iso) / span) * 100;
  const w = (a: string, b: string) => ((calendarDaysBetween(a, b) + 1) / span) * 100;

  // Monday ticks, thinned so labels never collide.
  const mondays: string[] = [];
  for (let d = toDate(start); toISO(d) <= last; d = new Date(d.getTime() + 86_400_000)) {
    if (d.getUTCDay() === 1) mondays.push(toISO(d));
  }
  const step = Math.ceil(mondays.length / 9);
  const ticks = mondays.filter((_, i) => i % step === 0);
  const usedStates = STATE_ORDER.filter((s) => Object.values(states).includes(s));
  const showToday = SNAPSHOT_DATE >= start && SNAPSHOT_DATE <= last;

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px] pb-6">
          <div className="grid grid-cols-[220px_1fr] border-b border-border pb-1.5 text-[11px] text-subtle">
            <span>Milestone</span>
            <div className="relative h-4">
              {ticks.map((t) => (
                <span key={t} className="tabular absolute -translate-x-1/2" style={{ left: `${x(t)}%` }}>
                  {formatDate(t)}
                </span>
              ))}
            </div>
          </div>
          <ul className="relative">
            {project.milestones.map((m) => {
              const pm = projection.byId[m.id];
              const state = states[m.id];
              const meta = STATE_META[state];
              const moved = pm.start !== m.start || pm.end !== m.end;
              return (
                <li key={m.id} className="grid grid-cols-[220px_1fr] items-center border-b border-border/60 py-2 last:border-0">
                  <div className="min-w-0 pr-4">
                    <p className="truncate text-[13px] text-fg">{m.name}</p>
                    <p className={cn("text-[11.5px]", meta.text)}>
                      {meta.label}
                      {state !== "complete" && m.kind !== "launch" && (
                        <span className="text-subtle"> · {formatDate(pm.start)}–{formatDate(pm.end)}</span>
                      )}
                      {pm.compressed && <span className="text-subtle"> · {pm.plannedDays}→{pm.days}d</span>}
                    </p>
                  </div>
                  <div className="relative h-6">
                    {ticks.map((t) => (
                      <span key={t} className="absolute inset-y-[-8px] w-px bg-grid" style={{ left: `${x(t)}%` }} aria-hidden />
                    ))}
                    {m.kind === "launch" ? (
                      <>
                        {moved && (
                          <span
                            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-dashed border-border-strong"
                            style={{ left: `${x(m.start)}%` }}
                            title={`Planned ${formatDate(m.start)}`}
                          />
                        )}
                        <span
                          className={cn("absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px]", state === "impacted" ? "bg-critical" : m.completed ? "bg-fg/40" : "bg-fg")}
                          style={{ left: `${x(pm.start)}%` }}
                          title={`${m.name}: ${formatDate(pm.start)}`}
                        />
                        <span className="tabular absolute top-1/2 ml-3 -translate-y-1/2 text-[11.5px] font-medium whitespace-nowrap text-fg" style={{ left: `${x(pm.start)}%` }}>
                          {formatDate(pm.start)}
                          {moved && <span className="text-critical-fg"> (was {formatDate(m.start)})</span>}
                        </span>
                      </>
                    ) : (
                      <>
                        {moved && (
                          <span
                            className="absolute top-1/2 h-3 -translate-y-1/2 rounded-[3px] border border-dashed border-border-strong"
                            style={{ left: `${x(m.start)}%`, width: `${w(m.start, m.end)}%` }}
                            title={`Planned ${formatDate(m.start)}–${formatDate(m.end)}`}
                          />
                        )}
                        <span
                          className={cn("absolute top-1/2 h-3 -translate-y-1/2 rounded-[3px]", meta.bar)}
                          style={{ left: `${x(pm.start)}%`, width: `${Math.max(w(pm.start, pm.end), 0.8)}%`, opacity: moved ? 0.9 : 1 }}
                          title={`${m.name}: ${formatDate(pm.start)}–${formatDate(pm.end)} (${meta.label})`}
                        />
                      </>
                    )}
                  </div>
                </li>
              );
            })}
            {showToday && (
              <li aria-hidden className="pointer-events-none absolute inset-y-0 right-0 left-[220px]">
                <span className="absolute inset-y-0 w-px bg-accent" style={{ left: `${x(SNAPSHOT_DATE)}%` }} />
                <span
                  className="absolute -bottom-5 -translate-x-1/2 rounded-sm bg-accent px-1 text-[10px] font-medium text-white"
                  style={{ left: `${x(SNAPSHOT_DATE)}%` }}
                >
                  Today
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-subtle">
        {usedStates.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2 w-3 rounded-[2px]", STATE_META[s].bar)} />
            {STATE_META[s].label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-[2px] border border-dashed border-border-strong" />
          Original plan
        </span>
      </div>
    </div>
  );
}
