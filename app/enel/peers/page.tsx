"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Users } from "lucide-react";
import HubShell, { Card, Chip, Loadable, SourceNote, inputClass, linkClass, useApi } from "@/components/HubShell";
import type { PeerPosition, RadarItem } from "@/lib/types";

interface PositionsResponse {
  title: string;
  url: string;
  scanned: number;
  published: number;
  positions: PeerPosition[];
  peers: string[];
}

function Position({ p }: { p: PeerPosition }) {
  const [open, setOpen] = useState(false);
  const long = p.text.length > 500;
  return (
    <div className="border border-slate-800 rounded-md p-3 bg-slate-950/60 space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <span className="font-semibold text-slate-200">{p.organization}</span>
        <span>{p.country}</span>
        <span>{p.date}</span>
        <Chip>{p.publication}</Chip>
        {p.transparencyId && <span className="font-mono">TR {p.transparencyId}</span>}
      </div>
      {p.text ? (
        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
          {long && !open ? `${p.text.slice(0, 500)}…` : p.text}{" "}
          {long && (
            <button onClick={() => setOpen(!open)} className={`${linkClass} cursor-pointer`}>{open ? "Show less" : "Show all"}</button>
          )}
        </p>
      ) : (
        <p className="text-xs text-slate-500 italic">Questionnaire response; no free text published.</p>
      )}
      {p.attachments.map((a) => (
        <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 text-[11px] ${linkClass}`}>
          <FileText className="w-3.5 h-3.5 shrink-0" /> {a.fileName}{a.pages ? ` (${a.pages} pages)` : ""}
        </a>
      ))}
    </div>
  );
}

function PeersContent() {
  const router = useRouter();
  const pid = useSearchParams().get("pid") ?? "";
  const radar = useApi<{ items: RadarItem[] }>("/api/radar?all=1");
  const positions = useApi<PositionsResponse>(pid ? `/api/peers?pid=${encodeURIComponent(pid)}` : null);

  // Consultations with responses, most recent activity first (open ones on top).
  const options = (radar.data?.items ?? [])
    .filter((i) => i.totalFeedback > 0)
    .sort((a, b) => Number(b.feedback === "Open") - Number(a.feedback === "Open") || Number(b.id) - Number(a.id));

  const byPeer = new Map<string, PeerPosition[]>();
  for (const p of positions.data?.positions ?? []) byPeer.set(p.peer, [...(byPeer.get(p.peer) ?? []), p]);
  const silent = (positions.data?.peers ?? []).filter((name) => !byPeer.has(name));

  return (
    <HubShell title="Peer positions" subtitle="What utilities and associations told the Commission, side by side" badge="Peer watch" icon={Users}>
      <Loadable loading={radar.loading} error={radar.error} onRetry={radar.reload} message="Loading consultations (about 30 seconds on first load)...">
        <label className="block text-xs text-slate-400 space-y-1.5">
          <span>Consultation</span>
          <select className={inputClass} value={pid} onChange={(e) => router.replace(`/enel/peers?pid=${e.target.value}`)}>
            <option value="">Choose a consultation…</option>
            {options.map((i) => (
              <option key={i.id} value={i.id}>
                {i.feedback === "Open" ? "[Open] " : ""}{i.title} — {i.totalFeedback.toLocaleString("en-GB")} responses
              </option>
            ))}
          </select>
        </label>
      </Loadable>

      {pid && (
        <Loadable loading={positions.loading} error={positions.error} onRetry={positions.reload} message="Reading published responses...">
          {positions.data && (
            <div className="space-y-4">
              <Card>
                <a href={positions.data.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-100 hover:text-blue-400">{positions.data.title}</a>
                <p className="text-xs text-slate-400 mt-1">
                  {byPeer.size} of {positions.data.peers.length} watched organisations responded. Read {positions.data.scanned.toLocaleString("en-GB")} of{" "}
                  {positions.data.published.toLocaleString("en-GB")} published responses.
                </p>
                {silent.length > 0 && <p className="text-[11px] text-slate-500 mt-2">No published response from: {silent.join(", ")}.</p>}
              </Card>

              {[...byPeer.entries()].map(([peer, list]) => (
                <Card key={peer} title={peer}>
                  <div className="space-y-2">
                    {list.map((p, n) => <Position key={`${p.date}-${p.publication}-${n}`} p={p} />)}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Loadable>
      )}

      <SourceNote>
        Source: European Commission, Have Your Say. Organisations are matched by name against the watchlist in lib/peers.ts; respondents who chose
        anonymity are never matched. Responses to a questionnaire are published only when the respondent also left written feedback, so absence here
        does not prove an organisation stayed silent.
      </SourceNote>
    </HubShell>
  );
}

export default function PeersPage() {
  return (
    <Suspense>
      <PeersContent />
    </Suspense>
  );
}
