"use client";

import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Badge, Button, ButtonLink, Card, EmptyState, ErrorState, Loading, Page, SearchBox, SourceNote } from "@/components/ui";
import SummarizerModal from "@/components/SummarizerModal";
import { type EurLexHit, type SummarizerConfig } from "@/lib/types";

const PRESETS = [
  { label: "State aid for energy", q: "State aid energy renewable" },
  { label: "Renewable Energy Directive", q: "Renewable Energy Directive greenhouse" },
  { label: "Electricity market design", q: "Electricity market price consumer" },
  { label: "Grids and network codes", q: "transmission grid distribution smart" },
];

/** "EUR-Lex official record. CELEX identifier: …. Document Date: 2024-01-01. Work Cellar URI: …" -> the date. */
const docDate = (snippet: string) => /Document Date: (\d{4}-\d{2}-\d{2})/.exec(snippet)?.[1] ?? null;

export default function EurlexPage() {
  const [query, setQuery] = useState("State aid energy");
  const [searched, setSearched] = useState("");
  const [hits, setHits] = useState<EurLexHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeDoc, setActiveDoc] = useState<SummarizerConfig | null>(null);

  const search = async (term = query) => {
    const q = term.trim();
    if (!q) return;
    setQuery(q);
    setSearched(q);
    setLoading(true);
    setError(false);
    setHits([]);
    try {
      const res = await fetch(`/api/eurlex?q=${encodeURIComponent(q)}&top_k=8`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error);
      setHits(data.hits || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page>
      <Card>
        <div className="space-y-4">
          <SearchBox
            label="Search EU law"
            value={query}
            onChange={setQuery}
            onSubmit={() => search()}
            placeholder="For example: state aid renewable, smart grid"
            hint="Searches the titles of regulations, directives, decisions and court judgments. Use a few key words."
            busy={loading}
          />
          <div className="space-y-2">
            <p className="text-sm text-muted">Common searches</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button key={p.label} size="sm" onClick={() => search(p.q)} disabled={loading}>{p.label}</Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <section aria-labelledby="results" className="space-y-3">
        <h2 id="results" className="text-lg font-semibold text-fg" aria-live="polite">
          {loading ? "Searching…" : searched ? `${hits.length} results for “${searched}”` : "Results"}
        </h2>
        {loading ? (
          <Loading message="Searching EUR-Lex…" slow="EUR-Lex can take up to 30 seconds to answer." />
        ) : error ? (
          <ErrorState message="EUR-Lex did not answer. It is sometimes slow; try again or use fewer words." onRetry={() => search()} />
        ) : hits.length === 0 ? (
          <EmptyState title="No documents found" message="Try fewer or more general words, such as “renewable energy”." />
        ) : (
          <ul className="space-y-5">
            {hits.map((doc) => (
              <li key={doc.id} className="border-t border-line pt-4 pb-1 space-y-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
                  <Badge>{doc.sector}</Badge>
                  <span className="font-mono text-xs">{doc.id}</span>
                  {docDate(doc.snippet) && <span>{docDate(doc.snippet)}</span>}
                </div>
                <h3 className="font-semibold text-fg">{doc.title}</h3>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink href={doc.url} external size="sm">Official record</ButtonLink>
                  <Button size="sm" variant="ghost" onClick={() => setActiveDoc({ title: doc.title, snippet: doc.snippet, namespace: "all", celex: doc.id })}>
                    <Sparkles className="w-4 h-4" aria-hidden="true" /> AI summary
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SourceNote>Source: EUR-Lex, through the Publications Office&apos;s Cellar database. AI summaries are generated from the official text and can contain errors.</SourceNote>

      <SummarizerModal isOpen={!!activeDoc} onClose={() => setActiveDoc(null)} document={activeDoc} />
    </Page>
  );
}
