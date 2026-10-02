"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, Check, Copy, Download } from "lucide-react";
import HubShell, { Card, Chip, Loadable, Segmented, SourceNote, buttonClass, formatStamp, linkClass, useApi } from "@/components/HubShell";
import { downloadDocx } from "@/lib/exportBriefing";
import type { Digest } from "@/lib/digest";

const WINDOWS = [
  { value: "24", label: "Since yesterday" },
  { value: "72", label: "3 days" },
  { value: "168", label: "7 days" },
];

export default function DigestPage() {
  const [hours, setHours] = useState("24");
  const { data, loading, error, reload } = useApi<{ digest: Digest; text: string }>(`/api/changes?view=digest&hours=${hours}`);
  const [copied, setCopied] = useState(false);
  const digest = data?.digest;

  const copy = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportWord = () => {
    if (!digest) return;
    downloadDocx({
      title: "EU regulatory digest",
      subtitle: `${new Date(digest.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} — changes in the last ${digest.hours} hours`,
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

  const total = digest?.sections.reduce((n, s) => n + s.changes.length, 0) ?? 0;

  return (
    <HubShell
      title="What changed"
      subtitle="New and changed items across the monitored sources, with upcoming deadlines"
      badge="Daily digest"
      icon={Bell}
      rightSlot={
        <div className="flex gap-2">
          <button className={buttonClass} onClick={copy} disabled={!data}>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "Copied" : "Copy as text"}
          </button>
          <button className={buttonClass} onClick={exportWord} disabled={!digest}>
            <Download className="w-3.5 h-3.5" /> Word
          </button>
        </div>
      }
    >
      <Segmented options={WINDOWS} value={hours} onChange={setHours} />

      <Loadable loading={loading} error={error} onRetry={reload} message="Building the digest...">
        {digest && (
          <div className="space-y-4">
            {total === 0 && (
              <Card>
                <p className="text-xs text-slate-300">No changes detected in this period.</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  The sources are checked twice a day (00:00 and 12:00 UTC). The first check after a deployment records the starting state without
                  reporting it, so changes appear from the second check onward.
                </p>
              </Card>
            )}

            {digest.sections.map((s) => (
              <Card key={s.source} title={`${s.label} (${s.changes.length})`}>
                <ul className="divide-y divide-slate-800/60">
                  {s.changes.map((c) => (
                    <li key={c.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-2">
                        <Chip tone={c.kind === "new" ? "green" : "amber"}>{c.kind === "new" ? "New" : "Changed"}</Chip>
                        <div className="min-w-0">
                          {c.url.startsWith("/") ? (
                            <Link href={c.url} className="text-xs font-medium text-slate-100 hover:text-blue-400">{c.title}</Link>
                          ) : (
                            <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-slate-100 hover:text-blue-400">{c.title}</a>
                          )}
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{c.summary}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Detected {formatStamp(c.detectedAt)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}

            <Card title={`Consultation deadlines in the next 14 days (${digest.deadlines.length})`}>
              {digest.deadlines.length === 0 ? (
                <p className="text-xs text-slate-400">None.</p>
              ) : (
                <ul className="space-y-2">
                  {digest.deadlines.map((d) => (
                    <li key={d.id} className="flex items-baseline gap-3 text-xs">
                      <span className="font-mono font-semibold text-slate-200 whitespace-nowrap">{d.feedbackEnd}</span>
                      <span className="text-slate-300">
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">{d.title}</a>
                        <span className="text-slate-500"> · {d.totalFeedback} responses · </span>
                        <Link href={`/enel/peers?pid=${d.id}`} className={linkClass}>peer responses</Link>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <SourceNote>
              Monitored: Commission pipeline (stage, planned quarter, feedback periods), watched legislative files (stage, latest activity,
              rapporteurs), Commission press announcements on energy, and Commission meetings with Enel and peers.{" "}
              {digest.persistent
                ? "History is stored in the database."
                : "No database is connected, so history is kept in memory and is lost when the server restarts."}{" "}
              Plain text for scripts: <a href={`/api/changes?view=text&hours=${hours}`} className={linkClass}>/api/changes?view=text</a>.
            </SourceNote>
          </div>
        )}
      </Loadable>
    </HubShell>
  );
}
