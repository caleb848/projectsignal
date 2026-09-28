import { SearchX } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-dashed border-border-strong">
      <EmptyState
        icon={SearchX}
        title="That page or project doesn't exist"
        description="It may have been renamed. Every project in the demo portfolio is listed on the Projects page."
        action={
          <Link href="/projects" className={buttonClass("secondary")}>
            View all projects
          </Link>
        }
      />
    </div>
  );
}
