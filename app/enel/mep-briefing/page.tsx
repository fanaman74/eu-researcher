"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, ExternalLink, UserRound } from "lucide-react";
import HubShell, { Card, Chip, Loadable, SourceNote, buttonClass, inputClass, linkClass, useApi } from "@/components/HubShell";
import { downloadDocx, downloadPptx, type BriefingDoc } from "@/lib/exportBriefing";
import type { MepBriefing, MepSummary } from "@/lib/types";

const POSITIONS: Record<string, { label: string; tone: "green" | "amber" | "neutral" }> = {
  FOR: { label: "For", tone: "green" },
  AGAINST: { label: "Against", tone: "amber" },
  ABSTENTION: { label: "Abstained", tone: "neutral" },
  DID_NOT_VOTE: { label: "Did not vote", tone: "neutral" },
};

/** The briefing as headed lines, for the Word and PowerPoint exports. */
function toDoc(b: MepBriefing): BriefingDoc {
  return {
    title: `MEP briefing — ${b.name}`,
    subtitle: `${b.group} · ${b.country} · prepared ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
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
  const [exportError, setExportError] = useState("");
  const b = data?.briefing;

  const run = (fn: (doc: BriefingDoc) => Promise<void>) => async () => {
    if (!b) return;
    setExportError("");
    try {
      await fn(toDoc(b));
    } catch (err) {
      console.error(err);
      setExportError("The export could not be created. Please try again.");
    }
  };

  return (
    <Loadable loading={loading} error={error} onRetry={reload} message="Assembling the briefing...">
      {b && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">{b.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{b.group} · {b.country}{b.email && <> · <a href={`mailto:${b.email}`} className={linkClass}>{b.email}</a></>}</p>
                <a href={b.profileUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 text-xs mt-1 ${linkClass}`}>
                  Parliament profile <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex gap-2">
                <button className={buttonClass} onClick={run(downloadDocx)}><Download className="w-3.5 h-3.5" /> Word</button>
                <button className={buttonClass} onClick={run(downloadPptx)}><Download className="w-3.5 h-3.5" /> PowerPoint</button>
              </div>
            </div>
            {exportError && <p className="text-xs text-amber-400 mt-2">{exportError}</p>}
            {b.gaps.map((g) => <p key={g} className="text-xs text-amber-400 mt-2">{g}</p>)}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Committee seats">
              {b.committees.length === 0 ? <p className="text-xs text-slate-400">None recorded.</p> : (
                <ul className="space-y-1.5 text-xs">
                  {b.committees.map((c) => <li key={c.body} className="flex justify-between gap-3"><span className="text-slate-200">{c.body}</span><span className="text-slate-400 shrink-0">{c.role}</span></li>)}
                </ul>
              )}
            </Card>
            <Card title="Roles on watched files">
              {b.dossierRoles.length === 0 ? <p className="text-xs text-slate-400">No rapporteur or shadow role on the watched files.</p> : (
                <ul className="space-y-1.5 text-xs">
                  {b.dossierRoles.map((r) => (
                    <li key={`${r.dossierId}-${r.role}`}><Link href={`/enel/dossiers/${r.dossierId}`} className={linkClass}>{r.dossier}</Link><span className="text-slate-400"> — {r.role}</span></li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Votes on energy files">
              {b.votes.length === 0 ? <p className="text-xs text-slate-400">No roll-call record found.</p> : (
                <ul className="space-y-2 text-xs">
                  {b.votes.map((v) => (
                    <li key={v.id} className="flex items-baseline gap-2">
                      <span className="w-24 shrink-0"><Chip tone={POSITIONS[v.position]?.tone ?? "neutral"}>{POSITIONS[v.position]?.label ?? v.position}</Chip></span>
                      <span><a href={v.url} target="_blank" rel="noopener noreferrer" className="text-slate-200 hover:text-blue-400">{v.title}</a><span className="text-slate-500"> · {v.date}</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Recent written questions">
              {b.questions.length === 0 ? <p className="text-xs text-slate-400">None among the recent questions tracked by the hub.</p> : (
                <ul className="space-y-2 text-xs">
                  {b.questions.map((q) => (
                    <li key={q.id}><a href={q.url} target="_blank" rel="noopener noreferrer" className="text-slate-200 hover:text-blue-400">{q.title}</a><span className="text-slate-500"> · {q.id} · {q.date} · {q.status}</span></li>
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
  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setQ(draft.trim()), 300);
    return () => clearTimeout(t);
  }, [draft]);
  const list = useApi<{ meps: MepSummary[] }>(`/api/mep?q=${encodeURIComponent(q)}`);

  return (
    <HubShell title="MEP briefing" subtitle="A one-page factual record to prepare a meeting" badge="Meeting prep" icon={UserRound}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="space-y-2 lg:col-span-1">
          <input className={inputClass} placeholder="Search any MEP by name" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Search MEPs" />
          <p className="text-[11px] text-slate-500">{q ? "Matching MEPs" : "Italian delegation"}</p>
          <Loadable loading={list.loading && !list.data} error={list.error} onRetry={list.reload} message="Loading MEPs...">
            <ul className="max-h-[70vh] overflow-y-auto border border-slate-800 rounded-lg divide-y divide-slate-800/60">
              {(list.data?.meps ?? []).map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => router.replace(`/enel/mep-briefing?id=${m.id}`)}
                    aria-current={m.id === id}
                    className={`w-full text-left px-3 py-2 text-xs cursor-pointer transition-colors ${m.id === id ? "bg-slate-800 text-blue-400" : "text-slate-200 hover:bg-slate-900"}`}
                  >
                    {m.name}
                    <span className="block text-[10px] text-slate-500">{m.group} · {m.country}</span>
                  </button>
                </li>
              ))}
              {list.data?.meps.length === 0 && <li className="px-3 py-4 text-xs text-slate-400 italic">No sitting MEP matches.</li>}
            </ul>
          </Loadable>
        </div>
        <div className="lg:col-span-3">
          {id ? <Briefing key={id} id={id} /> : <Card><p className="text-xs text-slate-400">Choose an MEP to assemble a briefing.</p></Card>}
        </div>
      </div>

      <SourceNote>
        Sources: European Parliament Open Data Portal (profile, committees, questions, file roles) and HowTheyVote.eu (roll-call votes: the ten most
        recent main votes matching “energy”). The briefing lists the public record only and draws no conclusions about an MEP&apos;s views.
      </SourceNote>
    </HubShell>
  );
}

export default function MepBriefingPage() {
  return (
    <Suspense>
      <MepBriefingContent />
    </Suspense>
  );
}
