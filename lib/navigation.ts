/**
 * The site map, grouped by task. Used by the sidebar, the home page and page titles,
 * so a page's name is the same everywhere.
 */
import {
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  FileSearch,
  FolderOpen,
  Handshake,
  Home,
  Landmark,
  MessagesSquare,
  Newspaper,
  Radar,
  Scale,
  Sparkles,
  UserRound,
  Users,
  Vote,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** One line shown on the home page and as the page subtitle. */
  description: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  /** Series letter shown in the masthead, as the Official Journal marks its L and C series. */
  series: string;
  items: NavItem[];
}

export const HOME: NavItem = { href: "/", label: "Home", description: "Today at a glance and where to start.", icon: Home };

export const NAV: NavGroup[] = [
  {
    label: "Daily monitoring",
    series: "M",
    items: [
      { href: "/enel/digest", label: "What changed", description: "New and changed items since yesterday, and deadlines coming up.", icon: Bell },
      { href: "/enel/calendar", label: "Calendar", description: "Consultation deadlines, planned adoptions and plenary sittings.", icon: CalendarDays },
      { href: "/enel/radar", label: "Commission pipeline", description: "What the Commission plans in energy, by act type and quarter.", icon: Radar },
      { href: "/enel/dossiers", label: "Legislative files", description: "Watched files with stage, rapporteurs, timeline and votes.", icon: FolderOpen },
    ],
  },
  {
    label: "People and positions",
    series: "P",
    items: [
      { href: "/enel/mep-briefing", label: "MEP briefing", description: "One-page record of an MEP before a meeting.", icon: UserRound },
      { href: "/enel/peers", label: "Peer positions", description: "What other utilities told the Commission in a consultation.", icon: Users },
      { href: "/enel/meetings", label: "Commission meetings", description: "Who meets which Commission office, and how Enel compares.", icon: Handshake },
    ],
  },
  {
    label: "Sources",
    series: "S",
    items: [
      { href: "/parliament", label: "European Parliament", description: "MEP written questions and plenary roll-call votes.", icon: Vote },
      { href: "/have-your-say", label: "Consultations", description: "Commission consultations on energy and who responded.", icon: MessagesSquare },
      { href: "/eurlex", label: "Search EU law", description: "Find regulations, directives and case law in EUR-Lex.", icon: FileSearch },
      { href: "/legal", label: "Latest EU law", description: "The newest publications in EUR-Lex, by document type.", icon: BookOpen },
      { href: "/enel/state-aid-cases", label: "State aid rulings", description: "State-aid judgments and decisions from EUR-Lex.", icon: Scale },
      { href: "/enel/context", label: "News and market", description: "Commission announcements on energy and Italian market data.", icon: Newspaper },
      { href: "/politics-tracker", label: "Italian politics", description: "Chamber votes and political news from Italy.", icon: Landmark },
    ],
  },
  {
    label: "AI assistants",
    series: "A",
    items: [
      { href: "/enel", label: "Briefing drafter", description: "Draft a briefing note from a live item. AI-generated.", icon: Sparkles },
      { href: "/research", label: "Research assistant", description: "Ask questions about EU law in plain language. AI-generated.", icon: Bot },
    ],
  },
];

export const ALL_ITEMS: NavItem[] = [HOME, ...NAV.flatMap((g) => g.items)];

/** The nav item a path belongs to (longest matching prefix). */
export function activeItem(pathname: string): NavItem | undefined {
  return ALL_ITEMS.filter((i) => (i.href === "/" ? pathname === "/" : pathname === i.href || pathname.startsWith(`${i.href}/`))).sort(
    (a, b) => b.href.length - a.href.length
  )[0];
}

/** Masthead code for a path: series letter and position ("M 2"), or "EN" on the home page. */
export function seriesCode(pathname: string): string {
  const item = activeItem(pathname);
  for (const group of NAV) {
    const index = group.items.findIndex((i) => i.href === item?.href);
    if (index >= 0) return `${group.series} ${index + 1}`;
  }
  return "EN";
}
