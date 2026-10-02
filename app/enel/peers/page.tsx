"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { Badge, Card, EmptyState, Field, Loadable, Page, SourceNote, formatDate, inputClass, linkClass, plural, useApi } from "@/components/ui";
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
  const long = p.text.length > 600;
  return (
    <article className="border-t border-line pt-3 pb-1 space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
        <span className="font-semibold text-fg">{p.organization}</span>
        <span>{p.country}</span>
        <span>{formatDate(p.date)}</span>
        <Badge>{p.publication}</Badge>
      </div>
      {p.text ? (
        <p className="text-base text-fg whitespace-pre-wrap max-w-prose">
          {long && !open ? `${p.text.slice(0, 600)}…` : p.text}
        </p>
      ) : (
        <p className="text-sm text-muted">Questionnaire answers only; no written text was published.</p>
      )}
      {long && (
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className={`text-sm font-medium ${linkClass}`}>
          {open ? "Show less" : "Read the full response"}
        </button>
      )}
      {p.attachments.length > 0 && (
        <ul className="space-y-1">
          {p.attachments.map((a) => (
            <li key={a.url}>
              <a href={a.url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-sm ${linkClass}`}>
                <FileText className="w-4 h-4 shrink-0" aria-hidden="true" /> {a.fileName}
                {a.pages ? ` (${a.pages} pages)` : ""}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {p.transparencyId && <p className="text-xs text-subtle">Transparency Register ID {p.transparencyId}</p>}
    </article>
  );
}

function PeersContent() {
  const router = useRouter();
  const pid = useSearchParams().get("pid") ?? "";
  const radar = useApi<{ items: RadarItem[] }>("/api/radar?all=1");
  const positions = useApi<PositionsResponse>(pid ? `/api/peers?pid=${encodeURIComponent(pid)}` : null);

  // Consultations with responses: open ones first, then the most recent.
  const options = (radar.data?.items ?? [])
    .filter((i) => i.totalFeedback > 0)
    .sort((a, b) => Number(b.feedback === "Open") - Number(a.feedback === "Open") || Number(b.id) - Number(a.id));

  const byPeer = new Map<string, PeerPosition[]>();
  for (const p of positions.data?.positions ?? []) byPeer.set(p.peer, [...(byPeer.get(p.peer) ?? []), p]);
  const silent = (positions.data?.peers ?? []).filter((name) => !byPeer.has(name));

  return (
    <Page>
      <Card>
        <Loadable loading={radar.loading} error={radar.error} onRetry={radar.reload} message="Loading the list of consultations…">
          <Field label="Consultation" hint="Open consultations are listed first.">
            {(p) => (
              <select {...p} className={inputClass} value={pid} onChange={(e) => router.replace(e.target.value ? `/enel/peers?pid=${e.target.value}` : "/enel/peers")}>
                <option value="">Choose a consultation…</option>
                {options.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.feedback === "Open" ? "Open now: " : ""}
                    {i.title} ({plural(i.totalFeedback, "response")})
                  </option>
                ))}
              </select>
            )}
          </Field>
        </Loadable>
      </Card>

      {!pid && <EmptyState title="Choose a consultation to compare positions" message="You will see each watched utility's or association's response side by side, with links to their position papers." />}

      {pid && (
        <Loadable loading={positions.loading} error={positions.error} onRetry={positions.reload} message="Reading the published responses…">
          {positions.data && (
            <div className="space-y-4">
              <Card>
                <a href={positions.data.url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-fg hover:text-link hover:underline">
                  {positions.data.title}
                </a>
                <p className="text-base text-muted mt-1">
                  <strong className="text-fg">{byPeer.size} of {positions.data.peers.length}</strong> watched organisations responded. Read{" "}
                  {positions.data.scanned.toLocaleString("en-GB")} of {plural(positions.data.published, "published response")}.
                </p>
                {silent.length > 0 && <p className="text-sm text-subtle mt-2">No published response from: {silent.join(", ")}.</p>}
              </Card>

              {byPeer.size > 0 && (
                <nav aria-label="Jump to organisation" className="flex flex-wrap gap-x-5 gap-y-2 border-y border-line py-3">
                  {[...byPeer.keys()].map((peer) => (
                    <a key={peer} href={`#peer-${peer.replace(/\W+/g, "-")}`} className="text-sm text-link hover:underline">
                      {peer}
                    </a>
                  ))}
                </nav>
              )}

              {[...byPeer.entries()].map(([peer, list]) => (
                <Card key={peer} title={peer} className="scroll-mt-20">
                  <div id={`peer-${peer.replace(/\W+/g, "-")}`} className="space-y-3">
                    {list.map((p, n) => <Position key={`${p.date}-${p.publication}-${n}`} p={p} />)}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Loadable>
      )}

      <SourceNote>
        Source: European Commission, Have Your Say. Organisations are matched by name against the list in lib/peers.ts; respondents who chose to stay
        anonymous are never matched. Questionnaire answers are published only when the respondent also wrote feedback, so a missing organisation may still
        have taken part.
      </SourceNote>
    </Page>
  );
}

export default function PeersPage() {
  return (
    <Suspense>
      <PeersContent />
    </Suspense>
  );
}
