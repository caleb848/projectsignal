import { ArrowUpRight, Code2, Link2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "About" };

/* Add your LinkedIn profile URL to show that button; empty links are hidden. */
const LINKEDIN_URL = "";

const LINKS = [
  { label: "GitHub", href: "https://github.com/caleb848/projectsignal", icon: Code2 },
  { label: "LinkedIn", href: LINKEDIN_URL, icon: Link2 },
].filter((l) => l.href);

const EXPLORATIONS = [
  { title: "Moving beyond basic task tracking", body: "Task lists say what exists. The questions that matter are what is late, what it affects, and what has to happen next." },
  { title: "Making dependencies visible", body: "A late approval matters because of what sits downstream of it. The dependency engine turns that chain into dates." },
  { title: "Surfacing risks earlier", body: "Waiting items and buffer consumption are leading indicators. They show up before a milestone goes red." },
  { title: "Reducing approval bottlenecks", body: "The Waiting Room shows who holds each item, how long it has been there, and whether it has been escalated." },
  { title: "Improving executive reporting", body: "The same facts, pitched at three levels of detail for executives, clients and the delivery team." },
  { title: "Using AI responsibly in project operations", body: "Where logic can be explicit, it is. Nothing is presented as a black box, and every statement traces back to data." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="About"
        title="About ProjectSignal"
        description="ProjectSignal is an experimental project management product exploring how creative and marketing teams can better visualize project health, dependencies, risks, approvals and launch readiness."
      />

      <Card className="px-6 py-6">
        <p className="text-[14.5px] leading-relaxed text-fg">
          Most project management tools are excellent at showing what work exists. This experiment asks a slightly different question:{" "}
          <em>what does a project manager need to know to decide where attention is required?</em>
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          The answer here is a small set of rules applied consistently. They cover schedule buffer, delays travelling through dependencies,
          items waiting on other people, budget forecast, team capacity and open risks. Each is combined into a health score whose working is shown.
        </p>
      </Card>

      <h2 className="mt-10 text-[13px] font-semibold text-fg">What I wanted to explore</h2>
      <ul className="mt-3 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
        {EXPLORATIONS.map((e) => (
          <li key={e.title} className="bg-surface px-5 py-4">
            <p className="text-[13.5px] font-medium text-fg">{e.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{e.body}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-[13px] font-semibold text-fg">How it works</h2>
      <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-muted">
        <li>• A fixed demo date (Wednesday, October 7, 2026) anchors every calculation, so the scenarios stay consistent.</li>
        <li>• Milestones form a dependency graph. Delays flow downstream, using contingency first, then compressing QA, then moving the launch.</li>
        <li>
          • Health scores, insights and briefs are generated from that data by explicit rules. See{" "}
          <Link href="/scoring" className="text-fg underline decoration-border-strong underline-offset-2">how health is scored</Link>.
        </li>
      </ul>

      <div className="mt-10 rounded-lg border border-border bg-surface-2/60 px-5 py-4">
        <p className="text-[13px] font-medium text-fg">Built as a personal learning experiment with Claude Code.</p>
        <p className="mt-1 text-[12.5px] text-muted">
          All organizations, projects, people, budgets, dates and scenarios represented in ProjectSignal are fictional and created solely for
          demonstration purposes.
        </p>
        <div className="mt-3 flex gap-2">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[12.5px] font-medium text-fg hover:border-border-strong"
            >
              <l.icon className="size-3.5" aria-hidden />
              {l.label}
              <ArrowUpRight className="size-3 text-subtle" aria-hidden />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
