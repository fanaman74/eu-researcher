"use client";

import React, { useState } from "react";
import { Badge, Card, EmptyState, Loadable, Page, SearchBox, SourceNote, formatDate, formatStamp, plural, useApi } from "@/components/ui";
import type { CommissionMeeting, PeerMeetingStats } from "@/lib/types";

interface MeetingsResponse {
  benchmark: PeerMeetingStats[];
  meetings: CommissionMeeting[];
  total: number;
  fetchedAt: string | null;
}

export default function MeetingsPage() {
  const [peer, setPeer] = useState("Enel");
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const { data, loading, error, reload } = useApi<MeetingsResponse>(`/api/peers?view=meetings&peer=${encodeURIComponent(peer)}&q=${encodeURIComponent(q)}`);
  const max = Math.max(1, ...(data?.benchmark ?? []).map((b) => b.cabinet + b.dg));

  return (
    <Page>
      <Loadable loading={loading && !data} error={error} onRetry={reload} message="Loading the Commission's meeting register…">
        {data && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
            <Card title="How often each organisation met the Commission" description="Since 1 December 2024. Select a row to list its meetings." className="xl:col-span-2" padded={false}>
              <table className="w-full text-sm">
                <caption className="sr-only">Meetings per organisation with Commissioners' cabinets and with Directorates-General</caption>
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-subtle bg-sunken border-y border-line">
                    <th scope="col" className="py-2 px-4 text-left">Organisation</th>
                    <th scope="col" className="py-2 px-2 text-right"><abbr title="Commissioners and their cabinets" className="no-underline">Cabinet</abbr></th>
                    <th scope="col" className="py-2 px-2 text-right"><abbr title="Directors-General and management staff" className="no-underline">DG</abbr></th>
                    <th scope="col" className="py-2 px-4 text-right">Last 12 months</th>
                  </tr>
                </thead>
                <tbody>
                  {data.benchmark.map((b) => {
                    const selected = b.peer === peer;
                    return (
                      <tr key={b.peer} className={`border-b border-line ${selected ? "bg-primary-soft" : ""}`}>
                        <th scope="row" className="py-2 px-4 text-left font-normal">
                          <button
                            type="button"
                            onClick={() => setPeer(selected ? "" : b.peer)}
                            aria-pressed={selected}
                            className={`text-left min-h-9 ${selected ? "font-semibold text-link" : "text-fg hover:text-link hover:underline"}`}
                          >
                            {b.peer}
                          </button>
                          <div className="h-1.5 mt-1 rounded bg-sunken overflow-hidden" aria-hidden="true">
                            <div className={`h-full ${b.peer === "Enel" ? "bg-primary" : "bg-line-strong"}`} style={{ width: `${((b.cabinet + b.dg) / max) * 100}%` }} />
                          </div>
                        </th>
                        <td className="py-2 px-2 text-right tabular-nums">{b.cabinet}</td>
                        <td className="py-2 px-2 text-right tabular-nums">{b.dg}</td>
                        <td className="py-2 px-4 text-right tabular-nums">{b.last12Months}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            <div className="xl:col-span-3 space-y-4">
              <Card>
                <SearchBox
                  label="Search meetings"
                  value={draft}
                  onChange={setDraft}
                  onSubmit={() => setQ(draft.trim())}
                  placeholder="Subject, Commissioner, DG or organisation"
                  hint="For example: grids, Jørgensen, ENER. Combines with the organisation selected on the left."
                  busy={loading}
                />
              </Card>
              <p className="text-base text-muted" role="status">
                {peer || q ? (
                  <>
                    {plural(data.total, "meeting")}
                    {peer && <> with <strong className="text-fg">{peer}</strong></>}
                    {q && <> matching “{q}”</>}
                    {data.total > data.meetings.length && `, showing the ${data.meetings.length} most recent`}.
                  </>
                ) : (
                  "Select an organisation or search to list meetings."
                )}
              </p>
              {(peer || q) && data.meetings.length === 0 && <EmptyState title="No meetings found" message="Try another word or clear the organisation filter." />}
              <ul className="space-y-3">
                {data.meetings.map((m, n) => (
                  <li key={`${m.date}-${m.host}-${n}`} className="bg-surface border border-line rounded-lg shadow-card p-4 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
                      <span className="font-semibold text-fg tabular-nums">{formatDate(m.date)}</span>
                      <Badge tone={m.level === "Cabinet" ? "info" : "neutral"}>{m.level === "Cabinet" ? "Cabinet" : "Directorate-General"}</Badge>
                      <span>{m.host}</span>
                    </div>
                    <p className="font-medium text-fg">{m.subject || "No subject given"}</p>
                    <p className="text-sm text-muted"><span className="text-subtle">With: </span>{m.organisations.map((o) => o.name).join("; ")}</p>
                    <p className="text-sm text-subtle">{m.officials.join("; ")}{m.location && ` · ${m.location}`}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Loadable>

      <SourceNote>
        Source: European Commission, meetings with interest representatives (daily export), counted from 1 December 2024, the start of the current
        Commission.{data?.fetchedAt && <> Loaded {formatStamp(data.fetchedAt)}.</>} Only the Commission publishes this; meetings with MEPs or the Council are not included. Subjects
        are free text written by the Commission. Counts include subsidiaries matched by name (for Enel: Enel, Enel Green Power, Endesa).
      </SourceNote>
    </Page>
  );
}
