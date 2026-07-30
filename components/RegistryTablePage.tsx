"use client";

import React, { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Search, type LucideIcon } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBanner from "./ErrorBanner";
import DemoBadge from "./DemoBadge";

export type RegistryAccent = "emerald" | "cyan" | "purple" | "amber";

export interface RegistryColumn {
  header: string;
  className?: string;
}

export interface RegistryTablePageProps<T> {
  /** Page title shown next to the icon */
  title: string;
  /** Subtitle under the title */
  subtitle: string;
  /** Leading icon for the title */
  icon: LucideIcon;
  /** Accent color identity of the registry */
  accent: RegistryAccent;
  /** API endpoint to fetch (GET) */
  endpoint: string;
  /** Key of the items array in the JSON response (e.g. "questions", "hits") */
  dataKey: string;
  /** Header count badge text, e.g. (n) => `${n} Questions Tracked` */
  countLabel: (count: number) => string;
  /** Table column definitions */
  columns: RegistryColumn[];
  /** Renders a full <tr> (without key) for an item */
  renderRow: (item: T) => ReactNode;
  /** Stable React key for a row */
  rowKey: (item: T) => string;
  searchPlaceholder: string;
  /** Search predicate — may close over extra page-level filters */
  filterItem: (item: T, search: string) => boolean;
  loadingMessage: string;
  emptyMessage: string;
  /** Show the "Demo data" badge next to the title */
  demo?: boolean;
  /** Route for the back link (default "/enel") */
  backHref?: string;
  /** Label for the back link (default "Back to Enel Hub") */
  backLabel?: string;
  /** Extra content rendered between the toolbar and the table (e.g. filter bubbles) */
  toolbarExtras?: ReactNode;
  /** Called whenever items finish loading (lets pages derive extra state) */
  onLoaded?: (items: T[]) => void;
}

const accentStyles: Record<RegistryAccent, { icon: string; dot: string; focus: string; glow: string }> = {
  emerald: {
    icon: "text-emerald-400",
    dot: "bg-emerald-400 shadow-[0_0_8px_#10b981]",
    focus: "focus:border-emerald-500/40",
    glow: "bg-emerald-500/5",
  },
  cyan: {
    icon: "text-cyan-400",
    dot: "bg-cyan-400 shadow-[0_0_8px_#06b6d4]",
    focus: "focus:border-cyan-500/40",
    glow: "bg-cyan-500/5",
  },
  purple: {
    icon: "text-purple-400",
    dot: "bg-purple-400 shadow-[0_0_8px_#a855f7]",
    focus: "focus:border-purple-500/40",
    glow: "bg-purple-500/5",
  },
  amber: {
    icon: "text-amber-400",
    dot: "bg-amber-400 shadow-[0_0_8px_#f59e0b]",
    focus: "focus:border-amber-500/40",
    glow: "bg-amber-500/5",
  },
};

/**
 * Shared scaffold for the ENEL registry pages (header, search toolbar,
 * loading/error/empty states, and table shell). Pages only supply column
 * definitions and row renderers.
 */
export default function RegistryTablePage<T>({
  title,
  subtitle,
  icon: Icon,
  accent,
  endpoint,
  dataKey,
  countLabel,
  columns,
  renderRow,
  rowKey,
  searchPlaceholder,
  filterItem,
  loadingMessage,
  emptyMessage,
  demo = false,
  backHref = "/enel",
  backLabel = "Back to Enel Hub",
  toolbarExtras,
  onLoaded,
}: RegistryTablePageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data?.[dataKey]) ? (data[dataKey] as T[]) : [];
      setItems(list);
      onLoadedRef.current?.(list);
    } catch (err) {
      console.error(`Error fetching ${title}:`, err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [endpoint, dataKey, title]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = items.filter((item) => filterItem(item, search));
  const a = accentStyles[accent];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-teal-500/30 selection:text-teal-200">

      {/* Background Glow */}
      <div className={`absolute top-1/4 left-10 w-[500px] h-[500px] ${a.glow} rounded-full blur-[140px] pointer-events-none`} />

      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 space-y-8 z-10">

        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" /> {backLabel}
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-white flex items-center gap-2 flex-wrap">
                <Icon className={`w-5.5 h-5.5 ${a.icon}`} /> {title} {demo && <DemoBadge />}
              </h1>
              <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${a.dot} animate-pulse`} />
            <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              {loading ? "..." : countLabel(items.length)}
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 backdrop-blur-md">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-900 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none ${a.focus}`}
            />
          </div>
        </div>

        {toolbarExtras}

        {/* Tabular View */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden backdrop-blur-md">
          {loading ? (
            <LoadingSpinner message={loadingMessage} accent={accent} size="md" />
          ) : error ? (
            <div className="p-6">
              <ErrorBanner onRetry={fetchData} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center text-slate-500 italic text-xs">
              {emptyMessage}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {columns.map((col) => (
                      <th key={col.header} className={col.className ?? "p-4"}>{col.header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {filtered.map((item) => (
                    <React.Fragment key={rowKey(item)}>{renderRow(item)}</React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
