"use client";

import React, { useState, useEffect } from "react";
import { Download, Copy, Check, X, Sparkles, Cpu } from "lucide-react";
import { type SummarizerConfig } from "@/lib/types";

export type SummarizerAccent = "emerald" | "cyan" | "purple" | "fuchsia" | "amber" | "blue";

export interface SummarizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Document to summarize */
  document: SummarizerConfig | null;
  /** Color accent for the modal */
  accent?: SummarizerAccent;
  /** Label for the identifier line under the title (default "CELEX") */
  idLabel?: string;
  /** Small uppercase label in the header (default "AI Document Summarizer") */
  headerLabel?: string;
  /** Message shown while generating the summary */
  loadingMessage?: string;
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
    body: JSON.stringify({
      title: doc.title,
      snippet: doc.snippet,
      namespace: doc.namespace,
      celex: doc.celex,
      detailed,
    }),
    signal,
  });

  if (!res.ok) throw new Error("Failed to generate summary.");
  const data = await res.json();
  return data.summary as string;
};

/**
 * Reusable AI Document Summarizer modal.
 * Replaces the duplicated summarizer UI across eurlex, legal, research, and mep-questions pages.
 */
export default function SummarizerModal({
  isOpen,
  onClose,
  document: doc,
  accent = "emerald",
  idLabel = "CELEX",
  headerLabel = "AI Document Summarizer",
  loadingMessage = "Fetching document from EUR-Lex Cellar & generating AI summary...",
  fetchSummary = defaultFetchSummary,
}: SummarizerModalProps) {
  const [summaryText, setSummaryText] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [isDetailed, setIsDetailed] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Accent color map
  const colors = {
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500/30", glow: "shadow-emerald-500/10" },
    cyan: { text: "text-cyan-400", bg: "bg-cyan-500", border: "border-cyan-500/30", glow: "shadow-cyan-500/10" },
    purple: { text: "text-purple-400", bg: "bg-purple-500", border: "border-purple-500/30", glow: "shadow-purple-500/10" },
    fuchsia: { text: "text-fuchsia-400", bg: "bg-fuchsia-500", border: "border-fuchsia-500/30", glow: "shadow-fuchsia-500/10" },
    amber: { text: "text-amber-400", bg: "bg-amber-500", border: "border-amber-500/30", glow: "shadow-amber-500/10" },
    blue: { text: "text-blue-400", bg: "bg-blue-500", border: "border-blue-500/30", glow: "shadow-blue-500/10" },
  };
  const c = colors[accent];

  // Generate the summary whenever the modal opens, the document changes, or the
  // Concise/Detailed toggle flips. Stale requests are aborted so a slower earlier
  // request can never overwrite a newer one.
  useEffect(() => {
    if (!isOpen || !doc) return;

    const controller = new AbortController();
    setSummarizing(true);
    setSummaryText("");
    setCopySuccess(false);

    (async () => {
      try {
        const text = await fetchSummary(doc, isDetailed, controller.signal);
        if (!controller.signal.aborted) setSummaryText(text);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        setSummaryText(`⚠️ Failed to draft summary: ${err.message || "An error occurred."}`);
      } finally {
        if (!controller.signal.aborted) setSummarizing(false);
      }
    })();

    return () => controller.abort();
  }, [isOpen, doc, isDetailed, fetchSummary]);

  // Escape key closes modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const downloadSummary = () => {
    if (!doc || !summaryText) return;
    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${doc.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!summaryText) return;
    navigator.clipboard.writeText(summaryText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (!isOpen || !doc) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex justify-end animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Document Summarizer"
    >
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${c.text}`} />
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400">
                {headerLabel}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white leading-snug truncate">{doc.title}</h3>
            <p className="text-[10px] font-mono text-slate-500">{idLabel}: {doc.celex}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors p-1.5 hover:bg-slate-800 rounded-xl cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Detail toggle */}
        <div className="px-6 pt-4 flex gap-2">
          <button
            onClick={() => setIsDetailed(false)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border transition-all cursor-pointer ${
              !isDetailed
                ? `${c.border} ${c.text} bg-slate-950`
                : "border-slate-800 text-slate-400 hover:text-slate-300"
            }`}
          >
            Concise (~250 words)
          </button>
          <button
            onClick={() => setIsDetailed(true)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border transition-all cursor-pointer ${
              isDetailed
                ? `${c.border} ${c.text} bg-slate-950`
                : "border-slate-800 text-slate-400 hover:text-slate-300"
            }`}
          >
            Detailed (~1000 words)
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {summarizing ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Cpu className={`w-8 h-8 ${c.text} animate-spin`} />
              <span className="text-xs text-slate-400 font-medium">
                {loadingMessage}
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
              {summaryText}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={copyToClipboard}
            disabled={!summaryText || summarizing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-xs font-bold text-slate-300 hover:text-white transition-all disabled:opacity-40 cursor-pointer"
          >
            {copySuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copySuccess ? "Copied!" : "Copy Text"}
          </button>
          <button
            onClick={downloadSummary}
            disabled={!summaryText || summarizing}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl ${c.bg} text-slate-950 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer hover:opacity-90`}
          >
            <Download className="w-4 h-4" /> Download .txt
          </button>
        </div>
      </div>
    </div>
  );
}
