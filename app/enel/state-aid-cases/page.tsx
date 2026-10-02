"use client";

import React, { useState } from "react";
import { Badge, ButtonLink, EmptyState, Loadable, Page, SearchBox, Segmented, SourceNote, useApi } from "@/components/ui";
import { type EurLexHit } from "@/lib/types";

const SECTORS = ["All", "Case Law", "Preparatory Documents", "Secondary Legislation"] as const;
type Sector = (typeof SECTORS)[number];

const docDate = (snippet: string) => /Document Date: (\d{4}-\d{2}-\d{2})/.exec(snippet)?.[1] ?? null;

export default function StateAidPage() {
  const { data, loading, error, reload } = useApi<{ hits: EurLexHit[] }>("/api/eurlex?q=state aid energy&top_k=15");
  const [sector, setSector] = useState<Sector>("All");
  const [search, setSearch] = useState("");

  const all = data?.hits ?? [];
  const needle = search.trim().toLowerCase();
  const items = all
    .filter((i) => sector === "All" || i.sector === sector)
    .filter((i) => !needle || `${i.title} ${i.id}`.toLowerCase().includes(needle));
  const count = (s: Sector) => (s === "All" ? all.length : all.filter((i) => i.sector === s).length);

  return (
    <Page>
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <Segmented label="Document type" options={SECTORS.map((s) => ({ value: s, label: data ? `${s} (${count(s)})` : s }))} value={sector} onChange={setSector} />
        <div className="lg:w-96">
          <SearchBox label="Filter rulings" hideLabel value={search} onChange={setSearch} placeholder="Filter by title or CELEX number" />
        </div>
      </div>

      <Loadable loading={loading} error={error} onRetry={reload} message="Searching EUR-Lex for state-aid rulings…">
        {items.length === 0 ? (
          <EmptyState title="No rulings match" />
        ) : (
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.id} className="bg-surface border border-line rounded-lg shadow-card p-4 sm:p-5 space-y-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
                  <Badge>{i.sector}</Badge>
                  <span className="font-mono text-xs">{i.id}</span>
                  {docDate(i.snippet) && <span>{docDate(i.snippet)}</span>}
                </div>
                <h2 className="font-medium text-fg">{i.title}</h2>
                <ButtonLink href={i.url} external size="sm">Official record</ButtonLink>
              </li>
            ))}
          </ul>
        )}
      </Loadable>

      <SourceNote>
        Source: EUR-Lex search for “state aid energy”. For Commission announcements of new state-aid approvals, see News and market.
      </SourceNote>
    </Page>
  );
}
