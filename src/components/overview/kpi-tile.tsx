import Link from "next/link";
import { cn } from "@/lib/utils";
import { toneDot, type Tone } from "@/components/ui/status";

export function KpiTile({
  label,
  value,
  sub,
  tone,
  href,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: Tone;
  href?: string;
}) {
  const body = (
    <>
      <p className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
        {tone && <span className={cn("size-1.5 rounded-full", toneDot(tone))} aria-hidden />}
        {label}
      </p>
      <p className="mt-2 text-[26px] leading-none font-semibold tracking-[-0.02em] text-fg">{value}</p>
      {sub && <p className="mt-2 truncate text-[12px] text-subtle">{sub}</p>}
    </>
  );
  const className =
    "block rounded-lg border border-border bg-surface px-4 py-3.5 shadow-card transition-colors";
  return href ? (
    <Link href={href} className={cn(className, "hover:border-border-strong")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
