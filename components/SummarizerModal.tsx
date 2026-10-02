"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, X } from "lucide-react";
import { AiLabel, Button, Loading, Segmented } from "@/components/ui";
import { type SummarizerConfig } from "@/lib/types";

export interface SummarizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Document to summarize */
  document: SummarizerConfig | null;
  /** Label for the identifier line under the title (default "CELEX") */
  idLabel?: string;
  /**
   * Override the summary fetcher (default POSTs /api/summarize).
   * Must resolve to the summary text. Receives an AbortSignal that is
   * aborted when a newer request supersedes this one.
   */
  fetchSummary?: (doc: SummarizerConfig, detailed: boolean, signal: AbortSignal) => Promise<string>;
}

const defaultFetchSummary = async (doc: SummarizerConfig, detailed: boolean, signal: AbortSignal): Promise<string> => {
  const res = await fetch("/api/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: doc.title, snippet: doc.snippet, namespace: doc.namespace, celex: doc.celex, detailed }),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to generate summary.");
  return data.summary as string;
};

/** Side panel with an AI summary of an EUR-Lex document. */
export default function SummarizerModal({ isOpen, onClose, document: doc, idLabel = "CELEX", fetchSummary = defaultFetchSummary }: SummarizerModalProps) {
  const [summaryText, setSummaryText] = useState("");
  const [failed, setFailed] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [length, setLength] = useState<"short" | "long">("short");
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  // Callers pass inline handlers; keep the latest without re-running the focus effect.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Regenerate whenever the panel opens, the document changes or the length flips.
  // Stale requests are aborted so a slower earlier one never overwrites a newer one.
  useEffect(() => {
    if (!isOpen || !doc) return;
    const controller = new AbortController();
    setSummarizing(true);
    setSummaryText("");
    setFailed(false);
    setCopied(false);
    (async () => {
      try {
        const text = await fetchSummary(doc, length === "long", controller.signal);
        if (!controller.signal.aborted) setSummaryText(text);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) setSummarizing(false);
      }
    })();
    return () => controller.abort();
  }, [isOpen, doc, length, fetchSummary]);

  // Move focus into the panel on open, close on Escape, and restore focus on close.
  useEffect(() => {
    if (!isOpen) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      returnFocus.current?.focus?.();
    };
  }, [isOpen]);

  const download = () => {
    if (!doc || !summaryText) return;
    const url = URL.createObjectURL(new Blob([summaryText], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${doc.title.replace(/[^a-z0-9]/gi, "_").toLowerCase().slice(0, 80)}_summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    if (!summaryText) return;
    await navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen || !doc) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="summary-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} tabIndex={-1} className="relative w-full max-w-xl h-full bg-surface border-l border-line flex flex-col outline-none">
        <div className="p-5 border-b border-line flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-subtle">Summary</p>
            <h2 id="summary-title" className="text-lg font-semibold text-fg">{doc.title}</h2>
            <p className="text-sm text-subtle font-mono">{idLabel} {doc.celex}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close summary" className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-md text-muted hover:bg-sunken hover:text-fg">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <Segmented label="Summary length" options={[{ value: "short", label: "Short (about 250 words)" }, { value: "long", label: "Detailed (about 1,000 words)" }]} value={length} onChange={setLength} />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3" aria-live="polite">
          {summarizing ? (
            <Loading message="Reading the document and writing a summary…" slow="Long documents can take up to a minute." rows={4} />
          ) : failed ? (
            <p className="text-sm text-danger" role="alert">The summary could not be written. The document may be unavailable; try the other length or open the official record.</p>
          ) : (
            <>
              <AiLabel />
              <div className="text-base text-fg whitespace-pre-wrap">{summaryText}</div>
            </>
          )}
        </div>

        <div className="p-5 border-t border-line flex flex-wrap items-center justify-end gap-2">
          <span role="status" className="sr-only">{copied ? "Summary copied" : ""}</span>
          <Button onClick={copy} disabled={!summaryText || summarizing}>
            {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />} {copied ? "Copied" : "Copy"}
          </Button>
          <Button onClick={download} disabled={!summaryText || summarizing}>
            <Download className="w-4 h-4" aria-hidden="true" /> Download text
          </Button>
          <Button variant="primary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
