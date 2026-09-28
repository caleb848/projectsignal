"use client";

import { CalendarDays, Info } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SNAPSHOT_DATE } from "@/lib/config";
import { formatDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { CommandMenu } from "./command-menu";
import { Logo } from "./logo";
import { NAV, isActive } from "./nav";
import { ThemeToggle } from "./theme";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="ProjectSignal overview" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                isActive(pathname, item.href) ? "bg-surface-3 text-fg" : "text-muted hover:text-fg",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <span
            className="hidden items-center gap-1.5 pr-2 text-[12.5px] text-muted xl:inline-flex"
            title="All data is a fictional snapshot as of this date"
          >
            <CalendarDays className="size-3.5 text-subtle" aria-hidden />
            {formatDay(SNAPSHOT_DATE)}, {SNAPSHOT_DATE.slice(0, 4)}
          </span>
          <Link
            href="/about"
            className="hidden h-[22px] items-center gap-1.5 rounded-full border border-border px-2 text-[11px] font-medium text-muted transition-colors hover:border-border-strong hover:text-fg sm:inline-flex"
            title="All projects and data shown are fictional"
          >
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
            Demo data
          </Link>
          <CommandMenu />
          <ThemeToggle />
          <Link
            href="/about"
            aria-label="About ProjectSignal"
            title="About ProjectSignal"
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md transition-colors hover:bg-surface-2 hover:text-fg",
              pathname === "/about" ? "text-fg" : "text-muted",
            )}
          >
            <Info className="size-4" aria-hidden />
          </Link>
        </div>
      </div>

      <nav aria-label="Main" className="scrollbar-none -mb-px flex gap-1 overflow-x-auto px-4 pb-2 sm:px-6 lg:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-2.5 py-1.5 text-[13px] font-medium",
              isActive(pathname, item.href) ? "bg-surface-3 text-fg" : "text-muted",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
