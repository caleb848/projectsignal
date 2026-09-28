import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectExplorerFromUrl } from "@/components/projects/project-explorer";
import { PageHeader } from "@/components/ui/card";
import { portfolioKpis } from "@/lib/portfolio";
import { projectRows } from "@/lib/rows";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  const k = portfolioKpis();
  const rows = projectRows();

  return (
    <>
      <PageHeader
        eyebrow="Portfolio"
        title="Projects"
        description={`${k.active} active and ${k.completed} completed. PM status sits alongside the calculated health score, so a gap between the two is itself a signal.`}
      />
      {/* Filters are read from the URL on the client so the page can be statically exported. */}
      <Suspense>
        <ProjectExplorerFromUrl rows={rows} />
      </Suspense>
    </>
  );
}
