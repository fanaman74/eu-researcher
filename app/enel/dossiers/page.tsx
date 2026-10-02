"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";
import HubShell, { Chip, Loadable, SourceNote, useApi } from "@/components/HubShell";
import type { Dossier } from "@/lib/types";

export default function DossiersPage() {
  const { data, loading, error, reload } = useApi<{ dossiers: Dossier[] }>("/api/dossiers");

  return (
    <HubShell title="Dossiers" subtitle="Watched legislative files, each tracked through its stages" badge="By file" icon={FolderOpen}>
      <Loadable loading={loading} error={error} onRetry={reload} message="Loading watched files from the European Parliament...">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data?.dossiers ?? []).map((d) => {
            const rapporteur = d.actors.find((a) => a.role === "Rapporteur");
            return (
              <Link
                key={d.id}
                href={`/enel/dossiers/${d.id}`}
                className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-lg p-5 flex flex-col gap-3 transition-colors group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-400">{d.reference} · {d.proposal}</span>
                  <Chip tone={d.available ? (d.stage.startsWith("Adopted") ? "green" : "blue") : "neutral"}>{d.stage}</Chip>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{d.name}</h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{d.why}</p>
                </div>
                <dl className="text-[11px] text-slate-300 space-y-1 mt-auto">
                  <div className="flex gap-2">
                    <dt className="text-slate-500 w-24 shrink-0">Latest</dt>
                    <dd>{d.lastActivity ? `${d.lastActivity.date} · ${d.lastActivity.label}` : "No activity recorded"}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-slate-500 w-24 shrink-0">Lead committee</dt>
                    <dd>{d.leadCommittee || "Not assigned"}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-slate-500 w-24 shrink-0">Rapporteur</dt>
                    <dd>{rapporteur ? `${rapporteur.name} (${[rapporteur.group, rapporteur.country].filter(Boolean).join(", ")})` : "Not appointed"}</dd>
                  </div>
                </dl>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 group-hover:text-blue-400">
                  Open file <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </Loadable>
      <SourceNote>
        Source: European Parliament Open Data Portal. The watchlist is curated by hand in lib/dossiers.ts. Council status is not shown: the
        Council&apos;s website refuses automated access.
      </SourceNote>
    </HubShell>
  );
}
