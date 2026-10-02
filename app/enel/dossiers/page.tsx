"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, Loadable, Page, SourceNote, formatDate, useApi } from "@/components/ui";
import type { Dossier } from "@/lib/types";

const stageTone = (d: Dossier) => (!d.available ? "neutral" : d.stage.startsWith("Adopted") ? "success" : "info");

export default function DossiersPage() {
  const { data, loading, error, reload } = useApi<{ dossiers: Dossier[] }>("/api/dossiers");

  return (
    <Page>
      <Loadable loading={loading} error={error} onRetry={reload} message="Loading watched files from the European Parliament…">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {(data?.dossiers ?? []).map((d) => {
            const rapporteur = d.actors.find((a) => a.role === "Rapporteur");
            return (
              <li key={d.id}>
                <Link
                  href={`/enel/dossiers/${d.id}`}
                  className="group h-full border-t-[3px] border-line-strong pt-4 pb-2 flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-subtle font-mono">{d.reference}</span>
                    <Badge tone={stageTone(d)}>{d.stage}</Badge>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-fg group-hover:text-link group-hover:underline">{d.name}</h2>
                    <p className="text-sm text-muted mt-1">{d.why}</p>
                  </div>
                  <dl className="text-sm grid grid-cols-[8.5rem_1fr] gap-x-3 gap-y-1 mt-auto">
                    <dt className="text-subtle">Latest step</dt>
                    <dd className="text-fg">{d.lastActivity ? `${d.lastActivity.label} (${formatDate(d.lastActivity.date)})` : "No activity yet"}</dd>
                    <dt className="text-subtle">Lead committee</dt>
                    <dd className="text-fg">{d.leadCommittee || "Not assigned yet"}</dd>
                    <dt className="text-subtle">Rapporteur</dt>
                    <dd className="text-fg">{rapporteur ? `${rapporteur.name} (${[rapporteur.group, rapporteur.country].filter(Boolean).join(", ")})` : "Not appointed yet"}</dd>
                  </dl>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-link">
                    Open file <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Loadable>
      <SourceNote>
        Source: European Parliament Open Data Portal. The list of watched files is maintained by hand in lib/dossiers.ts. The Council&apos;s position is
        not shown because the Council&apos;s website refuses automated access.
      </SourceNote>
    </Page>
  );
}
