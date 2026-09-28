"use client";

import { FlaskConical, RotateCcw } from "lucide-react";
import { useState } from "react";
import { getProject } from "@/data";
import { Badge, type Tone } from "@/components/ui/status";
import { Button, Select } from "@/components/ui/button";
import { SNAPSHOT_DATE } from "@/lib/config";
import { addBusinessDays, businessDays, formatDate, formatDay } from "@/lib/dates";
import { lowerFirst } from "@/lib/format";
import { analyzeDelay, currentDelays, downstreamOf, type ScenarioRisk } from "@/lib/schedule";
import { cn } from "@/lib/utils";

const RISK_TONE: Record<ScenarioRisk, Tone> = {
  None: "good",
  Low: "neutral",
  Medium: "warn",
  High: "serious",
  Critical: "critical",
};

function Metric({ label, before, after, note, changed }: { label: string; before: string; after: string; note?: string; changed: boolean }) {
  return (
    <div className="rounded-md border border-border bg-surface-2/50 px-3.5 py-3">
      <p className="text-[11.5px] text-subtle">{label}</p>
      <p className="tabular mt-1 text-[15px] font-semibold text-fg">
        {changed ? (
          <>
            <span className="font-normal text-subtle line-through decoration-1">{before}</span>
            <span className="mx-1.5 text-subtle">→</span>
            <span>{after}</span>
          </>
        ) : (
          after
        )}
      </p>
      {note && <p className="mt-0.5 text-[11.5px] text-subtle">{note}</p>}
    </div>
  );
}

/**
 * Rule-based "what if" for one milestone slipping. Runs the same schedule
 * engine as the rest of the dashboard with a different delay.
 */
export function ScenarioSimulator({ projectId }: { projectId: string }) {
  const project = getProject(projectId)!;
  const current = currentDelays(project);
  const candidates = project.milestones.filter(
    (m) => !m.completed && m.kind !== "launch" && downstreamOf(project, m.id).size > 0,
  );
  const defaultId =
    Object.keys(current)[0] ??
    candidates.find((m) => m.kind === "approval")?.id ??
    candidates[0]?.id;

  const [milestoneId, setMilestoneId] = useState(defaultId);
  const [delay, setDelay] = useState(current[defaultId] ? current[defaultId] + 2 : 3);

  const result = milestoneId ? analyzeDelay(project, milestoneId, delay) : null;

  if (!result) {
    return <p className="text-[13px] text-subtle">All milestones are complete — nothing left to simulate.</p>;
  }

  const launchName = lowerFirst(project.milestones.find((m) => m.kind === "launch")!.name);
  const newEnd = addBusinessDays(result.milestone.end, delay);
  const production = result.shifted.find((s) => /production/i.test(s.milestone.name)) ?? result.shifted[0];
  const currentDelay = current[milestoneId];

  let consequence: string;
  if (result.launchSlip > 0) {
    consequence = `the ${launchName} moves ${businessDays(result.launchSlip)} to ${formatDay(result.scenario.launchProjected)}`;
  } else if (result.window && result.window.newDays < result.window.plannedDays) {
    consequence = `${lowerFirst(result.window.name)} shrinks from ${result.window.plannedDays} to ${result.window.newDays} days and the ${formatDate(result.plan.launchProjected)} ${launchName} holds`;
  } else if (result.shifted.length) {
    consequence = `downstream work shifts but contingency absorbs it; the ${launchName} holds`;
  } else {
    consequence = "nothing downstream moves";
  }

  const presets = [...new Set([...(currentDelay ? [currentDelay] : []), 1, 3, 5])].sort((a, b) => a - b);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <p className="mb-1.5 text-[12px] font-medium text-muted">If this milestone slips</p>
          <Select
            label="Milestone"
            value={milestoneId}
            className="w-full"
            onChange={(id) => {
              setMilestoneId(id);
              setDelay(current[id] ? current[id] + 2 : 3);
            }}
            options={candidates.map((m) => ({
              value: m.id,
              label: `${m.name}${current[m.id] ? ` (${current[m.id]}d late now)` : ""}`,
            }))}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <Button key={p} size="sm" variant={delay === p ? "primary" : "secondary"} onClick={() => setDelay(p)}>
              {p === currentDelay ? `Today (${p}d)` : `+${p} days`}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setDelay(0)} aria-label="Reset to plan">
            <RotateCcw aria-hidden />
          </Button>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="flex items-center justify-between text-[12px] text-muted">
          <span>Delay vs plan</span>
          <span className="tabular font-semibold text-fg">{businessDays(delay)}</span>
        </span>
        <input
          type="range"
          min={0}
          max={10}
          value={delay}
          onChange={(e) => setDelay(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--fg)]"
          aria-label="Delay in business days"
        />
      </label>

      <div className="mt-4 flex items-start gap-3 rounded-md border border-border bg-surface px-4 py-3">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden />
        <p className="text-[13.5px] leading-relaxed text-fg">
          If <strong className="font-semibold">{lowerFirst(result.milestone.name)}</strong> finishes{" "}
          {delay === 0 ? "on plan" : `${businessDays(delay)} late (${formatDay(newEnd)})`}, {consequence}.{" "}
          <Badge tone={RISK_TONE[result.risk]} className="ml-0.5 align-middle">
            Launch risk: {result.risk}
          </Badge>
        </p>
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <Metric
          label={`${project.milestones.find((m) => m.kind === "launch")!.name} date`}
          before={formatDate(result.plan.launchProjected)}
          after={formatDate(result.scenario.launchProjected)}
          changed={result.launchSlip > 0}
          note={result.launchSlip > 0 ? `+${businessDays(result.launchSlip)}` : "Protected"}
        />
        {result.window ? (
          <Metric
            label={result.window.name}
            before={`${result.window.plannedDays} days`}
            after={`${result.window.newDays} days`}
            changed={result.window.newDays !== result.window.plannedDays}
            note={`Minimum ${result.window.minDays} ${result.window.minDays === 1 ? "day" : "days"}`}
          />
        ) : (
          <Metric label="QA window" before="" after="None downstream" changed={false} />
        )}
        <Metric
          label="Contingency"
          before={`${result.contingency} days`}
          after={`${result.contingencyRemaining} days`}
          changed={delay > 0 && result.contingency > 0}
          note={result.contingency === 0 ? "No buffer before the QA window" : "Absorbed before QA compresses"}
        />
        <Metric
          label={production ? `Revised ${lowerFirst(production.milestone.name)} start` : "Next milestone"}
          before={production ? formatDate(production.plannedStart) : ""}
          after={production ? formatDate(production.newStart) : "No change"}
          changed={Boolean(production)}
          note={production ? `+${businessDays(production.shift)}` : undefined}
        />
      </div>

      <p className={cn("mt-3 text-[12.5px]", result.latestSafeEnd < SNAPSHOT_DATE ? "text-critical-fg" : "text-muted")}>
        {result.breakingPoint >= 40
          ? "The launch is not sensitive to this milestone."
          : result.latestSafeEnd < SNAPSHOT_DATE
            ? `The last date that protected the launch (${formatDay(result.latestSafeEnd)}) has passed. Re-plan or approve a fallback.`
            : `Latest completion that protects the launch: ${formatDay(result.latestSafeEnd)} (${businessDays(result.breakingPoint)} of slack).`}
      </p>
    </div>
  );
}
