import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { BAND_TONE, HealthScore, toneDot } from "@/components/ui/status";
import { HEALTH_BANDS, SCORING_RULES, projectHealth } from "@/lib/health";
import { activeProjects } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "How health is scored" };

export default function ScoringPage() {
  const rows = activeProjects()
    .map((p) => ({ p, h: projectHealth(p) }))
    .sort((a, b) => a.h.score - b.h.score);

  return (
    <>
      <PageHeader
        eyebrow="Methodology"
        title="How health is scored"
        description="A transparent 0–100 score. Every project starts at 100 and loses points for six observable signals. There is no weighting model and no AI, just rules a PM can check and argue with."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title="Inputs and deductions" description="Each input is capped so no single signal dominates. Maximum total deduction: 100." />
          <ul className="divide-y divide-border border-t border-border">
            {SCORING_RULES.map((r) => (
              <li key={r.key} className="grid gap-1 px-5 py-4 sm:grid-cols-[220px_1fr_60px] sm:gap-4">
                <span className="text-[13.5px] font-medium text-fg">{r.label}</span>
                <span className="text-[13px] text-muted">{r.rule}</span>
                <span className="tabular text-[13px] text-subtle sm:text-right">max −{r.max}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="self-start">
          <CardHeader title="Bands" />
          <ul className="space-y-3 px-5 pb-5">
            {HEALTH_BANDS.map((b, i) => (
              <li key={b.band} className="flex gap-3">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", toneDot(BAND_TONE[b.band]))} aria-hidden />
                <div>
                  <p className="text-[13.5px] font-medium text-fg">
                    {b.band}{" "}
                    <span className="tabular font-normal text-subtle">
                      {i === 0 ? "90–100" : `${b.min}–${HEALTH_BANDS[i - 1].min - 1}`}
                    </span>
                  </p>
                  <p className="text-[12.5px] text-muted">{b.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Why these inputs"
          description="The score favours leading indicators (buffer, waiting items, capacity) over lagging ones (percent complete)."
        />
        <div className="grid gap-6 px-5 pb-5 text-[13.5px] leading-relaxed text-muted md:grid-cols-3">
          <p>
            <strong className="font-medium text-fg">Timeline risk is measured by buffer, not by date.</strong> A delay that is absorbed by
            contingency is information; a delay that compresses QA is a risk; a delay that moves the launch is an escalation. The dependency
            engine works out which of those is happening.
          </p>
          <p>
            <strong className="font-medium text-fg">Waiting items count before they become late milestones.</strong> An approval sitting with a
            client for four days is the earliest reliable sign of a slip. It costs points as soon as it crosses three business days.
          </p>
          <p>
            <strong className="font-medium text-fg">The score sits beside PM status, not instead of it.</strong> A PM can mark a project On Track
            while the score says Watch, as with Horizon. That gap is a prompt for a conversation, not an override.
          </p>
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Current scores" description="The same calculation applied to every active project" />
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full min-w-[860px] text-[13px]">
            <thead className="border-b border-border bg-surface-2/50 text-[11.5px] text-subtle">
              <tr>
                <th className="py-2.5 pr-3 pl-5 text-left font-medium">Project</th>
                {SCORING_RULES.map((r) => (
                  <th key={r.key} className="px-2 text-right font-medium">{r.label.split(" ")[0]}</th>
                ))}
                <th className="pr-5 pl-3 text-right font-medium">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ p, h }) => (
                <tr key={p.id}>
                  <td className="py-2.5 pr-3 pl-5">
                    <Link href={`/projects/${p.id}`} className="font-medium text-fg hover:underline">{p.name}</Link>
                  </td>
                  {h.factors.map((f) => (
                    <td key={f.key} className={cn("tabular px-2 text-right", f.points ? "text-critical-fg" : "text-subtle")} title={f.detail}>
                      {f.points ? `−${f.points}` : "–"}
                    </td>
                  ))}
                  <td className="pr-5 pl-3">
                    <span className="flex justify-end"><HealthScore score={h.score} band={h.band} /></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
