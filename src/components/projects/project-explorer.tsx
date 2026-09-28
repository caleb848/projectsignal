"use client";

import { AlertTriangle, CheckSquare, LayoutGrid, Rows3, Search, SearchX, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Segmented, Select } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { HealthScore, ProgressBar, SEVERITY_TONE, StatusBadge, toneText } from "@/components/ui/status";
import { formatDate, formatMonth } from "@/lib/dates";
import { money } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/project";
import type { ProjectRow } from "@/lib/rows";
import type { ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface Filters {
  q: string;
  status: string;
  type: string;
  month: string;
  risk: string;
  owner: string;
}

const EMPTY: Filters = { q: "", status: "all", type: "all", month: "all", risk: "all", owner: "all" };
type SortKey = "health" | "launch" | "name" | "budget";

const uniq = (xs: string[]) => [...new Set(xs)].sort();

const FILTER_KEYS = Object.keys(EMPTY) as (keyof Filters)[];

/** Reads initial filters from the URL, e.g. /projects?status=blocked. */
export function ProjectExplorerFromUrl({ rows }: { rows: ProjectRow[] }) {
  const params = useSearchParams();
  const initial = Object.fromEntries(
    FILTER_KEYS.flatMap((k) => (params.get(k) ? [[k, params.get(k)]] : [])),
  ) as Partial<Filters>;
  return <ProjectExplorer rows={rows} initial={initial} />;
}

export function ProjectExplorer({ rows, initial }: { rows: ProjectRow[]; initial: Partial<Filters> }) {
  const [filters, setFilters] = useState<Filters>({ ...EMPTY, ...initial });
  const [sort, setSort] = useState<SortKey>("health");
  const [view, setView] = useState<"table" | "cards">("table");

  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    const params = new URLSearchParams(
      Object.entries(next).filter(([, v]) => v && v !== "all") as [string, string][],
    );
    window.history.replaceState(null, "", params.size ? `?${params}` : window.location.pathname);
  };

  const options = useMemo(
    () => ({
      types: uniq(rows.map((r) => r.type)),
      owners: uniq(rows.map((r) => r.owner)),
      months: uniq(rows.map((r) => r.launch.slice(0, 7))),
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const list = rows.filter(
      (r) =>
        (!q || `${r.name} ${r.client} ${r.type} ${r.owner} ${r.phase}`.toLowerCase().includes(q)) &&
        (filters.status === "all" || (filters.status === "active" ? r.status !== "completed" : r.status === filters.status)) &&
        (filters.type === "all" || r.type === filters.type) &&
        (filters.month === "all" || r.launch.startsWith(filters.month)) &&
        (filters.risk === "all" || r.riskLevel === filters.risk) &&
        (filters.owner === "all" || r.owner === filters.owner),
    );
    const by: Record<SortKey, (a: ProjectRow, b: ProjectRow) => number> = {
      health: (a, b) => a.score - b.score,
      launch: (a, b) => a.launch.localeCompare(b.launch),
      name: (a, b) => a.name.localeCompare(b.name),
      budget: (a, b) => b.budget - a.budget,
    };
    return list.sort(by[sort]);
  }, [rows, filters, sort]);

  const activeFilters = Object.entries(filters).filter(([, v]) => v && v !== "all").length;

  return (
    <div>
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[200px] flex-1">
            <span className="sr-only">Search projects</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" aria-hidden />
            <input
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Search by project, client, owner or phase"
              className="h-8 w-full rounded-md border border-border bg-surface pr-3 pl-8 text-[13px] text-fg outline-none placeholder:text-subtle focus:border-border-strong"
            />
          </label>
          <Select
            label="Sort by"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={[
              { value: "health", label: "Sort: Health (lowest)" },
              { value: "launch", label: "Sort: Launch date" },
              { value: "budget", label: "Sort: Budget" },
              { value: "name", label: "Sort: Name" },
            ]}
          />
          <Segmented
            label="View"
            value={view}
            onChange={setView}
            className="hidden md:inline-flex"
            options={[
              { value: "table", label: <><Rows3 aria-hidden />Table</> },
              { value: "cards", label: <><LayoutGrid aria-hidden />Cards</> },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            label="Status"
            value={filters.status}
            onChange={(v) => update({ status: v })}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active only" },
              ...(["on-track", "at-risk", "blocked", "completed"] as ProjectStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
            ]}
          />
          <Select
            label="Project type"
            value={filters.type}
            onChange={(v) => update({ type: v })}
            options={[{ value: "all", label: "All types" }, ...options.types.map((t) => ({ value: t, label: t }))]}
          />
          <Select
            label="Launch month"
            value={filters.month}
            onChange={(v) => update({ month: v })}
            options={[{ value: "all", label: "Any launch month" }, ...options.months.map((m) => ({ value: m, label: formatMonth(`${m}-01`) }))]}
          />
          <Select
            label="Risk level"
            value={filters.risk}
            onChange={(v) => update({ risk: v })}
            options={[
              { value: "all", label: "Any risk level" },
              ...["Critical", "High", "Medium", "Low", "None"].map((r) => ({ value: r, label: r === "None" ? "No open risks" : `Top risk: ${r}` })),
            ]}
          />
          <Select
            label="Owner"
            value={filters.owner}
            onChange={(v) => update({ owner: v })}
            options={[{ value: "all", label: "All owners" }, ...options.owners.map((o) => ({ value: o, label: o }))]}
          />
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={() => update(EMPTY)}>
              <X aria-hidden />
              Clear {activeFilters > 1 ? `${activeFilters} filters` : "filter"}
            </Button>
          )}
          <span className="ml-auto text-[12.5px] text-subtle">
            {filtered.length} of {rows.length} projects
          </span>
        </div>
      </div>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-strong">
            <EmptyState
              icon={SearchX}
              title="No projects match these filters"
              description="Try removing a filter or searching for a different client or owner."
              action={<Button onClick={() => update(EMPTY)}>Clear all filters</Button>}
            />
          </div>
        ) : (
          <>
            <div className={cn(view === "table" ? "hidden md:block" : "hidden")}>
              <ProjectTable rows={filtered} />
            </div>
            <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", view === "table" ? "md:hidden" : "")}>
              {filtered.map((r) => (
                <ProjectCard key={r.id} row={r} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LaunchCell({ row }: { row: ProjectRow }) {
  if (row.launch !== row.launchProjected) {
    return (
      <span className="whitespace-nowrap">
        <s className="text-subtle">{formatDate(row.launch)}</s>{" "}
        <span className="font-medium text-critical-fg">{formatDate(row.launchProjected)}</span>
      </span>
    );
  }
  return <span className="whitespace-nowrap">{formatDate(row.launch)}</span>;
}

function BudgetCell({ row }: { row: ProjectRow }) {
  const used = (row.spent / row.budget) * 100;
  const over = row.forecast > row.budget * 1.005;
  return (
    <div className="w-28">
      <div className="tabular flex justify-between text-[12.5px]">
        <span className="text-fg">{money(row.spent)}</span>
        <span className="text-subtle">{money(row.budget)}</span>
      </div>
      <ProgressBar value={used} className="mt-1" tone={over ? "serious" : "neutral"} />
    </div>
  );
}

function ProjectTable({ rows }: { rows: ProjectRow[] }) {
  const th = "px-3 py-2.5 text-left text-[11.5px] font-medium text-subtle whitespace-nowrap";
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-card">
      <table className="w-full min-w-[1100px] text-[13px]">
        <thead className="border-b border-border bg-surface-2/50">
          <tr>
            <th className={cn(th, "pl-5")}>Project</th>
            <th className={th}>Owner</th>
            <th className={th}>Status</th>
            <th className={th}>Health</th>
            <th className={th}>Progress</th>
            <th className={th}>Budget used</th>
            <th className={th}>Launch</th>
            <th className={th}>Current phase</th>
            <th className={cn(th, "text-right")}>Approvals</th>
            <th className={cn(th, "pr-5 text-right")}>Open risks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id} className="group relative transition-colors hover:bg-surface-2/60">
              <td className="py-3 pr-3 pl-5">
                <Link href={`/projects/${r.id}`} className="font-medium text-fg after:absolute after:inset-0">
                  {r.name}
                </Link>
                <p className="text-[12px] text-subtle">
                  {r.client} · {r.type}
                </p>
              </td>
              <td className="px-3 whitespace-nowrap text-muted">{r.owner}</td>
              <td className="px-3"><StatusBadge status={r.status} /></td>
              <td className="px-3"><HealthScore score={r.score} band={r.band} /></td>
              <td className="px-3">
                <div className="flex w-24 items-center gap-2">
                  <ProgressBar value={r.progress} />
                  <span className="tabular w-8 text-right text-[12px] text-muted">{r.progress}%</span>
                </div>
              </td>
              <td className="px-3"><BudgetCell row={r} /></td>
              <td className="tabular px-3 text-muted"><LaunchCell row={r} /></td>
              <td className="max-w-[180px] truncate px-3 text-muted" title={r.phase}>{r.phase}</td>
              <td className="tabular px-3 text-right text-muted">{r.pendingApprovals || "–"}</td>
              <td className="tabular pr-5 pl-3 text-right">
                {r.openRisks ? (
                  <span className={cn("inline-flex items-center gap-1", r.riskLevel === "Low" ? "text-muted" : toneText(SEVERITY_TONE[r.riskLevel as keyof typeof SEVERITY_TONE]))}>
                    {r.openRisks}
                    <span className="text-[11.5px]">· {r.riskLevel}</span>
                  </span>
                ) : (
                  <span className="text-subtle">–</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProjectCard({ row: r }: { row: ProjectRow }) {
  return (
    <Link
      href={`/projects/${r.id}`}
      className="flex flex-col rounded-lg border border-border bg-surface p-4 shadow-card transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-fg">{r.name}</p>
          <p className="truncate text-[12px] text-subtle">
            {r.client} · {r.type}
          </p>
        </div>
        <HealthScore score={r.score} band={r.band} showBand={false} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={r.status} />
        <span className="text-[12px] text-muted">{r.owner}</span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <ProgressBar value={r.progress} />
        <span className="tabular text-[12px] text-muted">{r.progress}%</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12.5px]">
        <div>
          <dt className="text-subtle">Launch</dt>
          <dd className="tabular text-fg"><LaunchCell row={r} /></dd>
        </div>
        <div>
          <dt className="text-subtle">Budget used</dt>
          <dd className="tabular text-fg">{money(r.spent)} / {money(r.budget)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-subtle">Current phase</dt>
          <dd className="truncate text-fg">{r.phase}</dd>
        </div>
      </dl>
      <div className="mt-4 flex gap-4 border-t border-border pt-3 text-[12px] text-muted">
        <span className="inline-flex items-center gap-1.5"><CheckSquare className="size-3.5 text-subtle" aria-hidden />{r.pendingApprovals} approvals</span>
        <span className="inline-flex items-center gap-1.5"><AlertTriangle className="size-3.5 text-subtle" aria-hidden />{r.openRisks} open risks</span>
      </div>
    </Link>
  );
}
