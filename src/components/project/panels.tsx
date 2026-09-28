import { CheckCircle2, Clock, Scale } from "lucide-react";
import { EmptyState } from "@/components/ui/card";
import { Badge, EscalationBadge, ImpactBadge, RATING_LABEL, RATING_TONE, toneDot, toneText } from "@/components/ui/status";
import { SNAPSHOT_DATE } from "@/lib/config";
import { businessDaysBetween, formatDay } from "@/lib/dates";
import { daysWaiting, isOverdueWaiting, type HealthResult } from "@/lib/health";
import type { Decision, WaitingItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function HealthDimensions({ dimensions }: { dimensions: HealthResult["dimensions"] }) {
  return (
    <ul className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {dimensions.map((d) => {
        const tone = RATING_TONE[d.rating];
        return (
          <li key={d.key} className="bg-surface px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12.5px] font-medium text-fg">{d.label}</span>
              <span className={cn("inline-flex items-center gap-1.5 text-[11.5px] font-medium", toneText(tone))}>
                <span className={cn("size-1.5 rounded-full", toneDot(tone))} aria-hidden />
                {RATING_LABEL[d.rating]}
              </span>
            </div>
            <p className="mt-1 text-[12px] leading-snug text-subtle">{d.note}</p>
          </li>
        );
      })}
    </ul>
  );
}

export function ScoreBreakdown({ health }: { health: HealthResult }) {
  return (
    <div>
      <ul className="space-y-2.5">
        {health.factors.map((f) => (
          <li key={f.key}>
            <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
              <span className="text-fg">{f.label}</span>
              <span className={cn("tabular font-medium", f.points ? "text-critical-fg" : "text-subtle")}>
                {f.points ? `−${f.points}` : "0"}
                <span className="font-normal text-subtle"> / {f.max}</span>
              </span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-critical/70" style={{ width: `${(f.points / f.max) * 100}%` }} />
            </div>
            <p className="mt-1 text-[11.5px] text-subtle">{f.detail}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3 text-[13px]">
        <span className="text-muted">100 − {100 - health.score} deductions</span>
        <span className="tabular font-semibold text-fg">= {health.score}</span>
      </div>
    </div>
  );
}

/** Four-point health trend as an inline SVG line. */
export function TrendSparkline({ values, labels }: { values: number[]; labels: string[] }) {
  const w = 240;
  const h = 64;
  const pad = 8;
  const min = Math.min(40, ...values);
  const pts = values.map((v, i) => [pad + (i * (w - pad * 2)) / (values.length - 1), pad + ((100 - v) / (100 - min)) * (h - pad * 2)]);
  const falling = values.at(-1)! < values[0];
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" role="img" aria-label={`Health trend: ${values.join(", ")}`}>
        {[75, 50].filter((t) => t > min).map((t) => {
          const y = pad + ((100 - t) / (100 - min)) * (h - pad * 2);
          return <line key={t} x1={0} x2={w} y1={y} y2={y} stroke="var(--grid)" strokeDasharray="2 3" />;
        })}
        <polyline
          points={pts.map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke={falling ? "var(--critical)" : "var(--good)"}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 4 : 3} fill="var(--surface)" stroke={falling ? "var(--critical)" : "var(--good)"} strokeWidth={2} />
        ))}
      </svg>
      <figcaption className="mt-1 flex justify-between text-[11px] text-subtle">
        {labels.map((l, i) => (
          <span key={l} className="tabular">
            {l} <span className="font-medium text-muted">{values[i]}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

export function DecisionList({ decisions }: { decisions: Decision[] }) {
  if (!decisions.length) {
    return <EmptyState icon={Scale} title="No decisions outstanding" description="Nothing is waiting on a stakeholder decision." />;
  }
  return (
    <ul className="divide-y divide-border">
      {decisions.map((d) => {
        const daysLeft = businessDaysBetween(SNAPSHOT_DATE, d.deadline);
        return (
          <li key={d.id} className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-[13.5px] font-medium text-fg">{d.decision}</p>
              {d.status === "decided" ? (
                <Badge tone="good">Decided</Badge>
              ) : (
                <Badge tone={daysLeft <= 1 ? "critical" : daysLeft <= 3 ? "warn" : "neutral"}>
                  Due {formatDay(d.deadline)}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-[12.5px] text-muted">{d.context}</p>
            {d.options && d.status === "open" && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {d.options.map((o) => (
                  <span key={o} className="rounded-[5px] border border-border px-1.5 py-0.5 text-[11.5px] text-muted">{o}</span>
                ))}
              </div>
            )}
            <dl className="mt-2.5 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-[12.5px]">
              <dt className="text-subtle">Owner</dt>
              <dd className="text-fg">{d.owner}</dd>
              {d.status === "decided" ? (
                <>
                  <dt className="text-subtle">Outcome</dt>
                  <dd className="text-fg">{d.outcome}</dd>
                </>
              ) : (
                <>
                  <dt className="text-subtle">If delayed</dt>
                  <dd className="text-fg">{d.impactIfDelayed}</dd>
                </>
              )}
            </dl>
          </li>
        );
      })}
    </ul>
  );
}

export function WaitingList({ items }: { items: WaitingItem[] }) {
  if (!items.length) {
    return <EmptyState icon={CheckCircle2} title="Nothing waiting on others" description="No approvals, deliveries or inputs outstanding." />;
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((w) => {
        const days = daysWaiting(w);
        const overdue = isOverdueWaiting(w);
        return (
          <li key={w.id} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-fg">{w.item}</p>
              <p className="text-[12px] text-subtle">
                {w.waitingOn} · {w.owner} · due {formatDay(w.deadline)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn("tabular inline-flex items-center gap-1 text-[12.5px]", overdue ? "font-medium text-critical-fg" : "text-muted")}>
                <Clock className="size-3.5" aria-hidden />
                {days}d waiting
              </span>
              <ImpactBadge impact={w.impact} />
              <EscalationBadge level={w.escalation} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
