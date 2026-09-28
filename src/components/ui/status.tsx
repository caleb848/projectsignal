import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Eye,
  OctagonAlert,
  CircleCheckBig,
  Minus,
} from "lucide-react";
import type { HealthBand, RiskSeverity } from "@/lib/health";
import { STATUS_LABEL } from "@/lib/project";
import type { ProjectStatus, Rating, WaitingItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/*
 * Status vocabulary. Four tones map to the reserved status colours; every
 * badge carries an icon + text so meaning never depends on colour alone.
 */
export type Tone = "good" | "warn" | "serious" | "critical" | "neutral" | "accent";

const TONE: Record<Tone, { text: string; bg: string; dot: string }> = {
  good: { text: "text-good-fg", bg: "bg-good-soft", dot: "bg-good" },
  warn: { text: "text-warn-fg", bg: "bg-warn-soft", dot: "bg-warn" },
  serious: { text: "text-serious-fg", bg: "bg-serious-soft", dot: "bg-serious" },
  critical: { text: "text-critical-fg", bg: "bg-critical-soft", dot: "bg-critical" },
  neutral: { text: "text-muted", bg: "bg-surface-3", dot: "bg-subtle" },
  accent: { text: "text-accent-fg", bg: "bg-accent-soft", dot: "bg-accent" },
};

export const toneText = (t: Tone) => TONE[t].text;
export const toneDot = (t: Tone) => TONE[t].dot;

const TONE_ICON: Record<Tone, React.ComponentType<{ className?: string }>> = {
  good: CheckCircle2,
  warn: Eye,
  serious: AlertTriangle,
  critical: OctagonAlert,
  neutral: Minus,
  accent: CircleCheckBig,
};

export function Badge({
  tone = "neutral",
  icon = true,
  children,
  className,
}: {
  tone?: Tone;
  icon?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = TONE_ICON[tone];
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1 whitespace-nowrap rounded-[5px] px-1.5 text-[11.5px] font-medium",
        TONE[tone].bg,
        TONE[tone].text,
        className,
      )}
    >
      {icon && <Icon className="size-3" aria-hidden />}
      {children}
    </span>
  );
}

export const STATUS_TONE: Record<ProjectStatus, Tone> = {
  "on-track": "good",
  "at-risk": "serious",
  blocked: "critical",
  completed: "accent",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}

export const BAND_TONE: Record<HealthBand, Tone> = {
  Healthy: "good",
  Watch: "warn",
  "At Risk": "serious",
  Critical: "critical",
};

/** Compact score ring + number, with the band as text. */
export function HealthScore({
  score,
  band,
  size = "md",
  showBand = true,
}: {
  score: number;
  band: HealthBand;
  size?: "sm" | "md" | "lg";
  showBand?: boolean;
}) {
  const tone = BAND_TONE[band];
  const dims = { sm: 26, md: 30, lg: 56 }[size];
  const stroke = size === "lg" ? 5 : 3;
  const r = (dims - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="inline-flex items-center gap-2" title={`Health ${score}/100 · ${band}`}>
      <span className="relative inline-flex items-center justify-center" style={{ width: dims, height: dims }}>
        <svg width={dims} height={dims} className="-rotate-90" aria-hidden>
          <circle cx={dims / 2} cy={dims / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={r}
            fill="none"
            stroke={`var(--${tone})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * c} ${c}`}
          />
        </svg>
        <span
          className={cn(
            "absolute tabular font-semibold text-fg",
            size === "lg" ? "text-[18px]" : size === "md" ? "text-[10.5px]" : "text-[9.5px] tracking-[-0.03em]",
          )}
        >
          {score}
        </span>
      </span>
      {showBand && <span className={cn("text-[12.5px] font-medium", TONE[tone].text)}>{band}</span>}
    </span>
  );
}

export const RATING_TONE: Record<Rating, Tone> = { good: "good", watch: "warn", concern: "critical" };
export const RATING_LABEL: Record<Rating, string> = { good: "Good", watch: "Watch", concern: "Concern" };

export const SEVERITY_TONE: Record<RiskSeverity, Tone> = {
  Critical: "critical",
  High: "serious",
  Medium: "warn",
  Low: "neutral",
};

export function SeverityBadge({ severity }: { severity: RiskSeverity }) {
  return <Badge tone={SEVERITY_TONE[severity]}>{severity}</Badge>;
}

export const IMPACT_TONE: Record<WaitingItem["impact"], Tone> = {
  high: "critical",
  medium: "warn",
  low: "neutral",
};

export function ImpactBadge({ impact }: { impact: WaitingItem["impact"] }) {
  return <Badge tone={IMPACT_TONE[impact]}>{impact[0].toUpperCase() + impact.slice(1)}</Badge>;
}

const ESCALATION: Record<WaitingItem["escalation"], { label: string; tone: Tone }> = {
  none: { label: "Not escalated", tone: "neutral" },
  reminder: { label: "Reminder sent", tone: "neutral" },
  escalated: { label: "Escalated", tone: "serious" },
  sponsor: { label: "Sponsor escalation", tone: "critical" },
};

export function EscalationBadge({ level }: { level: WaitingItem["escalation"] }) {
  const e = ESCALATION[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12.5px]", level === "none" || level === "reminder" ? "text-muted" : TONE[e.tone].text)}>
      {level === "none" ? <CircleDashed className="size-3" aria-hidden /> : <span className={cn("size-1.5 rounded-full", TONE[e.tone].dot)} aria-hidden />}
      {e.label}
    </span>
  );
}

export function ProgressBar({ value, tone = "neutral", className }: { value: number; tone?: Tone; className?: string }) {
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full", tone === "neutral" ? "bg-fg/70" : TONE[tone].dot)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
