"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { Badge, EmptyState, ErrorState, Loading, Notice, formatDate, linkClass, useApi } from "@/components/ui";
import type { OfficeNewsItem, OfficeNewsResponse } from "@/lib/officeNews";

export type { OfficeNewsItem, OfficeNewsResponse } from "@/lib/officeNews";

const API_URL = "/api/office-news";
const CATEGORY_LABELS: Record<string, string> = {
  grids: "Grids",
  renewables: "Renewables",
  funding: "Funding",
  regulation: "Regulation",
  consultations: "Consultations",
  "state-aid": "State aid",
  "energy-policy": "Energy policy",
};

function categoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Fetch once, then schedule a single refresh after the next Brussels update window. */
export function useOfficeNews() {
  const { data, loading, error, reload } = useApi<OfficeNewsResponse>(API_URL);
  const refreshKey = data?.nextUpdateAt ?? null;
  const refreshedFor = useRef<string | null>(null);

  const refreshIfDue = useCallback(() => {
    if (!refreshKey || refreshedFor.current === refreshKey) return;
    if (Date.now() < new Date(refreshKey).getTime() + 60_000) return;
    refreshedFor.current = refreshKey;
    reload();
  }, [refreshKey, reload]);

  useEffect(() => {
    if (!refreshKey) return;
    const wait = Math.max(0, new Date(refreshKey).getTime() + 60_000 - Date.now());
    const timer = window.setTimeout(refreshIfDue, wait);
    return () => window.clearTimeout(timer);
  }, [refreshIfDue, refreshKey]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshIfDue();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [refreshIfDue]);

  return { data, loading, error, reload };
}

export function brusselsStamp(iso: string | null | undefined) {
  if (!iso) return "not recorded";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Brussels",
    timeZoneName: "short",
  });
}

export function OfficeNewsList({ items, limit = 12, compact = false }: { items: OfficeNewsItem[]; limit?: number; compact?: boolean }) {
  const visible = items.slice(0, limit);
  if (visible.length === 0) return <EmptyState title="No office news is available" message="The latest scheduled check returned no relevant official updates." />;

  return (
    <ul className={compact ? "divide-y divide-line" : "divide-y divide-line border-y border-line"}>
      {visible.map((item) => (
        <li key={item.id} className="py-5 first:pt-4 last:pb-4">
          <article className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
              <time dateTime={item.publishedAt} className="font-semibold tabular-nums text-fg">{formatDate(item.publishedAt)}</time>
              <Badge>{categoryLabel(item.category)}</Badge>
              <span>{item.source}</span>
            </div>
            <h3 className={`${compact ? "text-lg" : "text-xl"} font-bold text-fg`}>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className={`${linkClass} inline-flex items-start gap-1`}>
                {item.title}<ArrowUpRight className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
              </a>
            </h3>
            {item.summary.trim() !== item.title.trim() && <p className="max-w-3xl text-sm text-muted">{item.summary}</p>}
            <p className="max-w-3xl text-sm text-fg"><strong>Why it matters:</strong> {item.whyItMatters}</p>
            <p className="max-w-3xl text-sm text-muted"><strong className="text-fg">Action:</strong> {item.action}</p>
          </article>
        </li>
      ))}
    </ul>
  );
}

export function OfficeNews({
  data,
  loading,
  error,
  onRetry,
  limit = 12,
  compact = false,
  showSchedule = false,
}: {
  data: OfficeNewsResponse | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  limit?: number;
  compact?: boolean;
  showSchedule?: boolean;
}) {
  if (loading && !data) return <Loading message="Loading office news from official sources…" rows={compact ? 3 : 5} />;
  if (error && !data) return <ErrorState title="Office news could not be loaded" message="The scheduled source did not respond. Try again to request the latest update." onRetry={onRetry} />;

  return (
    <div className="space-y-4">
      {error && data && <Notice tone="danger"><span className="font-semibold">The latest office-news check failed.</span> Showing the most recent saved results. <button type="button" onClick={onRetry} className="ml-1 underline underline-offset-2">Try again</button></Notice>}
      {data?.status === "stale" && <Notice tone="warning"><span className="font-semibold">Office news is stale.</span> The last successful check was {brusselsStamp(data.checkedAt)}.{data.error ? ` ${data.error}` : ""}</Notice>}
      {data?.status === "unavailable" && <Notice tone="danger"><AlertTriangle className="mr-1 inline-block h-4 w-4 align-text-bottom" aria-hidden="true" /><span className="font-semibold">Office news is temporarily unavailable.</span>{data.error ? ` ${data.error}` : " The source did not return a usable update."} The next scheduled check is listed below.</Notice>}
      {data && data.status !== "unavailable" && <OfficeNewsList items={data.items} limit={limit} compact={compact} />}
      {showSchedule && data && (
        <p className="text-sm text-subtle">
          {data.checkedAt ? <>Checked {brusselsStamp(data.checkedAt)}.</> : <>No successful check recorded.</>} {data.status !== "live" && data.attemptedAt && data.attemptedAt !== data.checkedAt && <>Last attempted {brusselsStamp(data.attemptedAt)}. </>} Updates are scheduled daily at {data.schedule.join(", ")} Brussels time; next update {brusselsStamp(data.nextUpdateAt)}.
        </p>
      )}
    </div>
  );
}

export function OfficeNewsSourceNote({ data }: { data: OfficeNewsResponse | null }) {
  if (!data) return null;
  return <p className="text-sm text-subtle">Source: European Commission Press Corner. Follow-up suggestions are editorial topic matching; they are not AI forecasts.</p>;
}
