"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import { Badge, ButtonLink, Card, EmptyState, ExternalLink, Loadable, Notice, Page, Segmented, SourceNote, useApi } from "@/components/ui";
import type { AgendaPart } from "@/lib/calendar";
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

/** The sitting's draft agenda, fetched only when the reader opens it. */
function Agenda({ date }: { date: string }) {
  const { data, loading, error, reload } = useApi<{ agenda: { parts: AgendaPart[]; agendaUrl: string } }>(`/api/calendar?sitting=${date}`);
  if (loading) return <p className="text-sm text-muted" role="status">Loading the agenda…</p>;
  if (error || !data) {
    return (
      <p className="text-sm text-danger" role="alert">
        The agenda could not be loaded. <button type="button" onClick={reload} className="underline">Try again</button>
      </p>
    );
  }
  const { parts, agendaUrl } = data.agenda;
  const energy = parts.flatMap((p) => p.items).filter((i) => i.energy).length;
  if (parts.length === 0) {
    return (
      <p className="text-sm text-muted">
        No agenda published yet. The Parliament usually fills it in during the two weeks before the sitting. <ExternalLink href={agendaUrl}>Official agenda page</ExternalLink>
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {energy > 0 ? `${energy} energy-related ${energy === 1 ? "item" : "items"} on the draft agenda.` : "No energy-related items on the draft agenda so far."}
      </p>
      {parts.map((p, n) => (
        <div key={`${p.time}-${p.label}-${n}`}>
          <h4 className="text-sm font-semibold text-fg">{p.time && <span className="tabular-nums">{p.time} · </span>}{p.label}</h4>
          <ul className="mt-1 space-y-1">
            {p.items.map((i, k) => (
              <li key={k} className="text-sm text-fg flex flex-wrap items-baseline gap-x-2">
                <span className="text-subtle w-14 shrink-0">{i.kind}</span>
                <span className="flex-1 min-w-48">{i.title}</span>
                {i.energy && <Badge tone="warning">Energy-related</Badge>}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="text-sm"><ExternalLink href={agendaUrl}>Official agenda</ExternalLink></p>
    </div>
  );
}

function SittingRow({ e }: { e: CalendarEvent }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-w-0 space-y-2">
      <p className="text-sm text-fg">
        Plenary sitting{e.place && <> in <strong className="font-semibold">{e.place}</strong></>}
        {e.start && <span className="text-muted"> · starts {e.start}</span>}
      </p>
      <details onToggle={(ev) => setOpen((ev.target as HTMLDetailsElement).open)}>
        <summary className="text-sm text-link py-1 w-fit">Show agenda</summary>
        <div className="mt-2 border-t border-line pt-3">{open && <Agenda date={e.date} />}</div>
      </details>
    </div>
  );
}

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
                    {e.kind === "Plenary sitting" ? (
                      <SittingRow e={e} />
                    ) : (
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-sm text-fg hover:text-link hover:underline">{e.title}</a>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Loadable>

      <SourceNote>
        Sources: Have Your Say (deadlines and planned quarters) and the European Parliament Open Data Portal (plenary sittings). The Commission plans by
        quarter, not by date, so a planned adoption appears on the last day of its quarter. Plenary agendas are drafts that the Parliament fills in shortly before each sitting; “energy-related” is a keyword match on the item title. Not included: Parliament committee meetings (not in the
        Parliament&apos;s data service), the Council calendar (refuses automated access) and transposition deadlines (the source gives conflicting dates).
        The Outlook file is a snapshot; download it again to pick up changes.
      </SourceNote>
    </Page>
  );
}
