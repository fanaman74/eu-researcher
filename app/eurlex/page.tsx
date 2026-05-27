"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Scale, 
  Search, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  Cpu,
  FileText,
  Copy,
  Check,
  Download,
  X
} from "lucide-react";

export default function EurlexExplorerPage() {
  const [query, setQuery] = useState("State aid energy");
  const [hits, setHits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Summarizer modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<any>(null);
  const [summaryText, setSummaryText] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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

  // Run initial search
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSummarize = async (doc: any) => {
    setActiveDoc(doc);
    setModalOpen(true);
    setSummarizing(true);
    setSummaryText("");
    setCopySuccess(false);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: doc.title,
          snippet: doc.snippet,
          namespace: "all",
          celex: doc.id,
          detailed: true
        })
      });
      if (!res.ok) {
        throw new Error("Failed to compile summary.");
      }
      const data = await res.json();
      setSummaryText(data.summary);
    } catch (err: any) {
      setSummaryText(`⚠️ Failed to draft summary: ${err.message || "Error occurred."}`);
    } finally {
      setSummarizing(false);
    }
  };

  const copyToClipboard = () => {
    if (!summaryText) return;
    navigator.clipboard.writeText(summaryText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const downloadSummary = () => {
    if (!activeDoc || !summaryText) return;
    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeDoc.id}_enel_summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Background Sphere */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 space-y-8 z-10">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-6">
          <Link 
            href="/enel"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
            <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              EUR-Lex Cellar Watcher
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Scale className="w-6 h-6 text-emerald-400" /> EUR-Lex Cellar Semantic Database Explorer
          </h2>
          <p className="text-xs text-slate-400">Query legal directives, secondary legislation, and case precedents direct via Publications Office SPARQL</p>
        </div>

        {/* Console Box */}
        <div className="bg-slate-900/20 border border-slate-900 border-t-4 border-t-emerald-500 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-md relative overflow-hidden">
          
          <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md pointer-events-none">
            [SPARQL Live Console]
          </div>

          {/* Search Row */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter EU legal concepts or search keywords (e.g. 'State aid gigafactory' or 'smart grid')..."
                className="w-full pl-12 pr-4 py-3 bg-slate-950/60 border border-slate-900 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-450 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              Run SPARQL Search <Sparkles className="w-4 h-4" />
            </button>
          </div>

          {/* Presets Row */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Pre-Configured Strategic Permuting Presets
            </span>
            <div className="flex flex-wrap gap-2.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(p.q)}
                  disabled={loading}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-950 border border-slate-900 hover:border-emerald-500/50 hover:bg-slate-900/40 text-slate-300 hover:text-slate-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Stream */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Search Stream Outputs</h3>

          {loading && (
            <div className="p-12 border border-slate-900 rounded-3xl bg-slate-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-3">
              <Cpu className="w-8 h-8 text-emerald-400 animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Querying European Publications Office Cellar Triplestore...</span>
            </div>
          )}

          {error && (
            <div className="p-6 border border-red-500/20 bg-red-500/5 text-red-400 text-xs rounded-2xl flex items-center gap-3 leading-relaxed">
              <span>⚠️ {error}</span>
            </div>
          )}

          {!loading && !error && hits.length === 0 && (
            <div className="p-12 text-center border border-slate-900 rounded-3xl bg-slate-900/20 backdrop-blur-md text-slate-500 italic text-xs">
              No matching records returned. Run a new SPARQL search query above.
            </div>
          )}

          {!loading && !error && hits.length > 0 && (
            <div className="space-y-4">
              {hits.map((doc, idx) => {
                const scorePercent = (doc.score * 100).toFixed(0);
                return (
                  <div 
                    key={idx}
                    className="p-6 border border-slate-900 bg-slate-900/20 hover:border-slate-850 hover:bg-slate-900/40 backdrop-blur-md rounded-2xl flex flex-col gap-4 relative group transition-all duration-300 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-[10px] font-mono font-bold text-slate-500">#{idx + 1}</span>
                        <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider bg-slate-900 border border-slate-850 text-slate-400">
                          {doc.sector}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold border bg-emerald-950/20 border-emerald-500/20 text-emerald-400">
                          {scorePercent}% Semantic Fit
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-bold ml-auto">{doc.id}</span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-200 leading-snug group-hover:text-white transition-colors">
                        {doc.title}
                      </h4>

                      <p className="text-[10px] text-slate-455 font-mono leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-900/80 whitespace-pre-wrap">
                        {doc.snippet}
                      </p>
                    </div>

                    <div className="flex items-center justify-start gap-3 pt-3 border-t border-slate-900/50">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-900 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-350 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        View EUR-Lex <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button 
                        onClick={() => handleSummarize(doc)} 
                        className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-350 text-[10px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        Summarise <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Summarizer slide-over modal */}
      {modalOpen && activeDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-end z-50 animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-850 h-full flex flex-col justify-between p-6 md:p-8 shadow-2xl relative">
            
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 transition-colors w-8 h-8 rounded-full border border-slate-800 hover:border-slate-700 bg-slate-950/40 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-6 flex-1 overflow-y-auto pr-1">
              <div>
                <span className="text-[9px] font-mono tracking-widest font-extrabold uppercase px-2.5 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                  Enel Intelligence Summariser
                </span>
                <h3 className="text-lg font-bold text-white mt-3 leading-snug">{activeDoc.title}</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-1.5">CELEX: {activeDoc.id} | Jurisdiction: European Union</p>
              </div>

              <div className="border-t border-slate-850 pt-4">
                {summarizing ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Cpu className="w-8 h-8 text-emerald-400 animate-spin" />
                    <span className="text-xs text-slate-400 font-medium">Advocate AI drafting executive legal brief...</span>
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 pb-2 border-b border-slate-900">
                      <FileText className="w-4.5 h-4.5" /> Generated Executive Briefing Summary
                    </div>
                    <div className="text-xs leading-relaxed font-sans text-slate-300 whitespace-pre-wrap">
                      {summaryText}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-slate-850">
              <button
                onClick={copyToClipboard}
                disabled={summarizing || !summaryText}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {copySuccess ? <Check className="w-4.5 h-4.5 text-emerald-400" /> : <Copy className="w-4.5 h-4.5" />}
                {copySuccess ? "Copied Brief!" : "Copy Briefing"}
              </button>
              <button
                onClick={downloadSummary}
                disabled={summarizing || !summaryText}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-450 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4.5 h-4.5" /> Download TXT
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
