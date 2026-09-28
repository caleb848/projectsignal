"use client";

import { CornerDownLeft, FolderKanban, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getProjects } from "@/data";
import { STATUS_LABEL } from "@/lib/project";
import { cn } from "@/lib/utils";
import { NAV, SECONDARY_NAV } from "./nav";

interface Item {
  id: string;
  label: string;
  hint: string;
  href: string;
  group: "Pages" | "Projects";
  icon: React.ComponentType<{ className?: string }>;
}

const ITEMS: Item[] = [
  ...[...NAV, ...SECONDARY_NAV].map((n) => ({
    id: n.href,
    label: n.label,
    hint: "Page",
    href: n.href,
    group: "Pages" as const,
    icon: n.icon,
  })),
  ...getProjects().map((p) => ({
    id: p.id,
    label: p.name,
    hint: `${p.client} · ${STATUS_LABEL[p.status]}`,
    href: `/projects/${p.id}`,
    group: "Projects" as const,
    icon: FolderKanban,
  })),
];

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const show = useCallback(() => {
    setQuery("");
    setActive(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? ITEMS.filter((i) => `${i.label} ${i.hint}`.toLowerCase().includes(q)) : ITEMS;
  }, [query]);

  const go = (item?: Item) => {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      go(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-[12.5px] text-subtle transition-colors hover:border-border-strong hover:text-muted"
        aria-label="Search projects and pages"
      >
        <Search className="size-3.5" aria-hidden />
        <span className="hidden lg:inline">Search</span>
        <kbd className="hidden rounded border border-border bg-surface-2 px-1 font-sans text-[10.5px] text-subtle lg:inline">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal aria-label="Search">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] dark:bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center gap-2.5 border-b border-border px-4">
              <Search className="size-4 text-subtle" aria-hidden />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Jump to a project or page…"
                className="h-12 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-subtle"
                aria-label="Search"
                role="combobox"
                aria-expanded
                aria-controls="command-results"
              />
              <kbd className="rounded border border-border bg-surface-2 px-1.5 text-[10.5px] text-subtle">Esc</kbd>
            </div>
            <ul id="command-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-1.5">
              {results.length === 0 && (
                <li className="px-3 py-8 text-center text-[13px] text-subtle">No matches for “{query}”.</li>
              )}
              {results.map((item, i) => {
                const showGroup = i === 0 || results[i - 1].group !== item.group;
                const Icon = item.icon;
                return (
                  <li key={item.id} role="option" aria-selected={i === active}>
                    {showGroup && (
                      <p className="px-2.5 pt-2.5 pb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-subtle">{item.group}</p>
                    )}
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(item)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left",
                        i === active ? "bg-surface-2" : "",
                      )}
                    >
                      <Icon className="size-4 shrink-0 text-subtle" />
                      <span className="flex-1 truncate text-[13.5px] text-fg">{item.label}</span>
                      <span className="hidden truncate text-[12px] text-subtle sm:inline">{item.hint}</span>
                      {i === active && <CornerDownLeft className="size-3.5 text-subtle" aria-hidden />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
