"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Sun, X } from "lucide-react";
import { HOME, NAV, activeItem, seriesCode, type NavItem } from "@/lib/navigation";

function NavLink({ item, current, code, onNavigate }: { item: NavItem; current: boolean; code?: string; onNavigate?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={current ? "page" : undefined}
      className={`group flex items-center gap-2.5 min-h-8 py-1 text-[0.9375rem] leading-snug ${current ? "font-semibold text-fg" : "text-muted hover:text-fg"}`}
    >
      {/* The current line carries the one yellow mark on the page. */}
      <span aria-hidden="true" className={`w-2 h-2 shrink-0 ${current ? "bg-marker" : "bg-transparent group-hover:bg-line"}`} />
      <span className={`flex-1 ${current ? "" : "group-hover:underline"}`}>{item.label}</span>
      {code && <span className="w-8 shrink-0 text-right text-xs font-normal text-subtle" aria-hidden="true">{code}</span>}
    </Link>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = document.documentElement.dataset.theme;
    setDark(stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Storage unavailable (private mode): the choice lasts for this page only.
    }
  };

  return (
    <button type="button" onClick={toggle} className="flex items-center gap-2.5 min-h-10 w-full text-sm text-muted hover:text-fg">
      {dark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
      <span className="hover:underline">{dark ? "Day edition (light)" : "Night edition (dark)"}</span>
    </button>
  );
}

function Contents({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const current = activeItem(pathname);
  return (
    <nav aria-labelledby="contents-title" className="flex flex-col gap-4">
      <h2 id="contents-title" className="text-xl font-bold tracking-[-0.01em] text-fg">Contents</h2>
      <NavLink item={{ ...HOME, label: "Today" }} current={current?.href === "/"} code="EN" onNavigate={onNavigate} />
      {NAV.map((group) => (
        <div key={group.label}>
          <h3 className="mb-0.5 pb-1 border-b border-line font-sans text-xs font-semibold uppercase tracking-[0.08em] text-subtle">{group.label}</h3>
          <ul>
            {group.items.map((item, n) => (
              <li key={item.href}>
                <NavLink item={item} current={current?.href === item.href} code={`${group.series} ${n + 1}`} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Wordmark() {
  return (
    <Link href="/" className="block leading-none">
      <span className="block whitespace-nowrap font-serif text-[1.5rem] sm:text-[2.25rem] font-bold tracking-[-0.02em] text-fg">EU Researcher</span>
      <span className="block mt-1.5 text-sm text-muted">Enel EU Affairs</span>
    </Link>
  );
}

/** Date and issue number, set after mount so server and reader time zones cannot disagree. */
function useIssue(): { date: string; issue: string } | null {
  const [issue, setIssue] = useState<{ date: string; issue: string } | null>(null);
  useEffect(() => {
    const now = new Date();
    const dayOfYear = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86_400_000);
    setIssue({
      date: now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      issue: `Day ${dayOfYear} of ${now.getFullYear()}`,
    });
  }, []);
  return issue;
}

/** The gazette frame: a contents column, a masthead with date and issue number, and the page. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const issue = useIssue();

  // Close the drawer and move focus to the new page's content after navigation.
  useEffect(() => {
    setOpen(false);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary"
      >
        Skip to main content
      </a>

      {/* Contents column (large screens) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-72 flex-col border-r border-line-strong bg-canvas">
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 [scrollbar-width:thin]">
          <Contents pathname={pathname} />
        </div>
        <div className="px-6 py-3 border-t border-line">
          <ThemeToggle />
        </div>
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Contents" id="mobile-nav">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-canvas border-r border-line-strong flex flex-col">
            <div className="flex items-start justify-end px-3 pt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center min-h-11 min-w-11 text-fg hover:bg-sunken"
                aria-label="Close contents"
                autoFocus
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <Contents pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            <div className="px-5 py-3 border-t border-line">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-72">
        {/* Masthead */}
        <header className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 pt-4 lg:pt-6">
          <div className="grid grid-cols-[1fr_auto] xl:grid-cols-[1fr_auto_1fr] items-end gap-4 pb-3">
            <Wordmark />
            <p className="hidden xl:block text-sm text-muted text-center pb-0.5">
              {issue ? (
                <>
                  {issue.date} <span className="mx-2 text-subtle" aria-hidden="true">·</span> <span className="text-subtle" title="Day of the year, not an Official Journal number">{issue.issue}</span>
                </>
              ) : (
                <span className="invisible">Loading date</span>
              )}
            </p>
            <div className="flex items-center justify-end gap-3">
              <span className="inline-flex items-center justify-center min-w-11 h-8 px-2 border border-line-strong font-sans text-sm font-semibold tracking-wide text-fg" title="Section code">
                <span className="sr-only">Section </span>
                {seriesCode(pathname)}
              </span>
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-expanded={open}
                aria-controls="mobile-nav"
                className="lg:hidden inline-flex items-center gap-2 border border-line-strong px-3 min-h-11 text-sm font-semibold text-fg hover:bg-sunken"
              >
                <Menu className="w-5 h-5" aria-hidden="true" /> Contents
              </button>
            </div>
          </div>
          <div className="rule-double rule-draw h-[5px]" aria-hidden="true" />
          <p className="xl:hidden pt-2 text-sm text-muted">{issue ? `${issue.date} · ${issue.issue}` : " "}</p>
        </header>

        <main id="main" ref={mainRef} tabIndex={-1} className="outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
