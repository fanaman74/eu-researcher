"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  BarChart3, 
  Search, 
  Activity,
  CheckCircle,
  Clock,
  Cpu,
  ThumbsUp,
  ThumbsDown
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
  }, []);

  useEffect(() => {
    fetchVoteData(activeVoteId);
  }, [activeVoteId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 space-y-8">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <Link 
            href="/enel"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Public Affairs Hub
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md">
              EP Open Data Watch
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" /> European Parliament Watcher
          </h1>
          <p className="text-xs text-slate-400">Track MEP written inquiries, DG ENER hearings, and plenary voting records</p>
        </div>

        {/* Division into two panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Parliamentary Questions Watcher (7/12 columns) */}
          <div className="lg:col-span-7 space-y-5">
            
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-200">Tracked Legislative Inquiries</h2>
                <p className="text-xs text-slate-400">Search written questions submitted by MEPs to the European Commission</p>
              </div>

              {/* Search Row */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchQuestions(search)}
                    placeholder="Search MEP name, committee, or topic..."
                    className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <button
                  onClick={() => fetchQuestions(search)}
                  className="py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center transition-colors cursor-pointer"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Questions Feed */}
            <div className="space-y-3">
              {loading ? (
                <div className="p-12 border border-slate-800 rounded-lg bg-slate-900/60 flex flex-col items-center justify-center gap-3">
                  <Activity className="w-6 h-6 text-blue-400 animate-spin" />
                  <span className="text-xs text-slate-400">Fetching inquiries feed from EP portal...</span>
                </div>
              ) : questions.length === 0 ? (
                <div className="p-12 text-center border border-slate-800 rounded-lg bg-slate-900/60 text-slate-400 text-xs italic">
                  No parliamentary questions match the search query.
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q) => {
                    const isHigh = q.risk === "High Risk";
                    const isMed = q.risk === "Med Risk";
                    const borderStyle = isHigh ? "border-red-500/20 bg-slate-900/80" : isMed ? "border-amber-500/20 bg-slate-900/80" : "border-slate-800 bg-slate-900/60";
                    const riskBadgeStyle = isHigh ? "text-red-400 bg-red-500/10 border-red-500/20" : isMed ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-slate-300 bg-slate-800 border-slate-700";
                    
                    return (
                      <div 
                        key={q.id}
                        className={`p-5 border rounded-lg flex flex-col gap-3 hover:border-slate-700 transition-colors ${borderStyle}`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400">{q.id}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${q.status === "Answered" ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
                                {q.status === "Answered" ? <CheckCircle className="inline w-3 h-3 mr-1 text-emerald-400" /> : <Clock className="inline w-3 h-3 mr-1 text-amber-400" />}
                                {q.status}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${riskBadgeStyle}`}>
                                {q.risk}
                              </span>
                            </div>
                          </div>

                          <h3 className="text-xs font-bold text-slate-100 leading-snug">{q.title}</h3>
                          <div className="text-[11px] font-mono text-slate-300 bg-slate-950 p-3 rounded-md border border-slate-800">
                            {q.content}
                          </div>
                        </div>

                        {/* Advocacy rationale */}
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
                          <h4 className="text-[10px] font-mono font-bold uppercase text-blue-400">Risk Assessment Rationale</h4>
                          <p className="text-xs text-slate-400 leading-relaxed font-sans">{q.riskRationale}</p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                          <span>Asked by: <strong className="text-slate-200">{q.askedBy}</strong> ({q.committee})</span>
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
          <div className="lg:col-span-5 space-y-5">
            
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-5 flex flex-col justify-between min-h-[500px]">

              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-200">Plenary Sitting Vote Tracker</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Monitor committee splits and final plenary outcomes</p>
                </div>

                {/* Vote sitting selector */}
                <div className="flex gap-2 p-1 bg-slate-950 rounded-md border border-slate-800">
                  <button
                    onClick={() => setActiveVoteId("sitting-202605")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${activeVoteId === "sitting-202605" ? "bg-slate-800 text-blue-400" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Sitting 2026-05
                  </button>
                  <button
                    onClick={() => setActiveVoteId("sitting-202604")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${activeVoteId === "sitting-202604" ? "bg-slate-800 text-blue-400" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Sitting 2026-04
                  </button>
                </div>

                {/* Vote detail box */}
                {loadingVote ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Cpu className="w-6 h-6 text-blue-400 animate-spin" />
                    <span className="text-xs text-slate-400">Extracting sitting votes data...</span>
                  </div>
                ) : voteData ? (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Sitting Resolution</span>
                      <h3 className="text-xs font-bold text-slate-100 leading-snug">{voteData.resolution}</h3>
                      <div className="text-[10px] font-mono text-slate-400">Date: {voteData.sittingDate} | Outcome: <span className="text-blue-400 font-bold uppercase">{voteData.outcome}</span></div>
                    </div>

                    {/* Chart splits */}
                    <div className="space-y-3 bg-slate-950 p-4 rounded-md border border-slate-800">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">MEP Vote Splits (Total: {voteData.totalVotes})</div>
                      
                      {/* Yes bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-emerald-400 font-semibold flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> YES</span>
                          <span className="text-slate-300">{voteData.split.yes} MEPs ({((voteData.split.yes / voteData.totalVotes) * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(voteData.split.yes / voteData.totalVotes) * 100}%` }} />
                        </div>
                      </div>

                      {/* No bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-red-400 font-semibold flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> NO</span>
                          <span className="text-slate-300">{voteData.split.no} MEPs ({((voteData.split.no / voteData.totalVotes) * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${(voteData.split.no / voteData.totalVotes) * 100}%` }} />
                        </div>
                      </div>

                      {/* Abstain */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400 font-semibold">ABSTAIN</span>
                          <span className="text-slate-300">{voteData.split.abstain} MEPs ({((voteData.split.abstain / voteData.totalVotes) * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-600 rounded-full" style={{ width: `${(voteData.split.abstain / voteData.totalVotes) * 100}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Policy impact assessment */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-md space-y-1">
                      <h4 className="text-[10px] font-mono font-bold uppercase text-blue-400">Corporate Strategic Impact</h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{voteData.strategicImpact}</p>
                    </div>

                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs italic">No vote results loaded.</div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
