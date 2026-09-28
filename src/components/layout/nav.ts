import {
  CalendarClock,
  FileText,
  FolderKanban,
  Gauge,
  Info,
  LayoutDashboard,
  Radar,
  Users,
} from "lucide-react";

export const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/risks", label: "Risk Radar", icon: Radar },
  { href: "/waiting", label: "Waiting Room", icon: CalendarClock },
  { href: "/capacity", label: "Capacity", icon: Users },
  { href: "/brief", label: "Executive Brief", icon: FileText },
] as const;

export const SECONDARY_NAV = [
  { href: "/scoring", label: "How health is scored", icon: Gauge },
  { href: "/about", label: "About ProjectSignal", icon: Info },
] as const;

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
