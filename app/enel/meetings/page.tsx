"use client";

import React, { useState } from "react";
import { Handshake } from "lucide-react";
import HubShell, { Card, Chip, Loadable, SourceNote, buttonClass, formatStamp, inputClass, useApi } from "@/components/HubShell";
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
  const { data, loading, error, reload } = useApi<MeetingsResponse>(
    `/api/peers?view=meetings&peer=${encodeURIComponent(peer)}&q=${encodeURIComponent(q)}`
  );
  const max = Math.max(1, ...(data?.benchmark ?? []).map((b) => b.cabinet + b.dg));

  return (
    <HubShell title="Commission meetings" subtitle="Who meets which cabinet or Directorate-General, on what, and how often" badge="Meeting transparency" icon={Handshake}>
      <Loadable loading={loading && !data} error={error} onRetry={reload} message="Loading the Commission's meeting register (17 MB)...">
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card title="Peer benchmark — meetings since 1 December 2024" className="lg:col-span-2 self-start">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">
                    <th className="pb-2 text-left">Organisation</th>
                    <th className="pb-2 px-2" title="Meetings with Commissioners and their cabinets">Cabinet</th>
                    <th className="pb-2 px-2" title="Meetings with Directors-General and management staff">DG</th>
                    <th className="pb-2 pl-2" title="Meetings in the last 12 months">12 mo.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.benchmark.map((b) => {
                    const selected = b.peer === peer;
                    return (
                      <tr
                        key={b.peer}
                        onClick={() => setPeer(selected ? "" : b.peer)}
                        className={`cursor-pointer border-t border-slate-800/60 ${selected ? "bg-slate-800/60" : "hover:bg-slate-900/60"}`}
                        title={`Last meeting: ${b.lastMeeting ?? "none"}`}
                      >
                        <td className="py-1.5 pr-2">
                          <button className={`text-left cursor-pointer ${selected ? "text-blue-400 font-semibold" : "text-slate-200"}`} aria-pressed={selected}>{b.peer}</button>
                          <div className="h-1 mt-1 rounded bg-slate-800 overflow-hidden" aria-hidden="true">
                            <div className={`h-full ${b.peer === "Enel" ? "bg-blue-500" : "bg-slate-500"}`} style={{ width: `${((b.cabinet + b.dg) / max) * 100}%` }} />
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-300">{b.cabinet}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-300">{b.dg}</td>
                        <td className="py-1.5 pl-2 text-right font-mono text-slate-300">{b.last12Months}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            <div className="lg:col-span-3 space-y-3">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setQ(draft.trim());
                }}
              >
                <input className={inputClass} placeholder="Search subject, cabinet, DG or any organisation (e.g. grids, Jørgensen, ENER)" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Search meetings" />
                <button className={buttonClass} type="submit">Search</button>
              </form>
              <p className="text-xs text-slate-400">
                {peer || q ? (
                  <>
                    {data.total.toLocaleString("en-GB")} meetings{peer && <> involving <span className="text-slate-200 font-semibold">{peer}</span></>}
                    {q && <> matching “{q}”</>}
                    {data.total > data.meetings.length && `; showing the ${data.meetings.length} most recent`}.
                  </>
                ) : (
                  "Select an organisation or search to list meetings."
                )}
                {loading && " Updating…"}
              </p>
              <div className="space-y-2">
                {data.meetings.map((m, n) => (
                  <div key={`${m.date}-${m.host}-${n}`} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="font-mono text-slate-200">{m.date}</span>
                      <Chip tone={m.level === "Cabinet" ? "blue" : "neutral"}>{m.level}</Chip>
                      <span>{m.host}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-100">{m.subject || "No subject given"}</p>
                    <p className="text-[11px] text-slate-400"><span className="text-slate-500">With:</span> {m.organisations.map((o) => o.name).join("; ")}</p>
                    <p className="text-[11px] text-slate-500">{m.officials.join("; ")}{m.location && ` · ${m.location}`}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Loadable>

      <SourceNote>
        Source: European Commission, meetings with interest representatives (daily export), counted from 1 December 2024, the start of the current Commission. Loaded {formatStamp(data?.fetchedAt)}. Covers
        the Commission only: meetings with MEPs or the Council are not in this data. Subjects are free text entered by the Commission. Counts include
        subsidiaries matched by name (for Enel: Enel, Enel Green Power, Endesa); each meeting is counted once per organisation.
      </SourceNote>
    </HubShell>
  );
}
