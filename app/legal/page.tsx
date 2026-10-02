"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { Badge, Button, ButtonLink, Card, EmptyState, ErrorState, Field, Loadable, Page, SourceNote, formatDate, formatStamp, inputClass, useApi } from "@/components/ui";
import SummarizerModal from "@/components/SummarizerModal";
import { type LatestDocument, type SummarizerConfig } from "@/lib/types";

const TYPES = [
  { id: "statutes", label: "Regulations, directives and decisions" },
  { id: "case_law", label: "Court judgments and orders" },
  { id: "regulatory", label: "Commission proposals and preparatory documents" },
  { id: "consolidated", label: "Consolidated texts" },
  { id: "international", label: "Treaties" },
  { id: "agreements", label: "International agreements" },
  { id: "complementary", label: "Complementary legislation" },
  { id: "transposition", label: "National transposition measures" },
  { id: "national_case_law", label: "National court judgments" },
  { id: "parliamentary", label: "Parliamentary questions (archive)" },
];

export default function LatestLawPage() {
  const [type, setType] = useState("statutes");
  const { data, loading, error, reload } = useApi<{ documents: LatestDocument[]; fetchedAt?: string; stale?: boolean; error?: string }>(`/api/latest?namespace=${type}`);
  const [activeDoc, setActiveDoc] = useState<SummarizerConfig | null>(null);
  const docs = data?.documents ?? [];

  return (
    <Page>
      <Card>
        <div className="max-w-xl">
          <Field label="Type of document" hint="Shows the ten most recent publications of that type.">
            {(p) => (
              <select {...p} className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            )}
          </Field>
        </div>
      </Card>

      <Loadable loading={loading} error={error} onRetry={reload} message="Loading the latest publications from EUR-Lex…">
        {data?.error ? (
          <ErrorState message="EUR-Lex did not answer. It is sometimes slow; try again in a minute." onRetry={reload} />
        ) : docs.length === 0 ? (
          <EmptyState title="Nothing published recently" message="EUR-Lex returned no documents of this type for the last three years." />
        ) : (
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {docs.map((doc) => (
              <li key={doc.celex} className="bg-surface border border-line rounded-lg shadow-card p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
                  <span className="font-semibold text-fg tabular-nums">{formatDate(doc.date)}</span>
                  <Badge>{doc.sector}</Badge>
                  <span className="font-mono text-xs">{doc.celex}</span>
                </div>
                <h2 className="font-medium text-fg">{doc.title}</h2>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <ButtonLink href={doc.url} external size="sm">Official record</ButtonLink>
                  <Button size="sm" variant="ghost" onClick={() => setActiveDoc({ title: doc.title, snippet: doc.snippet, namespace: type, celex: doc.celex })}>
                    <Sparkles className="w-4 h-4" aria-hidden="true" /> AI summary
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Loadable>

      <SourceNote>
        Source: EUR-Lex, through the Publications Office&apos;s Cellar database, refreshed twice a day
        {data?.fetchedAt ? `; loaded ${formatStamp(data.fetchedAt)}` : ""}
        {data?.stale ? " (EUR-Lex is not answering, so this is the last good copy)" : ""}. AI summaries can contain errors.
      </SourceNote>

      <SummarizerModal isOpen={!!activeDoc} onClose={() => setActiveDoc(null)} document={activeDoc} />
    </Page>
  );
}
