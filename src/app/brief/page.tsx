import type { Metadata } from "next";
import { BriefGenerator } from "@/components/brief/brief-generator";
import { PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Executive Brief" };

export default function BriefPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reporting"
        title="Executive Brief"
        description="Turn the dashboard into a status update. The same facts, pitched at the level of detail each audience needs."
      />
      <BriefGenerator />
    </>
  );
}
