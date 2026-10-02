"use client";

import React from "react";
import Link from "next/link";
import { Card, ContentsLine, ErrorState, Page, formatDate, linkClass, plural, useApi } from "@/components/ui";
import { NAV } from "@/lib/navigation";
import type { Digest } from "@/lib/digest";
import type { Dossier } from "@/lib/types";

export default function HomePage() {
  const digest = useApi<{ digest: Digest }>("/api/changes?view=digest&hours=24");
  const files = useApi<{ dossiers: Dossier[] }>("/api/dossiers");

  const d = digest.data?.digest;
  const changes = d?.sections.reduce((n, s) => n + s.changes.length, 0);
  const dossiers = files.data?.dossiers ?? [];
  const inNegotiation = dossiers.filter((x) => /negotiation|trilogue/i.test(x.lastActivity?.label ?? "")).length;
  const pending = (v: number | undefined, loading: boolean, error: boolean) => (loading ? "…" : error || v === undefined ? "—" : v);

  return (
    <Page title="Today" description="What changed, what is due, and where each watched file stands.">
      <section aria-label="Today's contents" className="border-t border-line">
        <ContentsLine label="Changes since yesterday" hint="the daily digest" value={pending(changes, digest.loading, digest.error)} href="/enel/digest" />
        <ContentsLine label="Consultations closing within 14 days" hint="the calendar" value={pending(d?.deadlines.length, digest.loading, digest.error)} href="/enel/calendar" />
        <ContentsLine label="Watched files in negotiation" hint="trilogues under way" value={pending(files.data ? inNegotiation : undefined, files.loading, files.error)} href="/enel/dossiers" />
        <ContentsLine label="Watched legislative files" hint="stage, rapporteurs and votes" value={pending(files.data ? dossiers.length : undefined, files.loading, files.error)} href="/enel/dossiers" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
        <Card title="Deadlines" actions={<Link href="/enel/calendar" className={`text-sm ${linkClass}`}>Full calendar</Link>}>
          {digest.error ? (
            <ErrorState onRetry={digest.reload} />
          ) : !d ? (
            <p className="text-sm text-muted" role="status">Loading deadlines… The first load of the day can take up to 30 seconds.</p>
          ) : d.deadlines.length === 0 ? (
            <p className="text-sm text-muted">No consultation closes in the next 14 days.</p>
          ) : (
            <ul className="divide-y divide-line">
              {d.deadlines.map((x) => (
                <li key={x.id} className="py-3 first:pt-0 grid grid-cols-[6.5rem_1fr] gap-4">
                  <span className="font-serif font-bold text-fg">{formatDate(x.feedbackEnd)}</span>
                  <span>
                    <a href={x.url} target="_blank" rel="noopener noreferrer" className="text-fg hover:text-link hover:underline">{x.title}</a>
                    <span className="block text-sm text-subtle">
                      {plural(x.totalFeedback, "response")} so far ·{" "}
                      <Link href={`/enel/peers?pid=${x.id}`} className={linkClass}>see peer responses</Link>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Legislative files" actions={<Link href="/enel/dossiers" className={`text-sm ${linkClass}`}>All files</Link>}>
          {files.error ? (
            <ErrorState onRetry={files.reload} />
          ) : !files.data ? (
            <p className="text-sm text-muted" role="status">Loading files…</p>
          ) : (
            <ul className="divide-y divide-line">
              {dossiers.map((x) => (
                <li key={x.id} className="py-3 first:pt-0">
                  <Link href={`/enel/dossiers/${x.id}`} className="font-serif font-semibold text-fg hover:text-link hover:underline">{x.name}</Link>
                  <span className="block text-sm text-subtle">
                    {x.lastActivity ? `${x.lastActivity.label}, ${formatDate(x.lastActivity.date)}` : x.stage}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Index">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-10 gap-y-8">
          {NAV.map((group) => (
            <div key={group.label}>
              <h3 className="pb-1.5 mb-1 border-b border-line-strong font-sans text-xs font-semibold uppercase tracking-[0.08em] text-subtle">{group.label}</h3>
              <ul className="divide-y divide-line">
                {group.items.map((item) => (
                  <li key={item.href} className="py-2.5">
                    <Link href={item.href} className="font-semibold text-link hover:underline">{item.label}</Link>
                    <span className="block text-sm text-muted">{item.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {d && !d.persistent && (
        <p className="text-sm text-subtle">Change history is kept in server memory only, so it restarts when the server does.</p>
      )}
    </Page>
  );
}
