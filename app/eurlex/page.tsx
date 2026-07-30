"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  Search,
  Sparkles,
  ExternalLink
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ErrorBanner from "@/components/ErrorBanner";
import LoadingSpinner from "@/components/LoadingSpinner";
import SummarizerModal from "@/components/SummarizerModal";
import { type EurLexHit, type SummarizerConfig } from "@/lib/types";

export default function EurlexExplorerPage() {
  const [query, setQuery] = useState("State aid energy");
  const [hits, setHits] = useState<EurLexHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Summarizer modal states
  const [activeDoc, setActiveDoc] = useState<SummarizerConfig | null>(null);

  const presets = [
    { label: "State Aid & Subsidies", q: "State aid energy renewable" },
    { label: "RED III Directive", q: "Renewable Energy Directive greenhouse" },
    { label: "Electricity Market Design", q: "Electricity market price consumer" },
    { label: "ACER Grid Codes", q: "transmission grid distribution smart" }
  ];

  const handleSearch = async (searchTerm?: string) => {
    const activeTerm = searchTerm || query;
    if (!activeTerm.trim()) return;

    if (searchTerm) setQuery(searchTerm);
    setLoading(true);
    setError("");
    setHits([]);

    try {
      const res = await fetch(`/api/eurlex?q=${encodeURIComponent(activeTerm)}&top_k=8`);
      if (!res.ok) {
        throw new Error("Failed to contact live SPARQL route.");
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setHits(data.hits || []);
    } catch (err: any) {
      setError(err.message || "An issue occurred querying the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSummarize = (doc: EurLexHit) => {
    setActiveDoc({
      title: doc.title,
      snippet: doc.snippet,
      namespace: "all",
      celex: doc.id
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 space-y-8">

        {/* Navigation & Header */}
        <PageHeader
          backHref="/"
          backLabel="Back to Gateway"
          badge="CELLAR SPARQL Live"
          accent="blue"
        />

        {/* Title & Description */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Scale className="w-6 h-6 text-blue-400" /> EUR-Lex Cellar Directives Search
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Perform live semantic searches across EU regulations, directives, decisions, and judicial precedents directly via the official Cellar Triplestore.
          </p>
        </div>

        {/* Search Console Box */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-5">

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter search terms (e.g., 'State aid renewable' or 'smart grid')..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="py-2.5 px-5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Search SPARQL</span> <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Presets Row */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Pre-Configured Policy Presets
            </span>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handleSearch(p.q)}
                  disabled={loading}
                  className="px-3 py-1 text-xs font-semibold rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Stream */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Cellar SPARQL Directives ({hits.length})</h2>
          </div>

          {loading && (
            <div className="border border-slate-800 rounded-lg bg-slate-900/60">
              <LoadingSpinner message="Querying EU Publications Office Cellar database..." accent="blue" size="sm" icon="cpu" />
            </div>
          )}

          {error && (
            <ErrorBanner message={error} onRetry={() => handleSearch()} />
          )}

          {!loading && !error && hits.length === 0 && (
            <div className="p-12 text-center border border-slate-800 rounded-lg bg-slate-900/60 text-slate-400 text-xs italic">
              No matching records returned. Run a new search query above.
            </div>
          )}

          {!loading && !error && hits.length > 0 && (
            <div className="space-y-3">
              {hits.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="p-5 border border-slate-800 bg-slate-900/60 rounded-lg flex flex-col gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-950 border border-slate-800 text-slate-300">
                        {doc.sector}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 ml-auto">{doc.id}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 leading-snug">
                      {doc.title}
                    </h3>

                    <p className="text-xs text-slate-400 font-mono leading-relaxed bg-slate-950 p-3 rounded-md border border-slate-800/80 whitespace-pre-wrap">
                      {doc.snippet}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <span>View Official Record</span> <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                    <button
                      onClick={() => handleSummarize(doc)}
                      className="px-3 py-1.5 rounded-md bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Summarize</span> <Sparkles className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <SummarizerModal
        isOpen={!!activeDoc}
        onClose={() => setActiveDoc(null)}
        document={activeDoc}
        accent="blue"
      />

    </div>
  );
}
