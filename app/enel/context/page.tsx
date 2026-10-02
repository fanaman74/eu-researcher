"use client";

import React, { useState } from "react";
import { Newspaper } from "lucide-react";
import HubShell, { Card, Chip, Loadable, Segmented, SourceNote, formatStamp, inputClass, useApi } from "@/components/HubShell";
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
    <Card title="Italian market context">
      <Loadable loading={loading && !data} error={error} onRetry={reload} message="Loading market data...">
        {m && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold text-slate-300">Day-ahead price, daily average ({m.unit})</h3>
                <select className={`${inputClass} w-auto`} value={zone} onChange={(e) => setZone(e.target.value)} aria-label="Bidding zone">
                  {(data?.zones ?? [zone]).map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              {latest ? (
                <>
                  <p className="text-xs text-slate-400">
                    <span className="text-2xl font-bold font-mono text-white">{latest.avg.toFixed(1)}</span> on {latest.date} (range {latest.min.toFixed(1)}–{latest.max.toFixed(1)})
                    {previous && <>; previous day {previous.avg.toFixed(1)}</>}
                  </p>
                  <div className="flex items-end gap-1 h-28" role="img" aria-label={`Daily average price for the last ${days.length} days`}>
                    {days.map((d) => (
                      <div key={d.date} className="flex-1 flex flex-col justify-end h-full" title={`${d.date}: ${d.avg.toFixed(1)} ${m.unit}`}>
                        <div className={`rounded-t ${d === latest ? "bg-blue-500" : "bg-slate-600"}`} style={{ height: `${(d.avg / peak) * 100}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500"><span>{days[0].date}</span><span>{latest.date}</span></div>
                </>
              ) : (
                <p className="text-xs text-slate-400">No price data returned for this zone.</p>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-300">Generation mix, Italy{m.mix && ` — ${m.mix.date}`}</h3>
              {m.mix ? (
                <>
                  {m.mix.renewableShare !== null && (
                    <p className="text-xs text-slate-400"><span className="text-2xl font-bold font-mono text-white">{m.mix.renewableShare.toFixed(1)}%</span> renewable share of generation</p>
                  )}
                  <ul className="space-y-1.5">
                    {m.mix.sources.slice(0, 8).map((s) => (
                      <li key={s.name} className="text-xs">
                        <div className="flex justify-between text-slate-300"><span>{s.name}</span><span className="font-mono">{s.share.toFixed(1)}% · {s.gwh.toFixed(0)} GWh</span></div>
                        <div className="h-1 mt-0.5 rounded bg-slate-800 overflow-hidden" aria-hidden="true"><div className="h-full bg-slate-500" style={{ width: `${s.share}%` }} /></div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-xs text-slate-400">Generation data is not available right now.</p>
              )}
            </div>
          </div>
        )}
      </Loadable>
      <p className="text-[11px] text-slate-500 mt-4">
        Source: Energy-Charts (Fraunhofer ISE){m?.license && `; price data ${m.license}`}. Prices are per bidding zone; the national single price (PUN) is not
        published by this source. Mix shares are of net generation and exclude imports.
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
    <HubShell title="Announcements and market" subtitle="Commission press announcements on energy, and Italian price and generation data to quote" badge="Context" icon={Newspaper}>
      <Market />

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <Segmented options={[{ value: "all", label: "All energy items" }, { value: "stateAid", label: "State aid only" }]} value={filter} onChange={setFilter} />
        <input className={`${inputClass} md:max-w-sm`} placeholder="Filter announcements" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Filter announcements" />
      </div>

      <Loadable loading={loading} error={error} onRetry={reload} message="Loading Commission announcements...">
        <div className="space-y-2">
          {items.length === 0 && <p className="text-xs text-slate-400 italic">No announcements match.</p>}
          {items.map((p) => (
            <a key={p.ref} href={p.url} target="_blank" rel="noopener noreferrer" className="block bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-lg p-4 transition-colors">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span className="font-mono text-slate-200">{p.date}</span>
                <Chip>{p.type}</Chip>
                {p.stateAid && <Chip tone="amber">State aid</Chip>}
                <span className="font-mono">{p.ref}</span>
              </div>
              <h3 className="text-xs font-bold text-slate-100 mt-1.5">{p.title}</h3>
              {p.lead && <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-3">{p.lead}</p>}
            </a>
          ))}
        </div>
      </Loadable>

      <SourceNote>
        Source: European Commission press corner, latest 300 items filtered by energy keywords in the title and lead. Loaded {formatStamp(data?.fetchedAt)}.
        State-aid items are press announcements only; the competition case register has no data service.
      </SourceNote>
    </HubShell>
  );
}
