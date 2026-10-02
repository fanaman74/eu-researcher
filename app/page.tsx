"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, Card, ErrorState, Page, Stat, formatDate, linkClass, plural, useApi } from "@/components/ui";
import { NAV } from "@/lib/navigation";
import type { Digest } from "@/lib/digest";
import type { Dossier } from "@/lib/types";

const today = () => new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default function HomePage() {
  const digest = useApi<{ digest: Digest }>("/api/changes?view=digest&hours=24");
  const files = useApi<{ dossiers: Dossier[] }>("/api/dossiers");

  const d = digest.data?.digest;
  const changes = d?.sections.reduce((n, s) => n + s.changes.length, 0);
  const dossiers = files.data?.dossiers ?? [];
  const inNegotiation = dossiers.filter((x) => /negotiation|trilogue/i.test(x.lastActivity?.label ?? "")).length;
  const pending = (v: number | undefined, loading: boolean, error: boolean) => (loading ? "…" : error || v === undefined ? "—" : v);

  return (
    <Page title="Today" description={today()}>
      <section aria-label="Summary" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Changes since yesterday" value={pending(changes, digest.loading, digest.error)} hint="Open the daily digest" href="/enel/digest" />
        <Stat label="Consultations closing in 14 days" value={pending(d?.deadlines.length, digest.loading, digest.error)} hint="See the calendar" href="/enel/calendar" />
        <Stat label="Watched files in negotiation" value={pending(files.data ? inNegotiation : undefined, files.loading, files.error)} hint={`Of ${dossiers.length || "…"} legislative files`} href="/enel/dossiers" />
        <Stat label="Watched files" value={pending(files.data ? dossiers.length : undefined, files.loading, files.error)} hint="Stage, rapporteurs and votes" href="/enel/dossiers" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Deadlines coming up" actions={<Link href="/enel/calendar" className={`text-sm ${linkClass}`}>Full calendar</Link>}>
          {digest.error ? (
            <ErrorState onRetry={digest.reload} />
          ) : !d ? (
            <p className="text-sm text-muted" role="status">Loading deadlines… The first load of the day can take up to 30 seconds.</p>
          ) : d.deadlines.length === 0 ? (
            <p className="text-sm text-muted">No consultation closes in the next 14 days.</p>
          ) : (
            <ul className="divide-y divide-line">
              {d.deadlines.map((x) => (
                <li key={x.id} className="py-3 first:pt-0 last:pb-0 flex gap-4">
                  <span className="w-24 shrink-0 text-sm font-medium tabular-nums text-fg">{formatDate(x.feedbackEnd)}</span>
                  <span className="text-sm">
                    <a href={x.url} target="_blank" rel="noopener noreferrer" className="text-fg hover:text-link hover:underline">{x.title}</a>
                    <span className="block text-subtle">
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
                <li key={x.id} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/enel/dossiers/${x.id}`} className="text-sm font-medium text-fg hover:text-link hover:underline">{x.name}</Link>
                  <span className="block text-sm text-subtle">
                    {x.lastActivity ? `${formatDate(x.lastActivity.date)} · ${x.lastActivity.label}` : x.stage}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <section aria-labelledby="tasks" className="space-y-4">
        <h2 id="tasks" className="text-lg font-semibold text-fg">What do you want to do?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {NAV.map((group) => (
            <Card key={group.label} title={group.label}>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link href={item.href} className="group flex gap-3 rounded-md p-2 -mx-2 hover:bg-sunken transition-colors">
                        <Icon className="w-5 h-5 mt-0.5 shrink-0 text-link" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 font-medium text-fg">
                            {item.label}
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                          </span>
                          <span className="block text-sm text-muted">{item.description}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {d && !d.persistent && (
        <p className="text-sm text-subtle">
          <Badge>Note</Badge> Change history is kept in server memory only, so it restarts when the server does.
        </p>
      )}
    </Page>
  );
}
