"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { Badge, Card, EmptyState, Field, Loadable, Page, SourceNote, formatDate, inputClass, linkClass, plural, useApi } from "@/components/ui";
import type { PeerPosition, RadarItem } from "@/lib/types";
import { extractivePeerBriefing, peerPositionKey, type PeerBriefing } from "@/lib/peerBriefingShared";

interface PositionsResponse {
  title: string;
  url: string;
  scanned: number;
  published: number;
  positions: PeerPosition[];
  peers: string[];
}

type PeerSummary = PeerBriefing;
interface SummaryResponse { summaries: { index: number; key: string; summary: PeerSummary }[] }

function coverageLabel(summary: PeerSummary): string {
  const base = ({ text: "Published feedback", "text+attachments": "Feedback + readable attachment", attachments: "Readable attachment", "text+unread-attachments": "Feedback + attachment unreadable", "text+partial-attachments": "Feedback + some attachments unreadable", "attachments+unread": "Attachment unreadable", "attachments+partial": "Some attachments readable", insufficient: "Insufficient readable source" })[summary.sourceCoverage];
  return summary.attachmentCount > 0 && summary.sourceCoverage.includes("unread") || summary.sourceCoverage.includes("partial") ? `${base}; ${summary.readableAttachmentCount}/${summary.attachmentCount} attachments read` : base;
}

function Position({ p, summary, summaryLoading }: { p: PeerPosition; summary?: PeerSummary; summaryLoading: boolean }) {
  return (
    <article className="border-t border-line pt-3 pb-1 space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
        <span className="font-semibold text-fg">{p.organization}</span>
        <span>{p.country}</span>
        <span>{formatDate(p.date)}</span>
        <Badge>{p.publication}</Badge>
      </div>
      <section aria-label={`${p.organization} liaison-office briefing`} className="border-t border-line pt-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-fg">Liaison-office brief</h3>
          {summary && <Badge tone={summary.provenance === "AI-written" ? "warning" : "neutral"}>{summary.provenance}</Badge>}
          {summary && <Badge>{coverageLabel(summary)}</Badge>}
          {summaryLoading && <span className="text-xs text-subtle" role="status">Reading attachments / refining brief…</span>}
        </div>
        {summary ? (
          <div className="max-w-prose space-y-2 text-sm text-fg">
            <p><strong>Position:</strong> {summary.position}</p>
            <p><strong>Enel EU-affairs relevance:</strong> {summary.relevance}</p>
            <p><strong>Useful follow-up:</strong> {summary.followUp}</p>
          </div>
        ) : <p className="text-sm text-muted">{summaryLoading ? "Preparing a source-grounded brief…" : "Brief unavailable; read the published response below."}</p>}
      </section>
      <details>
        <summary className={`text-sm font-medium ${linkClass}`}>Read published response and attachments</summary>
        <div className="pt-2 space-y-2">
          {p.text ? (
            <p className="text-base text-fg whitespace-pre-wrap max-w-prose">{p.text}</p>
          ) : (
            <p className="text-sm text-muted">Questionnaire answers only; no written text was published.</p>
          )}
        </div>
        {p.attachments.length > 0 && <ul className="space-y-1">
          {p.attachments.map((a) => <li key={a.url}><a href={a.url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-sm ${linkClass}`}>
            <FileText className="w-4 h-4 shrink-0" aria-hidden="true" /> {a.fileName}{a.pages ? ` (${a.pages} pages)` : ""}<span className="sr-only"> (opens in a new tab)</span>
          </a></li>)}
        </ul>}
      </details>
      {p.transparencyId && <p className="text-xs text-subtle">Transparency Register ID {p.transparencyId}</p>}
    </article>
  );
}

function PeersContent() {
  const router = useRouter();
  const pid = useSearchParams().get("pid") ?? "";
  const radar = useApi<{ items: RadarItem[] }>("/api/radar?all=1");
  const positions = useApi<PositionsResponse>(pid ? `/api/peers?pid=${encodeURIComponent(pid)}` : null);
  const [summaries, setSummaries] = useState<Record<number, PeerSummary>>({});
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(false);
  const [summaryRetry, setSummaryRetry] = useState(0);

  useEffect(() => {
    if (!pid || positions.loading || !positions.data?.positions.length) {
      setSummaries({});
      setSummaryLoading(false);
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    setSummaries(Object.fromEntries(positions.data.positions.map((p, index) => [index, extractivePeerBriefing(p, "", p.attachments.length > 0)])));
    setSummaryError(false);
    setSummaryLoading(true);
    const indices = positions.data.positions.map((_, index) => index);
    const batches = Array.from({ length: Math.ceil(indices.length / 4) }, (_, i) => indices.slice(i * 4, i * 4 + 4));
    (async () => {
      const merged: Record<number, PeerSummary> = {};
      for (const batch of batches) {
        if (cancelled) return;
        const response = await fetch("/api/peer-summary", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pid, indices: batch }), signal: controller.signal });
        if (!response.ok) throw new Error(`Summary request failed (${response.status}).`);
        const data = await response.json() as SummaryResponse;
        for (const item of data.summaries) {
          const current = positions.data?.positions[item.index];
          if (current && peerPositionKey(current) === item.key) merged[item.index] = item.summary;
        }
        if (!cancelled) setSummaries((existing) => ({ ...existing, ...merged }));
      }
    })()
      .catch((error) => { if (!cancelled) { console.error("Peer summary request failed:", error); setSummaryError(true); } })
      .finally(() => { if (!cancelled) setSummaryLoading(false); });
    return () => { cancelled = true; controller.abort(); };
  }, [pid, positions.data, positions.loading, summaryRetry]);

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

              {summaryError && <p role="alert" className="text-sm text-danger">Some briefings could not be refreshed; source-grounded baselines remain visible. <button type="button" className={linkClass} onClick={() => setSummaryRetry((value) => value + 1)}>Retry briefings</button></p>}
              {[...byPeer.entries()].map(([peer, list]) => (
                <Card key={peer} title={peer} className="scroll-mt-20">
                  <div id={`peer-${peer.replace(/\W+/g, "-")}`} className="space-y-3">
                    {list.map((p, n) => {
                      const index = positions.data?.positions.indexOf(p) ?? -1;
                      return <Position key={`${p.date}-${p.publication}-${n}`} p={p} summary={summaries[index]} summaryLoading={summaryLoading} />;
                    })}
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
        have taken part. Briefs fall back to source-grounded extraction when AI is unavailable; <a href="/settings" className={linkClass}>configure AI settings</a> for AI-written briefings.
      </SourceNote>
    </Page>
  );
}

function PeersSession() {
  const pid = useSearchParams().get("pid") ?? "";
  // Keep pending source requests and their briefings within one consultation.
  return <PeersContent key={pid} />;
}

export default function PeersPage() {
  return (
    <Suspense>
      <PeersSession />
    </Suspense>
  );
}
