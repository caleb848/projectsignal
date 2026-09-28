import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  GitBranch,
  MessageSquare,
  PackageCheck,
  Scale,
  Send,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { getProject } from "@/data";
import { formatDateTime } from "@/lib/dates";
import type { Activity, ActivityType } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<ActivityType, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  feedback: { icon: MessageSquare, className: "text-muted" },
  timeline: { icon: CalendarClock, className: "text-muted" },
  delivery: { icon: PackageCheck, className: "text-muted" },
  budget: { icon: CircleDollarSign, className: "text-muted" },
  "approval-requested": { icon: Send, className: "text-muted" },
  "approval-received": { icon: CheckCircle2, className: "text-good-fg" },
  "risk-escalated": { icon: TriangleAlert, className: "text-serious-fg" },
  "risk-resolved": { icon: ShieldCheck, className: "text-good-fg" },
  scope: { icon: GitBranch, className: "text-warn-fg" },
  decision: { icon: Scale, className: "text-accent-fg" },
};

export function ActivityFeed({ items, showProject = true }: { items: Activity[]; showProject?: boolean }) {
  return (
    <ol className="relative">
      {items.map((a, i) => {
        const { icon: Icon, className } = ICONS[a.type];
        const project = getProject(a.projectId);
        return (
          <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
            {i < items.length - 1 && <span className="absolute top-7 bottom-0 left-[13px] w-px bg-border" aria-hidden />}
            <span className="relative z-10 flex size-[27px] shrink-0 items-center justify-center rounded-full border border-border bg-surface">
              <Icon className={cn("size-3.5", className)} aria-hidden />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[13px] leading-snug text-fg">{a.text}</p>
              <p className="mt-0.5 text-[12px] text-subtle">
                {showProject && project && (
                  <>
                    <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-0.5 hover:text-fg">
                      {project.name}
                      <ArrowUpRight className="size-3" aria-hidden />
                    </Link>
                    {" · "}
                  </>
                )}
                {a.actor} · {formatDateTime(a.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
