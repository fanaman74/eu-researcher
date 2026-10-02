"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Copy, Download } from "lucide-react";
import { Badge, Button, Card, EmptyState, Loadable, Page, Segmented, SourceNote, formatDate, formatStamp, linkClass, plural, useApi } from "@/components/ui";
import { downloadDocx } from "@/lib/exportBriefing";
import type { Digest } from "@/lib/digest";

const WINDOWS = [
  { value: "24", label: "Since yesterday" },
  { value: "72", label: "Last 3 days" },
  { value: "168", label: "Last 7 days" },
];

export default function DigestPage() {
  const [hours, setHours] = useState("24");
  const { data, loading, error, reload } = useApi<{ digest: Digest; text: string }>(`/api/changes?view=digest&hours=${hours}`);
  const [copied, setCopied] = useState(false);
  const digest = data?.digest;
  const total = digest?.sections.reduce((n, s) => n + s.changes.length, 0) ?? 0;

  const copy = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const exportWord = () => {
    if (!digest) return;
    downloadDocx({
      title: "EU regulatory digest",
      subtitle: `${formatDate(digest.generatedAt)} — changes in the last ${digest.hours} hours`,
      sections: [
        ...digest.sections.map((s) => ({
          heading: `${s.label} (${s.changes.length})`,
          lines: s.changes.map((c) => `${c.kind === "new" ? "New" : "Changed"}: ${c.title} — ${c.summary}`),
        })),
        {
          heading: "Consultation deadlines in the next 14 days",
          lines: digest.deadlines.map((d) => `${d.feedbackEnd}: ${d.title} (${d.totalFeedback} responses so far)`),
        },
      ],
      source: "Sources: European Commission (Have Your Say, press corner, meeting transparency), European Parliament Open Data.",
    });
  };

  return (
    <Page
      actions={
        <>
          <Button onClick={copy} disabled={!data}>
            {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            {copied ? "Copied" : "Copy as text"}
          </Button>
          <Button onClick={exportWord} disabled={!digest}>
            <Download className="w-4 h-4" aria-hidden="true" /> Download Word
          </Button>
        </>
      }
    >
      <Segmented label="Period" options={WINDOWS} value={hours} onChange={setHours} />
      <span role="status" className="sr-only">{copied ? "Digest copied to the clipboard" : ""}</span>

      <Loadable loading={loading} error={error} onRetry={reload} message="Building the digest…">
        {digest && (
          <div className="space-y-4">
            {total === 0 && (
              <EmptyState
                title="No changes in this period"
                message="Sources are checked at 00:00 and 12:00 UTC. The first check after a deployment only records the starting point, so changes appear from the second check onward."
              />
            )}

            {digest.sections.map((s) => (
              <Card key={s.source} title={`${s.label} (${s.changes.length})`}>
                <ul className="divide-y divide-line">
                  {s.changes.map((c) => (
                    <li key={c.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <span className="shrink-0"><Badge tone={c.kind === "new" ? "success" : "warning"}>{c.kind === "new" ? "New" : "Changed"}</Badge></span>
                      <div className="min-w-0">
                        {c.url.startsWith("/") ? (
                          <Link href={c.url} className="font-medium text-fg hover:text-link hover:underline">{c.title}</Link>
                        ) : (
                          <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-medium text-fg hover:text-link hover:underline">{c.title}</a>
                        )}
                        <p className="text-sm text-muted mt-0.5">{c.summary}</p>
                        <p className="text-xs text-subtle mt-0.5">Detected {formatStamp(c.detectedAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}

            <Card title={`Consultations closing in the next 14 days (${digest.deadlines.length})`}>
              {digest.deadlines.length === 0 ? (
                <p className="text-sm text-muted">None.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {digest.deadlines.map((d) => (
                    <li key={d.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-1 sm:gap-4">
                      <span className="w-28 shrink-0 text-sm font-semibold tabular-nums">{formatDate(d.feedbackEnd)}</span>
                      <span className="text-sm">
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-fg hover:text-link hover:underline">{d.title}</a>
                        <span className="text-subtle"> · {plural(d.totalFeedback, "response")} · </span>
                        <Link href={`/enel/peers?pid=${d.id}`} className={linkClass}>peer responses</Link>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <SourceNote>
              Checked: the Commission pipeline (stage, planned quarter, feedback periods), watched legislative files (stage, latest activity,
              rapporteurs), Commission announcements on energy, and Commission meetings with Enel and peers.{" "}
              {digest.persistent ? "History is stored in the database." : "No database is connected, so history is lost when the server restarts."}{" "}
              Plain text for other tools: <a href={`/api/changes?view=text&hours=${hours}`} className={linkClass}>digest as text</a>.
            </SourceNote>
          </div>
        )}
      </Loadable>
    </Page>
  );
}
