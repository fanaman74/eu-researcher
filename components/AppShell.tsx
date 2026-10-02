"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Sun, X } from "lucide-react";
import { HOME, NAV, activeItem, type NavItem } from "@/lib/navigation";

function NavLink({ item, current, onNavigate }: { item: NavItem; current: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={current ? "page" : undefined}
      className={`flex items-center gap-3 rounded-md px-3 py-2 min-h-10 text-sm transition-colors duration-150 ${
        current ? "bg-primary-soft text-link font-semibold" : "text-muted hover:bg-sunken hover:text-fg"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{item.label}</span>
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
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-3 rounded-md px-3 py-2 min-h-10 w-full text-sm text-muted hover:bg-sunken hover:text-fg transition-colors"
    >
      {dark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
      <span>{dark ? "Light theme" : "Dark theme"}</span>
    </button>
  );
}

function NavContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const current = activeItem(pathname);
  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      <NavLink item={HOME} current={current?.href === "/"} onNavigate={onNavigate} />
      {NAV.map((group) => (
        <div key={group.label}>
          <h2 className="px-3 mb-1 text-xs font-semibold uppercase tracking-wide text-subtle">{group.label}</h2>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <NavLink item={item} current={current?.href === item.href} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-3 py-1 rounded-md">
      <span className="w-8 h-8 rounded-md bg-primary text-on-primary flex items-center justify-center font-semibold text-sm" aria-hidden="true">
        EU
      </span>
      <span className="leading-tight">
        <span className="block font-semibold text-fg">EU Researcher</span>
        <span className="block text-xs text-subtle">EU affairs monitoring</span>
      </span>
    </Link>
  );
}

/** Persistent navigation: a sidebar on large screens, a menu drawer on small ones. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

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
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:bg-primary focus:text-on-primary"
      >
        Skip to main content
      </a>

      {/* Sidebar (large screens) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-line bg-surface">
        <div className="px-3 py-4 border-b border-line">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavContent pathname={pathname} />
        </div>
        <div className="px-3 py-3 border-t border-line">
          <ThemeToggle />
        </div>
      </aside>

      {/* Top bar (small screens) */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-surface px-3 py-2">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="inline-flex items-center gap-2 rounded-md border border-line px-3 min-h-11 text-sm font-medium text-fg hover:bg-sunken"
        >
          <Menu className="w-5 h-5" aria-hidden="true" /> Menu
        </button>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Main menu" id="mobile-nav">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-surface border-r border-line flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-line">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-md min-h-11 min-w-11 text-muted hover:bg-sunken hover:text-fg"
                aria-label="Close menu"
                autoFocus
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavContent pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            <div className="px-3 py-3 border-t border-line">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      <main id="main" ref={mainRef} tabIndex={-1} className="lg:pl-64 outline-none">
        {children}
      </main>
    </div>
  );
}
