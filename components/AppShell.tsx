"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Moon, Sun, X } from "lucide-react";
import { NAV, activeItem, type NavGroup } from "@/lib/navigation";

function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
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

  const label = dark ? "Switch to the light theme" : "Switch to the dark theme";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={withLabel ? undefined : label}
      title={withLabel ? undefined : label}
      className="inline-flex items-center gap-2.5 min-h-11 min-w-11 justify-center text-sm text-fg hover:bg-sunken"
    >
      {dark ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
      {withLabel && <span>{dark ? "Light theme" : "Dark theme"}</span>}
    </button>
  );
}

function Wordmark() {
  return (
    <Link href="/" className="block leading-none shrink-0">
      <span className="block whitespace-nowrap font-serif text-2xl font-bold tracking-[-0.02em] text-fg">EU Researcher</span>
      <span className="block mt-1 text-xs text-muted">Enel EU Affairs</span>
    </Link>
  );
}

/** One top-bar menu: a button that opens a panel of pages with their one-line descriptions. */
function Dropdown({
  group,
  open,
  current,
  onToggle,
  onClose,
}: {
  group: NavGroup;
  open: boolean;
  current: string | undefined;
  onToggle: () => void;
  onClose: () => void;
}) {
  const active = group.items.some((i) => i.href === current);
  const id = `menu-${group.series}`;
  return (
    <li className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className={`inline-flex items-center gap-1.5 min-h-11 px-3 text-[0.9375rem] font-semibold border-b-2 ${
          active ? "border-marker text-fg" : "border-transparent text-fg hover:border-line-strong"
        }`}
      >
        {group.label}
        <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <ul id={id} className="absolute left-0 top-full z-40 mt-px w-80 border border-line-strong bg-canvas py-2">
          {group.items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                aria-current={item.href === current ? "page" : undefined}
                className="group flex gap-2.5 px-4 py-2.5 hover:bg-sunken"
              >
                <span aria-hidden="true" className={`mt-2 w-2 h-2 shrink-0 ${item.href === current ? "bg-marker" : "bg-transparent"}`} />
                <span>
                  <span className={`block text-fg group-hover:underline ${item.href === current ? "font-bold" : "font-semibold"}`}>{item.label}</span>
                  <span className="block text-sm text-muted">{item.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** The frame: a top menu bar with dropdowns on wide screens, a full-screen menu on small ones. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = activeItem(pathname)?.href;
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const barRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // Close menus and move focus to the new page's content after navigation.
  useEffect(() => {
    setOpenMenu(null);
    setDrawer(false);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  // A dropdown closes on Escape or when the reader clicks or tabs outside the bar.
  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenMenu(null);
    const onAway = (e: Event) => {
      if (!barRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onAway);
    document.addEventListener("focusin", onAway);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onAway);
      document.removeEventListener("focusin", onAway);
    };
  }, [openMenu]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawer]);

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary"
      >
        Skip to main content
      </a>

      <header ref={barRef} className="sticky top-0 z-30 bg-canvas border-b-[3px] border-line-strong">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 flex items-center gap-6 min-h-16">
          <Wordmark />
          <nav aria-label="Main" className="hidden lg:block flex-1">
            <ul className="flex items-center gap-1">
              <li>
                <Link
                  href="/"
                  aria-current={current === "/" ? "page" : undefined}
                  className={`inline-flex items-center min-h-11 px-3 text-[0.9375rem] font-semibold border-b-2 ${current === "/" ? "border-marker" : "border-transparent hover:border-line-strong"} text-fg`}
                >
                  Today
                </Link>
              </li>
              {NAV.map((group) => (
                <Dropdown
                  key={group.label}
                  group={group}
                  open={openMenu === group.label}
                  current={current}
                  onToggle={() => setOpenMenu(openMenu === group.label ? null : group.label)}
                  onClose={() => setOpenMenu(null)}
                />
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden lg:block"><ThemeToggle /></span>
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-expanded={drawer}
              aria-controls="mobile-nav"
              className="lg:hidden inline-flex items-center gap-2 border border-line-strong px-3 min-h-11 text-sm font-semibold text-fg hover:bg-sunken"
            >
              <Menu className="w-5 h-5" aria-hidden="true" /> Menu
            </button>
          </div>
        </div>
      </header>

      {drawer && (
        <div className="lg:hidden fixed inset-0 z-40 bg-canvas overflow-y-auto" role="dialog" aria-modal="true" aria-label="Menu" id="mobile-nav">
          <div className="flex items-center justify-between px-4 sm:px-6 min-h-16 border-b-[3px] border-line-strong">
            <Wordmark />
            <button
              type="button"
              onClick={() => setDrawer(false)}
              className="inline-flex items-center justify-center min-h-11 min-w-11 text-fg hover:bg-sunken"
              aria-label="Close menu"
              autoFocus
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Main" className="px-4 sm:px-6 py-5 space-y-6">
            <Link href="/" onClick={() => setDrawer(false)} aria-current={current === "/" ? "page" : undefined} className="block text-lg font-semibold text-fg">
              Today
            </Link>
            {NAV.map((group) => (
              <div key={group.label}>
                <h2 className="pb-1 mb-1 border-b border-line-strong font-sans text-xs font-semibold uppercase tracking-[0.08em] text-subtle">{group.label}</h2>
                <ul className="divide-y divide-line">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setDrawer(false)}
                        aria-current={item.href === current ? "page" : undefined}
                        className={`flex items-center gap-2.5 min-h-11 py-2 text-fg ${item.href === current ? "font-bold" : ""}`}
                      >
                        <span aria-hidden="true" className={`w-2 h-2 shrink-0 ${item.href === current ? "bg-marker" : "bg-transparent"}`} />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="border-t border-line pt-3">
              <ThemeToggle withLabel />
            </div>
          </nav>
        </div>
      )}

      <main id="main" ref={mainRef} tabIndex={-1} className="outline-none">
        {children}
      </main>
    </div>
  );
}
