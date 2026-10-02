"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { Badge, Button, Card, EmptyState, ExternalLink, Loadable, Notice, Page, SearchBox, SourceNote, formatDate, linkClass, useApi } from "@/components/ui";
import { downloadDocx, downloadPptx, type BriefingDoc } from "@/lib/exportBriefing";
import type { MepBriefing, MepSummary } from "@/lib/types";

const POSITIONS: Record<string, { label: string; tone: "success" | "danger" | "neutral" }> = {
  FOR: { label: "For", tone: "success" },
  AGAINST: { label: "Against", tone: "danger" },
  ABSTENTION: { label: "Abstained", tone: "neutral" },
  DID_NOT_VOTE: { label: "Did not vote", tone: "neutral" },
};

/** The briefing as headed lines, for the Word and PowerPoint exports. */
function toDoc(b: MepBriefing): BriefingDoc {
  return {
    title: `MEP briefing — ${b.name}`,
    subtitle: `${b.group} · ${b.country} · prepared ${formatDate(new Date().toISOString().slice(0, 10))}`,
    sections: [
      { heading: "Committee seats", lines: b.committees.map((c) => `${c.body} — ${c.role}`) },
      { heading: "Roles on watched files", lines: b.dossierRoles.map((r) => `${r.dossier}: ${r.role}`) },
      { heading: "Recent written questions", lines: b.questions.slice(0, 8).map((q) => `${q.date} ${q.id}: ${q.title} (${q.status})`) },
      { heading: "Votes on energy files", lines: b.votes.map((v) => `${v.date} — ${POSITIONS[v.position]?.label ?? v.position}: ${v.title}`) },
    ],
    source: "Sources: European Parliament Open Data Portal; HowTheyVote.eu (roll-call votes). Factual record only.",
  };
}

function Briefing({ id }: { id: string }) {
  const { data, loading, error, reload } = useApi<{ briefing: MepBriefing }>(`/api/mep?id=${encodeURIComponent(id)}`);
  const [busy, setBusy] = useState<"" | "word" | "pptx">("");
  const [exportError, setExportError] = useState("");
  const b = data?.briefing;

  const run = (kind: "word" | "pptx") => async () => {
    if (!b) return;
    setExportError("");
    setBusy(kind);
    try {
      await (kind === "word" ? downloadDocx : downloadPptx)(toDoc(b));
    } catch (err) {
      console.error(err);
      setExportError("The file could not be created. Check your connection and try again.");
    } finally {
      setBusy("");
    }
  };

  return (
    <Loadable loading={loading} error={error} onRetry={reload} message="Putting the briefing together…">
      {b && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-fg">{b.name}</h2>
                <p className="text-base text-muted">{b.group} · {b.country}</p>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <ExternalLink href={b.profileUrl}>Parliament profile</ExternalLink>
                  {b.email && <a href={`mailto:${b.email}`} className={linkClass}>{b.email}</a>}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={run("word")} loading={busy === "word"}><Download className="w-4 h-4" aria-hidden="true" /> Word</Button>
                <Button onClick={run("pptx")} loading={busy === "pptx"}><Download className="w-4 h-4" aria-hidden="true" /> PowerPoint</Button>
              </div>
            </div>
          </Card>
          {exportError && <Notice tone="danger">{exportError}</Notice>}
          {b.gaps.map((g) => <Notice key={g} tone="warning">{g}</Notice>)}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Committee seats">
              {b.committees.length === 0 ? <p className="text-sm text-muted">None recorded.</p> : (
                <ul className="divide-y divide-line">
                  {b.committees.map((c) => (
                    <li key={c.body} className="py-2 first:pt-0 last:pb-0 flex justify-between gap-3 text-sm">
                      <span className="text-fg">{c.body}</span><span className="text-muted shrink-0">{c.role}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Roles on watched files">
              {b.dossierRoles.length === 0 ? <p className="text-sm text-muted">No rapporteur or shadow role on the watched files.</p> : (
                <ul className="space-y-2 text-sm">
                  {b.dossierRoles.map((r) => (
                    <li key={`${r.dossierId}-${r.role}`}>
                      <Link href={`/enel/dossiers/${r.dossierId}`} className={`font-medium ${linkClass}`}>{r.dossier}</Link>
                      <span className="block text-muted">{r.role}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Votes on energy files" description="The ten most recent main votes on energy.">
              {b.votes.length === 0 ? <p className="text-sm text-muted">No roll-call record found.</p> : (
                <ul className="divide-y divide-line">
                  {b.votes.map((v) => (
                    <li key={v.id} className="py-2.5 first:pt-0 last:pb-0 grid grid-cols-[6.5rem_1fr] gap-3 items-baseline text-sm">
                      <Badge tone={POSITIONS[v.position]?.tone ?? "neutral"}>{POSITIONS[v.position]?.label ?? v.position}</Badge>
                      <span>
                        <ExternalLink href={v.url}>{v.title}</ExternalLink>
                        <span className="block text-subtle">{formatDate(v.date)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Recent written questions">
              {b.questions.length === 0 ? <p className="text-sm text-muted">None among the recent questions the site tracks.</p> : (
                <ul className="space-y-2.5 text-sm">
                  {b.questions.map((q) => (
                    <li key={q.id}>
                      <ExternalLink href={q.url}>{q.title}</ExternalLink>
                      <span className="block text-subtle">{q.id} · {formatDate(q.date)} · {q.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </Loadable>
  );
}

function MepBriefingContent() {
  const router = useRouter();
  const id = useSearchParams().get("id") ?? "";
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(draft.trim()), 300);
    return () => clearTimeout(t);
  }, [draft]);
  const list = useApi<{ meps: MepSummary[] }>(`/api/mep?q=${encodeURIComponent(q)}`);

  return (
    <Page>
      <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-6 items-start">
        <div className="space-y-3 lg:sticky lg:top-6">
          <SearchBox label="Find an MEP" value={draft} onChange={setDraft} placeholder="Type a name" hint={q ? undefined : "Showing the Italian delegation."} />
          <Loadable loading={list.loading && !list.data} error={list.error} onRetry={list.reload} message="Loading MEPs…">
            {list.data?.meps.length === 0 ? (
              <p className="text-sm text-muted">No sitting MEP has that name.</p>
            ) : (
              <ul className="max-h-[60vh] overflow-y-auto border-y border-line-strong divide-y divide-line [scrollbar-width:thin]" aria-label="MEPs">
                {(list.data?.meps ?? []).map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => router.replace(`/enel/mep-briefing?id=${m.id}`)}
                      aria-current={m.id === id ? "true" : undefined}
                      className="group w-full text-left py-2 min-h-11"
                    >
                      <span className={`block text-sm text-fg group-hover:underline ${m.id === id ? "font-bold" : ""}`}>{m.id === id && <span className="inline-block w-2 h-2 mr-2 bg-marker align-middle" aria-hidden="true" />}{m.name}</span>
                      <span className="block text-xs text-subtle">{m.group} · {m.country}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Loadable>
        </div>
        <div>
          {id ? <Briefing key={id} id={id} /> : <EmptyState title="Choose an MEP" message="Pick a name from the list to see their committees, roles on watched files, questions and votes." />}
        </div>
      </div>

      <SourceNote>
        Sources: European Parliament Open Data Portal (profile, committees, questions, file roles) and HowTheyVote.eu (roll-call votes). The briefing
        lists the public record only and draws no conclusions about the MEP&apos;s views.
      </SourceNote>
    </Page>
  );
}

export default function MepBriefingPage() {
  return (
    <Suspense>
      <MepBriefingContent />
    </Suspense>
  );
}
