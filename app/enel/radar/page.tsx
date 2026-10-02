"use client";

import React, { useState } from "react";
import { Radar } from "lucide-react";
import HubShell, { Card, Chip, Loadable, Segmented, SourceNote, formatStamp, inputClass, linkClass, useApi } from "@/components/HubShell";
import type { RadarItem } from "@/lib/types";

type View = "Upcoming" | "Overdue" | "Adopted";
const VIEWS: { value: View; label: string }[] = [
  { value: "Upcoming", label: "Upcoming" },
  { value: "Overdue", label: "Past planned quarter" },
  { value: "Adopted", label: "Adopted" },
];

interface RadarResponse {
  items: RadarItem[];
  total: number;
  fetchedAt: string | null;
}

export default function RadarPage() {
  const { data, loading, error, reload } = useApi<RadarResponse>("/api/radar?all=1");
  const [view, setView] = useState<View>("Upcoming");
  const [search, setSearch] = useState("");

  const needle = search.trim().toLowerCase();
  const items = (data?.items ?? [])
    .filter((i) => i.status === view)
    .filter((i) => !needle || `${i.title} ${i.actType} ${i.stage}`.toLowerCase().includes(needle))
    .sort((a, b) =>
      view === "Upcoming"
        ? (a.plannedSort ?? "9999").localeCompare(b.plannedSort ?? "9999") || a.title.localeCompare(b.title)
        : (b.adoptionDate ?? b.plannedSort ?? "").localeCompare(a.adoptionDate ?? a.plannedSort ?? "")
    );
  const count = (v: View) => (data?.items ?? []).filter((i) => i.status === v).length;

  return (
    <HubShell title="Radar" subtitle="What the Commission plans in energy: act type, stage and planned quarter" badge="Commission pipeline" icon={Radar}>
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <Segmented options={VIEWS.map((v) => ({ ...v, label: data ? `${v.label} (${count(v.value)})` : v.label }))} value={view} onChange={setView} />
        <input className={`${inputClass} md:max-w-sm`} placeholder="Filter by title, act type or stage" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Filter initiatives" />
      </div>

      <Loadable loading={loading} error={error} onRetry={reload} message="Reading the Commission pipeline (about 30 seconds on first load)...">
        <Card className="p-0 overflow-hidden">
          {items.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400 italic">No initiatives match.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="p-3 w-28">{view === "Adopted" ? "Adopted" : "Planned"}</th>
                    <th className="p-3 min-w-[280px]">Initiative</th>
                    <th className="p-3 w-48">Act type</th>
                    <th className="p-3 w-40">Stage</th>
                    <th className="p-3 w-44">Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {items.map((i) => (
                    <tr key={i.id} className="align-top hover:bg-slate-900/40">
                      <td className="p-3 font-mono font-semibold text-slate-200 whitespace-nowrap">
                        {view === "Adopted" ? i.adoptionDate : i.plannedPeriod ?? <span className="text-slate-500 font-normal">No quarter</span>}
                      </td>
                      <td className="p-3">
                        <a href={i.url} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-100 hover:text-blue-400">
                          {i.title}
                        </a>
                        {i.major && <span className="ml-2"><Chip tone="blue">Major</Chip></span>}
                        {i.summary && <p className="mt-1 text-[11px] text-slate-400 leading-relaxed line-clamp-2">{i.summary}</p>}
                      </td>
                      <td className="p-3 text-slate-300">{i.actType || "—"}</td>
                      <td className="p-3 text-slate-300">{i.stage}</td>
                      <td className="p-3">
                        {i.feedback === "Open" ? (
                          <Chip tone="green">Open until {i.feedbackEnd}</Chip>
                        ) : i.feedback === "Upcoming" ? (
                          <Chip tone="amber">Upcoming</Chip>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                        {i.totalFeedback > 0 && (
                          <a href={`/enel/peers?pid=${i.id}`} className={`block mt-1 text-[11px] ${linkClass}`}>
                            {i.totalFeedback.toLocaleString("en-GB")} {i.totalFeedback === 1 ? "response" : "responses"} · peers
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Loadable>

      <SourceNote>
        Source: European Commission, Have Your Say (energy-tagged initiatives only; grid-relevant files tagged under other topics are not listed). Planned
        quarters are the Commission&apos;s indicative planning and often slip. &quot;Past planned quarter&quot; means the quarter has passed with no adoption
        recorded; older entries are mostly stale planning records. Loaded {formatStamp(data?.fetchedAt)}.
      </SourceNote>
    </HubShell>
  );
}
