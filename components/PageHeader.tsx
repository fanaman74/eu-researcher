"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export interface PageHeaderProps {
  /** Route to navigate back to */
  backHref: string;
  /** Back button label */
  backLabel?: string;
  /** Status badge text (e.g., "Comitology Watcher") */
  badge: string;
  /** Accent color for the status dot and badge */
  accent?: "emerald" | "cyan" | "purple" | "fuchsia" | "amber";
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
}: PageHeaderProps) {
  const dotColors = {
    emerald: "bg-emerald-500 shadow-[0_0_10px_#10b981]",
    cyan: "bg-cyan-500 shadow-[0_0_10px_#06b6d4]",
    purple: "bg-purple-500 shadow-[0_0_10px_#a855f7]",
    fuchsia: "bg-fuchsia-500 shadow-[0_0_10px_#d946ef]",
    amber: "bg-amber-500 shadow-[0_0_10px_#f59e0b]",
  };

  const badgeColors = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    fuchsia: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className="flex items-center justify-between border-b border-slate-900 pb-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl"
      >
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </Link>
      <div className="flex items-center gap-3">
        <span className={`w-2.5 h-2.5 rounded-full ${dotColors[accent]} animate-pulse`} />
        <span className={`text-xs font-bold font-mono uppercase tracking-widest px-3 py-1 rounded-full border ${badgeColors[accent]}`}>
          {badge}
        </span>
      </div>
    </div>
  );
}
