"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, ChevronDown, Menu, X } from "lucide-react";
import { NAV, SETTINGS, activeItem, type NavGroup } from "@/lib/navigation";

function Wordmark({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="flex shrink-0 items-center gap-3 leading-none">
      <span aria-hidden="true" className="brand-geometry"><span /></span>
      <span>
        <span className="block whitespace-nowrap text-lg font-black uppercase tracking-[-0.035em] sm:text-xl">EU Researcher</span>
        <span className="mt-1 block text-xs font-medium">Enel EU Affairs</span>
      </span>
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
        data-active={active}
        className="nav-trigger inline-flex min-h-11 items-center gap-1.5 px-2.5 text-xs font-bold uppercase tracking-wide xl:px-3 xl:text-sm"
      >
        {group.label}
        <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <ul id={id} className="nav-panel absolute left-0 top-full z-40 mt-1 w-80 divide-y divide-line">
          {group.items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                aria-current={item.href === current ? "page" : undefined}
                className={`group flex gap-2.5 px-4 py-2.5 ${item.href === current ? "bg-marker" : "hover:bg-sunken"}`}
              >
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
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerReturnFocusRef = useRef<HTMLElement | null>(null);
  const drawerWasOpen = useRef(false);
  const firstRender = useRef(true);

  const closeDrawer = (restoreFocus = true) => {
    if (!restoreFocus) drawerReturnFocusRef.current = null;
    setDrawer(false);
  };

  // Close menus and move focus to the new page's content after navigation.
  useEffect(() => {
    setOpenMenu(null);
    closeDrawer(false);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  // A dropdown closes on Escape or when the reader clicks or tabs outside the bar.
  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      const group = NAV.find((item) => item.label === openMenu);
      setOpenMenu(null);
      if (group) {
        requestAnimationFrame(() => {
          barRef.current?.querySelector<HTMLElement>(`[aria-controls="menu-${group.series}"]`)?.focus({ preventScroll: true });
        });
      }
    };
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
    drawerWasOpen.current = true;
    const panel = drawerRef.current;
    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? []);
    drawerCloseRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const onFocusIn = (e: FocusEvent) => {
      if (panel && !panel.contains(e.target as Node)) focusables()[0]?.focus();
    };
    const onMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) closeDrawer();
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    window.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocusIn);
    desktop.addEventListener("change", onMediaChange);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocusIn);
      desktop.removeEventListener("change", onMediaChange);
      document.body.style.overflow = "";
    };
  }, [drawer]);

  useEffect(() => {
    if (drawer || !drawerWasOpen.current) return;
    drawerWasOpen.current = false;
    const returnFocus = drawerReturnFocusRef.current;
    drawerReturnFocusRef.current = null;
    if (!returnFocus) return;
    const frame = requestAnimationFrame(() => {
      const visible = returnFocus.isConnected && returnFocus.getClientRects().length > 0;
      const fallback = barRef.current?.querySelector<HTMLElement>("a, button");
      (visible ? returnFocus : fallback)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [drawer]);

  return (
    <div className="flex min-h-dvh flex-col" id="top">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary"
      >
        Skip to main content
      </a>

      <header ref={barRef} className="site-header sticky top-0 z-30">
        <div className="mx-auto flex min-h-[4.5rem] w-full max-w-7xl items-center gap-5 px-4 sm:px-6 md:grid md:grid-cols-[1fr_auto] md:gap-y-2 md:py-2 lg:flex lg:px-10 lg:py-0 xl:gap-8">
          <Wordmark />
          <nav aria-label="Main" className="main-nav col-span-2 row-start-2 hidden flex-1 md:block">
            <ul className="flex items-center gap-1">
              <li>
                <Link
                  href="/"
                  aria-current={current === "/" ? "page" : undefined}
                  data-active={current === "/"}
                  className="nav-trigger inline-flex min-h-11 items-center px-2.5 text-xs font-bold uppercase tracking-wide xl:px-3 xl:text-sm"
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
            <Link href={SETTINGS.href} aria-current={current === SETTINGS.href ? "page" : undefined} className="nav-trigger hidden min-h-11 min-w-11 items-center justify-center md:inline-flex" data-active={current === SETTINGS.href} aria-label="Settings" title="Settings">
              <SETTINGS.icon className="w-5 h-5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              ref={drawerTriggerRef}
              onClick={() => {
                drawerReturnFocusRef.current = drawerTriggerRef.current;
                setDrawer(true);
              }}
              aria-expanded={drawer}
              aria-controls="mobile-nav"
              className="bau-button inline-flex min-h-11 items-center gap-2 bg-white px-3 text-xs font-bold uppercase tracking-wide hover:bg-marker md:hidden"
            >
              <Menu className="w-5 h-5" aria-hidden="true" /> Menu
            </button>
          </div>
        </div>
      </header>

      {drawer && (
        <div ref={drawerRef} className="fixed inset-0 z-40 overflow-y-auto bg-canvas md:hidden" role="dialog" aria-modal="true" aria-label="Menu" id="mobile-nav">
          <div className="site-header flex min-h-[4.5rem] items-center justify-between px-4 sm:px-6">
            <Wordmark onClick={() => closeDrawer(pathname === "/")} />
            <button
              type="button"
              ref={drawerCloseRef}
              onClick={() => closeDrawer()}
              className="bau-button inline-flex min-h-11 min-w-11 items-center justify-center bg-white hover:bg-marker"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Main" className="px-4 sm:px-6 py-5 space-y-6">
            <Link href="/" onClick={() => closeDrawer(pathname === "/")} aria-current={current === "/" ? "page" : undefined} className="block border-2 border-line-strong bg-surface px-3 py-2 text-lg font-bold aria-[current=page]:bg-marker">
              Today
            </Link>
            {NAV.map((group) => (
              <div key={group.label}>
                <h2 className="border-2 border-line-strong bg-primary px-3 py-2 text-xs font-bold uppercase tracking-widest text-white">{group.label}</h2>
                <ul className="divide-y divide-line border-x-2 border-b-2 border-line-strong bg-surface">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => closeDrawer(pathname === item.href)}
                        aria-current={item.href === current ? "page" : undefined}
                        className={`flex min-h-11 items-center px-3 py-2 ${item.href === current ? "bg-marker font-bold" : "hover:bg-sunken"}`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <Link href={SETTINGS.href} onClick={() => closeDrawer(pathname === SETTINGS.href)} aria-current={current === SETTINGS.href ? "page" : undefined} className="flex min-h-11 items-center gap-2.5 border-2 border-line-strong bg-surface px-3 py-2 font-bold aria-[current=page]:bg-marker">
              <SETTINGS.icon className="w-4 h-4" aria-hidden="true" />
              Settings
            </Link>
          </nav>
        </div>
      )}

      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <footer className="site-footer">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-5 px-4 py-7 sm:px-6 lg:px-10">
          <div>
            <p className="text-lg font-black uppercase tracking-tight">EU Researcher</p>
            <p className="text-sm">Enel EU Affairs</p>
          </div>
          <a href="#top" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold uppercase tracking-wide hover:text-marker">
            Back to top <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </footer>
    </div>
  );
}
