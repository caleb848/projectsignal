"use client";

import { Check, Copy, FileText, RefreshCw, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Segmented, Select } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { briefToText, clients, generateBrief, type Audience, type Brief } from "@/lib/brief";

const AUDIENCES: { value: Audience; label: string; note: string }[] = [
  { value: "executive", label: "Executive", note: "Portfolio-level: health, top priorities, budget, launches, decisions, next actions." },
  { value: "client", label: "Client status", note: "One client's projects: status, launch dates, what we need from them. No internal margins or staffing detail." },
  { value: "internal", label: "Internal team", note: "Delivery detail: every project, chase list, capacity conflicts, risks and open decisions." },
];

export function BriefGenerator() {
  const clientList = clients();
  const [audience, setAudience] = useState<Audience>("executive");
  const [client, setClient] = useState(clientList[0]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const generate = (a = audience, c = client) => {
    setLoading(true);
    setCopied("idle");
    clearTimeout(timer.current);
    // A short pause so the refresh is perceptible; the work itself is instant.
    timer.current = setTimeout(() => {
      setBrief(generateBrief(a, c));
      setLoading(false);
    }, 450);
  };

  const changeAudience = (a: Audience) => {
    setAudience(a);
    if (brief) generate(a, client);
  };

  const changeClient = (c: string) => {
    setClient(c);
    if (brief) generate(audience, c);
  };

  const copy = async () => {
    if (!brief) return;
    try {
      await navigator.clipboard.writeText(briefToText(brief));
      setCopied("done");
    } catch {
      setCopied("failed");
    }
    setTimeout(() => setCopied("idle"), 2200);
  };

  const meta = AUDIENCES.find((a) => a.value === audience)!;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
          <p className="text-[12px] font-medium text-muted">Audience</p>
          <Segmented
            label="Audience"
            value={audience}
            onChange={changeAudience}
            className="mt-2 flex w-full [&>button]:flex-1 [&>button]:justify-center"
            options={AUDIENCES.map((a) => ({ value: a.value, label: a.label.split(" ")[0] }))}
          />
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-subtle">{meta.note}</p>
          {audience === "client" && (
            <div className="mt-3">
              <p className="mb-1.5 text-[12px] font-medium text-muted">Client</p>
              <Select label="Client" value={client} onChange={changeClient} className="w-full" options={clientList.map((c) => ({ value: c, label: c }))} />
            </div>
          )}
          <Button variant="primary" className="mt-4 w-full" onClick={() => generate()} disabled={loading}>
            {brief ? <RefreshCw aria-hidden className={loading ? "animate-spin" : ""} /> : <Sparkles aria-hidden />}
            {brief ? "Regenerate brief" : "Generate Executive Brief"}
          </Button>
          <Button className="mt-2 w-full" onClick={copy} disabled={!brief || loading}>
            {copied === "done" ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied === "done" ? "Copied to clipboard" : copied === "failed" ? "Copy blocked. Select the text instead." : "Copy Executive Update"}
          </Button>
        </div>
        <p className="px-1 text-[12px] leading-relaxed text-subtle">
          Written by fixed rules from the same data as the dashboard, with no language model involved. Each sentence traces back to a
          number you can inspect.
        </p>
      </aside>

      <div aria-live="polite">
        {loading ? (
          <div className="rounded-lg border border-border bg-surface p-8 shadow-card">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="mt-2 h-4 w-48" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="mt-8 space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : brief ? (
          <article className="rounded-lg border border-border bg-surface px-6 py-7 shadow-card sm:px-10 sm:py-9">
            <header className="border-b border-border pb-5">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-fg">{brief.title}</h2>
              <p className="mt-1 text-[13px] text-subtle">{brief.subtitle}</p>
            </header>
            {brief.sections.map((s) => (
              <section key={s.heading} className="mt-7">
                <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-subtle">{s.heading}</h3>
                {s.paragraphs?.map((p, i) => (
                  <p key={i} className="mt-2 max-w-[68ch] text-[14.5px] leading-relaxed text-fg">{p}</p>
                ))}
                {s.bullets && s.bullets.length > 0 && (
                  <ul className="mt-2.5 max-w-[72ch] space-y-1.5">
                    {s.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-fg">
                        <span className="mt-[9px] size-1 shrink-0 rounded-full bg-subtle" aria-hidden />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </article>
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-border-strong px-6 text-center">
            <div className="flex size-11 items-center justify-center rounded-full border border-border bg-surface">
              <FileText className="size-5 text-subtle" aria-hidden />
            </div>
            <p className="mt-3 text-[15px] font-medium text-fg">No brief generated yet</p>
            <p className="mt-1 max-w-sm text-[13px] text-subtle">
              Choose an audience and generate a status update from the current portfolio data.
            </p>
            <Button variant="primary" className="mt-5" onClick={() => generate()}>
              <Sparkles aria-hidden />
              Generate Executive Brief
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
