"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Sparkles, X } from "lucide-react";
import { AiLabel, Badge, Button, Card, EmptyState, ErrorState, ExternalLink, Field, Loading, Page, SearchBox, SourceNote, formatDate, inputClass, plural } from "@/components/ui";
import { type PoliticalEvent } from "@/lib/types";
import { generateAnalysisPptx } from "@/lib/generatePptx";

const IMPACT_TONE = { High: "danger", Medium: "warning", Low: "neutral" } as const;

function ReportDialog({ event, onClose }: { event: PoliticalEvent; onClose: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState("");
  const [copied, setCopied] = useState(false);
  const [pptx, setPptx] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/politics-tracker/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: event.title,
            description: event.description,
            content: event.content,
            sourceName: event.sourceName,
            category: event.category,
            impactLevel: event.impactLevel,
            entities: event.entities,
            tags: event.tags,
          }),
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "The report could not be written.");
        setText(data.analysis || "");
      } catch (err) {
        if (!controller.signal.aborted) setFailed((err as Error).message || "The report could not be written.");
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    })();
    return () => controller.abort();
  }, [event]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, []);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const saveText = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase().slice(0, 80)}_analysis.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const savePptx = async () => {
    setPptx(true);
    try {
      await generateAnalysisPptx(event, text);
    } catch (err) {
      console.error(err);
      setFailed("The PowerPoint file could not be created. Check your connection and try again.");
    } finally {
      setPptx(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} tabIndex={-1} className="relative bg-canvas border border-line-strong w-full max-w-3xl max-h-[90dvh] flex flex-col outline-none">
        <div className="p-5 border-b border-line flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-subtle">Public affairs report</p>
            <h2 id="report-title" className="text-lg font-semibold text-fg">{event.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close report" className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-md text-muted hover:bg-sunken hover:text-fg">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3" aria-live="polite">
          {busy ? (
            <Loading message="Writing the report…" slow="This usually takes 20 to 40 seconds." rows={4} />
          ) : failed && !text ? (
            <p className="text-sm text-danger" role="alert">{failed}</p>
          ) : (
            <>
              <AiLabel />
              {failed && <p className="text-sm text-danger" role="alert">{failed}</p>}
              <div className="text-base text-fg whitespace-pre-line">{text}</div>
            </>
          )}
        </div>
        <div className="p-5 border-t border-line flex flex-wrap justify-end gap-2">
          <span role="status" className="sr-only">{copied ? "Report copied" : ""}</span>
          <Button onClick={copy} disabled={busy || !text}>
            {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />} {copied ? "Copied" : "Copy"}
          </Button>
          <Button onClick={saveText} disabled={busy || !text}><Download className="w-4 h-4" aria-hidden="true" /> Text file</Button>
          <Button onClick={savePptx} disabled={busy || !text} loading={pptx}><Download className="w-4 h-4" aria-hidden="true" /> PowerPoint</Button>
          <Button variant="primary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

export default function ItalianPoliticsPage() {
  const [events, setEvents] = useState<PoliticalEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reportFor, setReportFor] = useState<PoliticalEvent | null>(null);

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [category, setCategory] = useState("");
  const [party, setParty] = useState("");
  const [days, setDays] = useState("60");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams({ days });
      if (debounced) params.append("q", debounced);
      if (sourceType) params.append("sourceType", sourceType);
      if (category) params.append("category", category);
      if (party) params.append("party", party);
      const res = await fetch(`/api/politics-tracker?${params}`);
      if (!res.ok) throw new Error(String(res.status));
      const loaded: PoliticalEvent[] = (await res.json()).events || [];
      setEvents(loaded);
      setSelectedId((prev) => (loaded.some((e) => e.id === prev) ? prev : loaded[0]?.id ?? null));
    } catch (err) {
      console.error("Failed to load events", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [debounced, sourceType, category, party, days]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filtersActive = Boolean(search || sourceType || category || party || days !== "60");
  const reset = () => {
    setSearch("");
    setSourceType("");
    setCategory("");
    setParty("");
    setDays("60");
  };
  const selected = events.find((e) => e.id === selectedId) ?? null;

  return (
    <Page>
      <div className="grid grid-cols-1 lg:grid-cols-[17rem_1fr] xl:grid-cols-[17rem_1fr_22rem] gap-4 items-start">
        <Card title="Filters" actions={filtersActive && <Button size="sm" variant="ghost" onClick={reset}>Clear all</Button>}>
          <div className="space-y-4">
            <SearchBox label="Keyword" value={search} onChange={setSearch} placeholder="Decree, person, topic" />
            <Field label="Source">
              {(p) => (
                <select {...p} className={inputClass} value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                  <option value="">Official records and news</option>
                  <option value="Official">Official records only</option>
                  <option value="News">News only</option>
                </select>
              )}
            </Field>
            <Field label="Type of event">
              {(p) => (
                <select {...p} className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">All types</option>
                  <option value="Floor Vote">Floor vote</option>
                  <option value="Committee Meeting">Committee meeting</option>
                  <option value="Political Statement">Political statement</option>
                  <option value="Corporate Regulation">Corporate regulation</option>
                  <option value="Legislative Act">Legislative act</option>
                </select>
              )}
            </Field>
            <Field label="Party">
              {(p) => (
                <select {...p} className={inputClass} value={party} onChange={(e) => setParty(e.target.value)}>
                  <option value="">All parties</option>
                  <option value="FdI">Fratelli d&apos;Italia (FdI)</option>
                  <option value="Lega">Lega</option>
                  <option value="FI">Forza Italia (FI)</option>
                  <option value="PD">Partito Democratico (PD)</option>
                  <option value="M5S">Movimento 5 Stelle (M5S)</option>
                </select>
              )}
            </Field>
            <Field label="Period">
              {(p) => (
                <select {...p} className={inputClass} value={days} onChange={(e) => setDays(e.target.value)}>
                  <option value="7">Last 7 days</option>
                  <option value="14">Last 14 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="60">Last 60 days</option>
                </select>
              )}
            </Field>
          </div>
        </Card>

        <section aria-labelledby="events" className="space-y-3 min-w-0">
          <h2 id="events" className="text-lg font-semibold text-fg" aria-live="polite">{loading ? "Loading events…" : plural(events.length, "event")}</h2>
          {loadError ? (
            <ErrorState onRetry={fetchEvents} />
          ) : loading ? (
            <Loading message="Loading Italian political events…" />
          ) : events.length === 0 ? (
            <EmptyState title="No events match these filters" action={filtersActive && <Button onClick={reset}>Clear filters</Button>} />
          ) : (
            <ul className="space-y-5">
              {events.map((evt) => {
                const isSelected = evt.id === selectedId;
                return (
                  <li key={evt.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(evt.id)}
                      aria-pressed={isSelected}
                      className={`group w-full text-left border-t pt-3 pb-1 space-y-2 ${isSelected ? "border-line-strong" : "border-line"}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 text-sm text-subtle">
                        <span className="tabular-nums">{formatDate(evt.date)}</span>
                        <Badge>{evt.category}</Badge>
                        <Badge tone={IMPACT_TONE[evt.impactLevel]}>{evt.impactLevel} impact</Badge>
                        <span>{evt.sourceName}</span>
                      </div>
                      <p className={`font-serif text-[1.0625rem] text-fg group-hover:underline ${isSelected ? "font-bold" : "font-semibold"}`}>{isSelected && <span className="inline-block w-2 h-2 mr-2 bg-marker align-middle" aria-hidden="true" />}{evt.title}</p>
                      {evt.description && <p className="text-sm text-muted line-clamp-2">{evt.description}</p>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="lg:col-span-2 xl:col-span-1 xl:sticky xl:top-6">
          <Card title="Selected event">
            {selected ? (
              <div className="space-y-4">
                <p className="font-semibold text-fg">{selected.title}</p>
                <p className="text-sm text-fg whitespace-pre-line">{selected.content || selected.description}</p>
                {selected.entities.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-fg mb-1">People involved</h3>
                    <ul className="space-y-1 text-sm">
                      {selected.entities.map((e) => (
                        <li key={e.name} className="flex justify-between gap-3"><span>{e.name} <span className="text-subtle">· {e.role}</span></span><Badge>{e.party}</Badge></li>
                      ))}
                    </ul>
                  </div>
                )}
                {selected.sourceUrl && <ExternalLink href={selected.sourceUrl} className="text-sm">Original source</ExternalLink>}
                <Button variant="primary" className="w-full" onClick={() => setReportFor(selected)}>
                  <Sparkles className="w-4 h-4" aria-hidden="true" /> Write a public affairs report
                </Button>
                <p className="text-sm text-subtle">The report is AI-generated from this event only.</p>
              </div>
            ) : (
              <p className="text-sm text-muted">Select an event to see its details.</p>
            )}
          </Card>
        </div>
      </div>

      <SourceNote>
        Sources: Chamber of Deputies open data (final votes) and NewsData.io (Italian political news), refreshed twice a day and kept for 60 days. Impact
        levels are assigned by keyword rules, not by an analyst.
      </SourceNote>

      {reportFor && <ReportDialog event={reportFor} onClose={() => setReportFor(null)} />}
    </Page>
  );
}
