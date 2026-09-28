export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="0.5" y="0.5" width="23" height="23" rx="6" fill="var(--fg)" />
      <path
        d="M5 14.5h3l2-5 3.2 8 2.3-5.5H19"
        fill="none"
        stroke="var(--bg)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark className="size-6" />
      <span className="text-[15px] font-semibold tracking-[-0.015em] text-fg">ProjectSignal</span>
    </span>
  );
}
