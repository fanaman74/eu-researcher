"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

export type PageHeaderAccent = "emerald" | "cyan" | "purple" | "fuchsia" | "amber" | "blue";

export interface PageHeaderProps {
  /** Route to navigate back to */
  backHref: string;
  /** Back button label */
  backLabel?: string;
  /** Status badge text (e.g., "Comitology Watcher") */
  badge: string;
  /** Accent color for the status dot and badge */
  accent?: PageHeaderAccent;
  /** Optional icon shown in a box next to the title block */
  icon?: LucideIcon;
  /** Optional page title rendered next to the back link (badge moves inline with it) */
  title?: string;
  /** Optional subtitle under the title */
  subtitle?: string;
  /** Extra content rendered on the right side, before the status badge */
  rightSlot?: React.ReactNode;
}

/**
 * Reusable page header with back navigation and status badge.
 * Replaces the duplicated header pattern across 10+ pages.
 */
export default function PageHeader({
  backHref,
  backLabel = "Back to Dashboard",
  badge,
  accent = "emerald",
  icon: Icon,
  title,
  subtitle,
  rightSlot,
}: PageHeaderProps) {
  const dotColors: Record<PageHeaderAccent, string> = {
    emerald: "bg-emerald-500 shadow-[0_0_10px_#10b981]",
    cyan: "bg-cyan-500 shadow-[0_0_10px_#06b6d4]",
    purple: "bg-purple-500 shadow-[0_0_10px_#a855f7]",
    fuchsia: "bg-fuchsia-500 shadow-[0_0_10px_#d946ef]",
    amber: "bg-amber-500 shadow-[0_0_10px_#f59e0b]",
    blue: "bg-blue-500 shadow-[0_0_10px_#3b82f6]",
  };

  const badgeColors: Record<PageHeaderAccent, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    fuchsia: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };

  const iconColors: Record<PageHeaderAccent, string> = {
    emerald: "text-emerald-400",
    cyan: "text-cyan-400",
    purple: "text-purple-400",
    fuchsia: "text-fuchsia-400",
    amber: "text-amber-400",
    blue: "text-blue-400",
  };

  return (
    <div className="flex items-center justify-between border-b border-slate-900 pb-6 gap-4 flex-wrap">
      <div className="flex items-center gap-4 flex-wrap">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </Link>
        {title && (
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`w-10 h-10 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 ${iconColors[accent]}`}>
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
                <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeColors[accent]}`}>
                  {badge}
                </span>
              </div>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {rightSlot}
        {!title && (
          <>
            <span className={`w-2.5 h-2.5 rounded-full ${dotColors[accent]} animate-pulse`} />
            <span className={`text-xs font-bold font-mono uppercase tracking-widest px-3 py-1 rounded-full border ${badgeColors[accent]}`}>
              {badge}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
