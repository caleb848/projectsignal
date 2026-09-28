import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-4 py-6 text-[12px] text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>ProjectSignal is a personal product experiment. All projects and data shown are fictional.</p>
        <nav className="flex gap-4" aria-label="Footer">
          <Link href="/scoring" className="hover:text-fg">How health is scored</Link>
          <Link href="/about" className="hover:text-fg">About</Link>
        </nav>
      </div>
    </footer>
  );
}
