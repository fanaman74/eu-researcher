"use client";

import React, { useState } from "react";
import { Badge, Card, EmptyState, Field, Loadable, Page, SearchBox, Segmented, SourceNote, formatDate, formatStamp, inputClass, useApi } from "@/components/ui";
import type { MarketSnapshot, PressItem } from "@/lib/types";

type Filter = "all" | "stateAid";

function Market() {
  const [zone, setZone] = useState("IT-North");
  const { data, loading, error, reload } = useApi<{ market: MarketSnapshot; zones: string[] }>(`/api/context?view=market&zone=${zone}`);
  const m = data?.market;
  const days = m?.days.slice(-14) ?? [];
  const peak = Math.max(1, ...days.map((d) => d.avg));
  const latest = days[days.length - 1];
  const previous = days[days.length - 2];

  return (
    <Card title="Italian electricity market">
      <Loadable loading={loading && !data} error={error} onRetry={reload} message="Loading market data…">
        {m && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h3 className="font-semibold text-fg">Day-ahead price, daily average</h3>
                <div className="w-48">
                  <Field label="Bidding zone">
                    {(p) => (
                      <select {...p} className={inputClass} value={zone} onChange={(e) => setZone(e.target.value)}>
                        {(data?.zones ?? [zone]).map((z) => <option key={z} value={z}>{z}</option>)}
                      </select>
                    )}
                  </Field>
                </div>
              </div>
              {latest ? (
                <>
                  <p className="text-base text-muted">
                    <span className="text-3xl font-semibold tabular-nums text-fg">{latest.avg.toFixed(1)}</span> {m.unit} on {formatDate(latest.date)}
                    <span className="block text-sm text-subtle">
                      Range {latest.min.toFixed(1)}–{latest.max.toFixed(1)}
                      {previous && `; the day before averaged ${previous.avg.toFixed(1)}`}
                    </span>
                  </p>
                  <div className="flex items-end gap-1 h-32 border-b border-line" role="img" aria-label={`Daily average price over the last ${days.length} days, from ${days[0].avg.toFixed(0)} to ${latest.avg.toFixed(0)} ${m.unit}`}>
                    {days.map((d) => (
                      <div key={d.date} className="flex-1 flex flex-col justify-end h-full" title={`${formatDate(d.date)}: ${d.avg.toFixed(1)} ${m.unit}`}>
                        <div className={`rounded-t ${d === latest ? "bg-primary" : "bg-line-strong"}`} style={{ height: `${(d.avg / peak) * 100}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm text-subtle"><span>{formatDate(days[0].date)}</span><span>{formatDate(latest.date)}</span></div>
                  <details className="text-sm">
                    <summary className="text-link">Show the numbers</summary>
                    <table className="mt-2 w-full text-sm tabular-nums">
                      <thead><tr className="text-subtle text-left"><th className="py-1">Day</th><th className="py-1 text-right">Average</th><th className="py-1 text-right">Min</th><th className="py-1 text-right">Max</th></tr></thead>
                      <tbody>
                        {days.map((d) => (
                          <tr key={d.date} className="border-t border-line"><td className="py-1">{formatDate(d.date)}</td><td className="py-1 text-right">{d.avg.toFixed(1)}</td><td className="py-1 text-right">{d.min.toFixed(1)}</td><td className="py-1 text-right">{d.max.toFixed(1)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                </>
              ) : (
                <p className="text-sm text-muted">No price data was returned for this zone.</p>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-fg">Generation mix, Italy{m.mix && `, ${formatDate(m.mix.date)}`}</h3>
              {m.mix ? (
                <>
                  {m.mix.renewableShare !== null && (
                    <p className="text-base text-muted">
                      <span className="text-3xl font-semibold tabular-nums text-fg">{m.mix.renewableShare.toFixed(1)}%</span> of generation was renewable
                    </p>
                  )}
                  <ul className="space-y-2">
                    {m.mix.sources.slice(0, 8).map((s) => (
                      <li key={s.name} className="text-sm">
                        <div className="flex justify-between gap-3"><span className="text-fg">{s.name}</span><span className="tabular-nums text-muted">{s.share.toFixed(1)}% · {s.gwh.toFixed(0)} GWh</span></div>
                        <div className="h-2 mt-1 rounded bg-sunken overflow-hidden" aria-hidden="true"><div className="h-full bg-primary" style={{ width: `${s.share}%` }} /></div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-muted">Generation data is not available right now.</p>
              )}
            </div>
          </div>
        )}
      </Loadable>
      <p className="text-sm text-subtle mt-6">
        Source: Energy-Charts (Fraunhofer ISE){m?.license && `; price data ${m.license}`}. Prices are per bidding zone; this source does not publish the
        national single price (PUN). Mix shares are of net generation and exclude imports.
      </p>
    </Card>
  );
}

export default function ContextPage() {
  const { data, loading, error, reload } = useApi<{ items: PressItem[]; fetchedAt: string | null }>("/api/context");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const needle = search.trim().toLowerCase();
  const items = (data?.items ?? [])
    .filter((p) => filter === "all" || p.stateAid)
    .filter((p) => !needle || `${p.title} ${p.lead}`.toLowerCase().includes(needle));

  return (
    <Page>
      <Market />

      <section aria-labelledby="press" className="space-y-4">
        <h2 id="press" className="text-lg font-semibold text-fg">Commission announcements on energy</h2>
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <Segmented label="Show" options={[{ value: "all", label: "All energy items" }, { value: "stateAid", label: "State aid only" }]} value={filter} onChange={setFilter} />
          <div className="lg:w-96">
            <SearchBox label="Filter announcements" hideLabel value={search} onChange={setSearch} placeholder="Filter announcements" />
          </div>
        </div>

        <Loadable loading={loading} error={error} onRetry={reload} message="Loading Commission announcements…">
          {items.length === 0 ? (
            <EmptyState title="No announcements match" />
          ) : (
            <ul className="space-y-3">
              {items.map((p) => (
                <li key={p.ref} className="bg-surface border border-line rounded-lg shadow-card p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
                    <span className="font-semibold text-fg tabular-nums">{formatDate(p.date)}</span>
                    <Badge>{p.type}</Badge>
                    {p.stateAid && <Badge tone="warning">State aid</Badge>}
                    <span className="font-mono text-xs">{p.ref}</span>
                  </div>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="block mt-1.5 font-medium text-fg hover:text-link hover:underline">
                    {p.title}<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  {p.lead && <p className="text-sm text-muted mt-1 line-clamp-3 max-w-prose">{p.lead}</p>}
                </li>
              ))}
            </ul>
          )}
        </Loadable>
      </section>

      <SourceNote>
        Source: European Commission press corner, latest 300 items filtered by energy terms in the title and summary.{data?.fetchedAt && <> Loaded {formatStamp(data.fetchedAt)}.</>}
        State-aid items are press announcements only; the competition case register has no data service.
      </SourceNote>
    </Page>
  );
}
