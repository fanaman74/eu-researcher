"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import { Badge, ButtonLink, Card, EmptyState, Loadable, Notice, Page, Segmented, SourceNote, useApi } from "@/components/ui";
import type { CalendarEvent } from "@/lib/types";

type Kind = "All" | CalendarEvent["kind"];
const KINDS: { value: Kind; label: string }[] = [
  { value: "All", label: "Everything" },
  { value: "Consultation deadline", label: "Consultation deadlines" },
  { value: "Planned adoption", label: "Planned adoptions" },
  { value: "Plenary sitting", label: "Plenary sittings" },
];
const TONES: Record<CalendarEvent["kind"], "success" | "info" | "neutral"> = {
  "Consultation deadline": "success",
  "Planned adoption": "info",
  "Plenary sitting": "neutral",
};

const monthLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const dayLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export default function CalendarPage() {
  const { data, loading, error, reload } = useApi<{ events: CalendarEvent[]; gaps: string[] }>("/api/calendar");
  const [kind, setKind] = useState<Kind>("All");

  const events = (data?.events ?? []).filter((e) => kind === "All" || e.kind === kind);
  const months = new Map<string, CalendarEvent[]>();
  for (const e of events) months.set(e.date.slice(0, 7), [...(months.get(e.date.slice(0, 7)) ?? []), e]);

  return (
    <Page
      actions={
        <ButtonLink href="/api/calendar?format=ics" download variant="primary">
          <Download className="w-4 h-4" aria-hidden="true" /> Add to Outlook (.ics)
        </ButtonLink>
      }
    >
      <Segmented label="Show" options={KINDS} value={kind} onChange={setKind} />

      <Loadable loading={loading} error={error} onRetry={reload} message="Building the calendar…">
        <div className="space-y-4">
          {data?.gaps.map((g) => <Notice key={g} tone="warning">{g}</Notice>)}
          {events.length === 0 && <EmptyState title="Nothing scheduled" message="No events of this type are coming up." />}
          {[...months.entries()].map(([key, list]) => (
            <Card key={key} title={monthLabel(`${key}-01`)}>
              <ul className="divide-y divide-line">
                {list.map((e, n) => (
                  <li key={`${e.date}-${e.kind}-${n}`} className="py-3 first:pt-0 last:pb-0 grid grid-cols-1 sm:grid-cols-[8rem_13rem_1fr] gap-1 sm:gap-4 items-baseline">
                    <span className="text-sm font-semibold tabular-nums text-fg">{dayLabel(e.date)}</span>
                    <span><Badge tone={TONES[e.kind]}>{e.kind}</Badge></span>
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-sm text-fg hover:text-link hover:underline">{e.title}</a>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Loadable>

      <SourceNote>
        Sources: Have Your Say (deadlines and planned quarters) and the European Parliament Open Data Portal (plenary sittings). The Commission plans by
        quarter, not by date, so a planned adoption appears on the last day of its quarter. Not included: Parliament committee meetings (not in the
        Parliament&apos;s data service), the Council calendar (refuses automated access) and transposition deadlines (the source gives conflicting dates).
        The Outlook file is a snapshot; download it again to pick up changes.
      </SourceNote>
    </Page>
  );
}
