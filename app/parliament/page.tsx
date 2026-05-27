"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  BarChart3, 
  Search, 
  Sparkles, 
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Activity,
  ShieldAlert,
  ChevronRight,
  CheckCircle,
  Clock,
  ExternalLink,
  Cpu
} from "lucide-react";

export default function ParliamentWatcherPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Plenary vote states
  const [activeVoteId, setActiveVoteId] = useState("sitting-202605");
  const [voteData, setVoteData] = useState<any>(null);
  const [loadingVote, setLoadingVote] = useState(false);

  const fetchQuestions = async (queryTerm = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/parliament?q=${encodeURIComponent(queryTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error("Failed to fetch EP questions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoteData = async (voteId: string) => {
    setLoadingVote(true);
    try {
      const res = await fetch(`/api/parliament?type=votes&id=${voteId}`);
      if (res.ok) {
        const data = await res.json();
        setVoteData(data.vote);
      }
    } catch (err) {
      console.error("Failed to fetch vote data:", err);
    } finally {
      setLoadingVote(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchVoteData(activeVoteId);
  }, []);

  useEffect(() => {
    fetchVoteData(activeVoteId);
  }, [activeVoteId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Background Sphere */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 space-y-12 z-10">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-6">
          <Link 
            href="/enel"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_#a855f7]" />
            <span className="text-xs font-bold font-mono text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
              European Parliament Tracker
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-400" /> European Parliament Watcher (Open Data API v2)
          </h2>
          <p className="text-xs text-slate-400">Track parliamentary questions targeting DG ENER, Catania 3SUN gigafactory support, and plenary sit voting records</p>
        </div>

        {/* Division into two panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Parliamentary Questions Watcher (7/12 columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-slate-900/20 border border-slate-900 border-t-4 border-t-purple-500 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md pointer-events-none">
                [MEP Inquiries]
              </div>
              
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-200">Tracked Legislative Inquiries</h3>
                <p className="text-[11px] text-slate-455">Filter and search parliamentary questions filed by MEPs targeting Enel strategic topics</p>
              </div>

              {/* Search Row */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchQuestions(search)}
                    placeholder="Search asked by, title or question contents..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-950/60 border border-slate-900 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <button
                  onClick={() => fetchQuestions(search)}
                  className="py-3 px-5 rounded-xl bg-purple-500 hover:bg-purple-450 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Questions Feed */}
            <div className="space-y-4">
              {loading ? (
                <div className="p-12 border border-slate-900 rounded-3xl bg-slate-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-3">
                  <Activity className="w-8 h-8 text-purple-400 animate-pulse animate-spin" />
                  <span className="text-xs text-slate-400 font-medium">Fetching inquiries feed from European Parliament portal...</span>
                </div>
              ) : questions.length === 0 ? (
                <div className="p-12 text-center border border-slate-900 rounded-3xl bg-slate-900/20 backdrop-blur-md text-slate-500 italic text-xs">
                  No parliamentary questions match the query parameters.
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q) => {
                    const isHigh = q.risk === "High Risk";
                    const isMed = q.risk === "Med Risk";
                    const borderAccent = isHigh ? "border-red-500/30 bg-red-500/[0.01]" : isMed ? "border-amber-500/30 bg-amber-500/[0.01]" : "border-emerald-500/30 bg-emerald-500/[0.01]";
                    const textAccent = isHigh ? "text-red-400 bg-red-500/10 border-red-500/20" : isMed ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                    return (
                      <div 
                        key={q.id}
                        className={`p-6 border rounded-2xl flex flex-col gap-4 hover:border-slate-800 transition-all ${borderAccent}`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-500 font-bold">{q.id}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${q.status === "Answered" ? "bg-emerald-950/40 border border-emerald-900 text-emerald-400" : "bg-amber-950/40 border border-amber-900 text-amber-400"}`}>
                                {q.status === "Answered" ? <CheckCircle className="inline w-3 h-3 mr-1" /> : <Clock className="inline w-3 h-3 mr-1" />}
                                {q.status}
                              </span>
                              <span className={`text-[8px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${textAccent}`}>
                                {q.risk}
                              </span>
                            </div>
                          </div>

                          <h4 className="text-xs font-bold text-slate-200 leading-snug">{q.title}</h4>
                          <div className="text-[10px] font-mono text-slate-455 bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                            {q.content}
                          </div>
                        </div>

                        {/* Advocacy rationale */}
                        <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl space-y-1 relative overflow-hidden">
                          <div className="absolute top-2 right-2 flex items-center gap-1 text-slate-600">
                            <Cpu className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                            <span className="text-[8px] font-mono font-bold tracking-widest uppercase">Advocate AI</span>
                          </div>
                          <h5 className="text-[9px] font-mono font-extrabold uppercase text-purple-400">Risk Assessment Rationale</h5>
                          <p className="text-[10px] text-slate-400 leading-relaxed font-sans">{q.riskRationale}</p>
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-2 border-t border-slate-900/50">
                          <span>Asked by: <strong className="text-slate-400">{q.askedBy}</strong> ({q.committee})</span>
                          <span>Target: {q.target} | Date: {q.date}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Sit Vote Results Tracker (5/12 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-slate-900/20 border border-slate-900 border-t-4 border-t-purple-500 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[500px]">
              <div className="absolute top-4 right-4 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md pointer-events-none">
                [Vote Results]
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Plenary Sitting Vote Tracker</h3>
                  <p className="text-[11px] text-slate-455">Monitor committee-level draft splits and final plenary outcomes</p>
                </div>

                {/* Vote sitting selector */}
                <div className="flex gap-2 p-0.5 bg-slate-950 rounded-xl border border-slate-900">
                  <button
                    onClick={() => setActiveVoteId("sitting-202605")}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${activeVoteId === "sitting-202605" ? "bg-slate-900 text-purple-400 border border-slate-850" : "text-slate-455 hover:text-slate-300"}`}
                  >
                    Sitting 2026-05
                  </button>
                  <button
                    onClick={() => setActiveVoteId("sitting-202604")}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${activeVoteId === "sitting-202604" ? "bg-slate-900 text-purple-400 border border-slate-850" : "text-slate-455 hover:text-slate-300"}`}
                  >
                    Sitting 2026-04
                  </button>
                </div>

                {/* Vote detail box */}
                {loadingVote ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Cpu className="w-8 h-8 text-purple-400 animate-spin" />
                    <span className="text-xs text-slate-400 font-medium">Extracting sitting votes data...</span>
                  </div>
                ) : voteData ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="text-[9px] font-mono text-slate-500 font-bold uppercase">Sitting Resolution:</div>
                      <h4 className="text-xs font-bold text-slate-200 leading-snug">{voteData.resolution}</h4>
                      <div className="text-[9px] font-mono text-slate-400">Date: {voteData.sittingDate} | Outcome: <span className="text-purple-400 font-bold uppercase">{voteData.outcome}</span></div>
                    </div>

                    {/* Chart splits */}
                    <div className="space-y-3.5 bg-slate-950 p-4 rounded-xl border border-slate-900">
                      <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">MEP Vote Splits (Total: {voteData.totalVotes})</div>
                      
                      {/* Yes bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-emerald-400 font-bold flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> YES</span>
                          <span>{voteData.split.yes} MEPs ({((voteData.split.yes / voteData.totalVotes) * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(voteData.split.yes / voteData.totalVotes) * 100}%` }} />
                        </div>
                      </div>

                      {/* No bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-red-400 font-bold flex items-center gap-1"><ThumbsDown className="w-3.5 h-3.5" /> NO</span>
                          <span>{voteData.split.no} MEPs ({((voteData.split.no / voteData.totalVotes) * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${(voteData.split.no / voteData.totalVotes) * 100}%` }} />
                        </div>
                      </div>

                      {/* Abstain */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-400 font-bold">ABSTAIN</span>
                          <span>{voteData.split.abstain} MEPs ({((voteData.split.abstain / voteData.totalVotes) * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-500 rounded-full" style={{ width: `${(voteData.split.abstain / voteData.totalVotes) * 100}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Policy impact assessment */}
                    <div className="p-4 bg-slate-950 border border-slate-900 border-t-2 border-t-purple-500 rounded-xl space-y-1.5 relative overflow-hidden">
                      <div className="absolute top-2 right-2 text-purple-500">
                        <Cpu className="w-4 h-4 animate-pulse" />
                      </div>
                      <h4 className="text-[10px] font-mono font-extrabold uppercase text-purple-400">Enel Policy Strategic Impact</h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{voteData.strategicImpact}</p>
                    </div>

                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 italic text-xs">No vote results loaded.</div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-900/60 text-center">
                <span className="text-[10px] font-mono text-slate-500">Vote splits retrieved via sitting-id API mapping</span>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
