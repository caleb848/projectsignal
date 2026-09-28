import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/card";
import { HealthScore, StatusBadge } from "@/components/ui/status";
import { formatDate } from "@/lib/dates";
import type { Attention } from "@/lib/portfolio";
import { CheckCircle2 } from "lucide-react";

export function AttentionList({ items }: { items: Attention[] }) {
  if (!items.length) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Nothing needs attention"
        description="Every active project is healthy. Routine monitoring only."
      />
    );
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((a) => {
        const p = a.health.timeline.projection;
        return (
          <li key={a.project.id}>
            <Link
              href={`/projects/${a.project.id}`}
              className="group block px-5 py-4 transition-colors hover:bg-surface-2/60"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <HealthScore score={a.health.score} band={a.health.band} showBand={false} />
                <span className="text-[14px] font-semibold text-fg">{a.project.name}</span>
                <StatusBadge status={a.project.status} />
                <span className="ml-auto text-[12px] text-subtle">
                  {p.launchSlip > 0 ? (
                    <>
                      Launch <s>{formatDate(p.launchPlanned)}</s>{" "}
                      <span className="font-medium text-critical-fg">{formatDate(p.launchProjected)}</span>
                    </>
                  ) : (
                    <>Launch {formatDate(p.launchPlanned)}</>
                  )}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-[64px_1fr] gap-x-3 gap-y-1.5 text-[13px] leading-snug sm:pl-9">
                <dt className="text-subtle">Issue</dt>
                <dd className="text-fg">{a.issue}</dd>
                <dt className="text-subtle">Impact</dt>
                <dd className="text-muted">{a.impact}</dd>
                <dt className="text-subtle">Action</dt>
                <dd className="flex items-start gap-1.5 font-medium text-fg">
                  <ArrowRight className="mt-[3px] size-3.5 shrink-0 text-accent" aria-hidden />
                  {a.action}
                </dd>
              </dl>
              {a.signals.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 sm:pl-9">
                  {a.signals.map((s) => (
                    <span key={s} className="rounded-[5px] border border-border px-1.5 py-0.5 text-[11.5px] text-subtle">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
