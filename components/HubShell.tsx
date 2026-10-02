"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import PageHeader from "./PageHeader";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBanner from "./ErrorBanner";

/** GET a JSON endpoint; `url = null` skips the request. */
export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!url) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      setData(await res.json());
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export interface HubShellProps {
  title: string;
  subtitle: string;
  badge: string;
  icon: LucideIcon;
  backHref?: string;
  backLabel?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}

/** Page frame shared by the Enel hub workspaces. */
export default function HubShell({ title, subtitle, badge, icon, backHref = "/enel", backLabel = "Enel Hub", rightSlot, children }: HubShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 space-y-6">
        <PageHeader backHref={backHref} backLabel={backLabel} badge={badge} accent="blue" icon={icon} title={title} subtitle={subtitle} rightSlot={rightSlot} />
        {children}
      </div>
    </div>
  );
}

/** Loading, error and ready states for one request. */
export function Loadable({
  loading,
  error,
  onRetry,
  message,
  children,
}: {
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  message: string;
  children: React.ReactNode;
}) {
  if (loading) return <LoadingSpinner message={message} accent="blue" size="md" />;
  if (error) return <ErrorBanner onRetry={onRetry} />;
  return <>{children}</>;
}

export function Card({ title, children, className = "" }: { title?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-slate-900/60 border border-slate-800 rounded-lg p-5 ${className}`}>
      {title && <h2 className="text-sm font-bold text-slate-200 mb-3">{title}</h2>}
      {children}
    </section>
  );
}

const CHIP_TONES = {
  neutral: "bg-slate-900 text-slate-400 border-slate-800",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: keyof typeof CHIP_TONES }) {
  return (
    <span className={`inline-block text-[10px] font-mono font-semibold uppercase tracking-wide px-2 py-0.5 rounded border whitespace-nowrap ${CHIP_TONES[tone]}`}>
      {children}
    </span>
  );
}

/** A row of mutually exclusive filter buttons. */
export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex border border-slate-800 p-1 bg-slate-950 rounded-md">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`px-3 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer ${value === o.value ? "bg-slate-800 text-blue-400" : "text-slate-400 hover:text-slate-200"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Small print under a page's content: where the data comes from and what it leaves out. */
export function SourceNote({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-slate-500 leading-relaxed">{children}</p>;
}

export const inputClass =
  "w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/50";
export const buttonClass =
  "inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60";
export const linkClass = "text-blue-400 hover:underline";

export function formatStamp(iso: string | null | undefined): string {
  if (!iso) return "not yet loaded";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
