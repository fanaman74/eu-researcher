"use client";

import React, { useState } from "react";
import { CalendarDays, Download } from "lucide-react";
import HubShell, { Card, Chip, Loadable, Segmented, SourceNote, buttonClass, useApi } from "@/components/HubShell";
import type { CalendarEvent } from "@/lib/types";

type Kind = "All" | CalendarEvent["kind"];
const KINDS: { value: Kind; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Consultation deadline", label: "Consultation deadlines" },
  { value: "Planned adoption", label: "Planned adoptions" },
  { value: "Plenary sitting", label: "Plenary sittings" },
];
const TONES: Record<CalendarEvent["kind"], "green" | "blue" | "neutral"> = {
  "Consultation deadline": "green",
  "Planned adoption": "blue",
  "Plenary sitting": "neutral",
};

const monthLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const dayLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export default function CalendarPage() {
  const { data, loading, error, reload } = useApi<{ events: CalendarEvent[]; gaps: string[] }>("/api/calendar");
  const [kind, setKind] = useState<Kind>("All");

  const events = (data?.events ?? []).filter((e) => kind === "All" || e.kind === kind);
  const months = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = e.date.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), e]);
  }

  return (
    <HubShell
      title="Regulatory calendar"
      subtitle="Consultation deadlines, planned Commission adoptions and Parliament plenary sittings"
      badge="By date"
      icon={CalendarDays}
      rightSlot={
        <a className={buttonClass} href="/api/calendar?format=ics" download>
          <Download className="w-3.5 h-3.5" /> Add to Outlook (.ics)
        </a>
      }
    >
      <Segmented options={KINDS} value={kind} onChange={setKind} />

      <Loadable loading={loading} error={error} onRetry={reload} message="Building the calendar (about 30 seconds on first load)...">
        {data?.gaps.map((g) => <p key={g} className="text-xs text-amber-400">{g}</p>)}
        {events.length === 0 && <p className="text-xs text-slate-400 italic">Nothing scheduled.</p>}
        <div className="space-y-4">
          {[...months.entries()].map(([key, list]) => (
            <Card key={key} title={monthLabel(`${key}-01`)}>
              <ul className="divide-y divide-slate-800/60">
                {list.map((e, n) => (
                  <li key={`${e.date}-${e.kind}-${n}`} className="py-2 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-xs">
                    <span className="font-mono text-slate-300 w-28 shrink-0">{dayLabel(e.date)}</span>
                    <span className="w-44 shrink-0"><Chip tone={TONES[e.kind]}>{e.kind}</Chip></span>
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-slate-200 hover:text-blue-400">{e.title}</a>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Loadable>

      <SourceNote>
        Sources: Have Your Say (deadlines and planned quarters) and the European Parliament Open Data Portal (plenary sittings). A planned adoption is
        shown on the last day of its quarter; the Commission publishes a quarter, not a date. Not covered: Parliament committee meetings (not in the
        Parliament&apos;s data service), the Council calendar (refuses automated access) and transposition deadlines (the source carries several
        conflicting dates per directive). The .ics file is a snapshot; download it again to pick up changes.
      </SourceNote>
    </HubShell>
  );
}
