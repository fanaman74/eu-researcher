"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Zap, 
  Search, 
  Sparkles, 
  Activity,
  ShieldAlert,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  ExternalLink,
  Cpu,
  FileText,
  UserCheck
} from "lucide-react";

export default function ComitologyPage() {
  const [votes, setVotes] = useState<any[]>([]);
  const [activeVoteId, setActiveVoteId] = useState("VOTE-2026-GRID");
  const [activeVote, setActiveVote] = useState<any>(null);
  const [loadingVote, setLoadingVote] = useState(false);

  const fetchVotes = async () => {
    try {
      const res = await fetch("/api/comitology");
      if (res.ok) {
        const data = await res.json();
        setVotes(data.votes || []);
      }
    } catch (err) {
      console.error("Failed to fetch votes:", err);
    }
  };

  const fetchActiveVote = async (id: string) => {
    setLoadingVote(true);
    try {
      const res = await fetch(`/api/comitology?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveVote(data.vote);
      }
    } catch (err) {
      console.error("Failed to fetch active vote:", err);
    } finally {
      setLoadingVote(false);
    }
  };

  useEffect(() => {
    fetchVotes();
    fetchActiveVote(activeVoteId);
  }, []);

  useEffect(() => {
    fetchActiveVote(activeVoteId);
  }, [activeVoteId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Background Sphere */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

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
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_#06b6d4]" />
            <span className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
              Comitology Watcher
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-400" /> Comitology & Technical Acts Monitor
          </h2>
          <p className="text-xs text-slate-400">Track voting sheets, smart-grid balancing acts, battery storage standards, and delegated acts decided by Commission experts</p>
        </div>

        {/* Divisions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Active comitology regulations list (5/12 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-slate-900/20 border border-slate-900 border-t-4 border-t-cyan-500 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md pointer-events-none">
                [Committee Acts]
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Monitored Committee Measures</h3>
                  <p className="text-[11px] text-slate-455">Select a delegated act to track voting details and strategic impacts</p>
                </div>

                <div className="space-y-3.5">
                  {votes.map((item) => {
                    const isActive = activeVoteId === item.id;
                    const borderAccent = isActive ? "border-cyan-500/50 bg-cyan-500/[0.01]" : "border-slate-900 bg-slate-950/40";
                    return (
                      <div
                        key={item.id}
                        onClick={() => setActiveVoteId(item.id)}
                        className={`p-5 border rounded-2xl cursor-pointer hover:border-slate-800 transition-all space-y-2.5 ${borderAccent}`}
                      >
                        <div className="flex items-center justify-between text-[9px] font-mono">
                          <span className="text-slate-500 font-bold">{item.registerId}</span>
                          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/25 px-2 py-0.5 rounded font-extrabold">{item.status}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 leading-snug">{item.measure}</h4>
                        <div className="flex items-center justify-between text-[9.5px] text-slate-550 font-mono">
                          <span>Chair: {item.chairperson}</span>
                          <span>Date: {item.date}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

          {/* Voting Details & Enel Impact (7/12 columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-slate-900/20 border border-slate-900 border-t-4 border-t-cyan-500 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[500px]">
              <div className="absolute top-4 right-4 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md pointer-events-none">
                [Comitology Analysis]
              </div>

              <div className="space-y-6 flex-1">
                <div>
                  <h3 className="text-base font-bold text-slate-200 flex items-center gap-1.5"><UserCheck className="w-4.5 h-4.5 text-cyan-400" /> Voting Sheet & Strategic Advocacy alignment</h3>
                  <p className="text-[11px] text-slate-455">Analyze member states approval patterns and technical alignment targets</p>
                </div>

                {loadingVote ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
                    <span className="text-xs text-slate-400 font-medium">Extracting voting sheet layouts...</span>
                  </div>
                ) : activeVote ? (
                  <div className="space-y-6">
                    
                    {/* Voting card stats */}
                    <div className="grid grid-cols-3 gap-4 bg-slate-950 p-5 border border-slate-900 rounded-2xl">
                      <div className="text-center space-y-1">
                        <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> IN FAVOUR</span>
                        <div className="text-2xl font-bold font-mono text-white">{activeVote.votingSheet.inFavour}</div>
                        <span className="text-[9px] font-sans text-slate-500">Member States</span>
                      </div>
                      <div className="text-center space-y-1 border-x border-slate-900">
                        <span className="text-[9px] font-mono font-bold text-red-400 uppercase tracking-widest flex items-center justify-center gap-1"><XCircle className="w-3.5 h-3.5" /> AGAINST</span>
                        <div className="text-2xl font-bold font-mono text-white">{activeVote.votingSheet.against}</div>
                        <span className="text-[9px] font-sans text-slate-500">Member States</span>
                      </div>
                      <div className="text-center space-y-1">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> ABSTAIN</span>
                        <div className="text-2xl font-bold font-mono text-white">{activeVote.votingSheet.abstentions}</div>
                        <span className="text-[9px] font-sans text-slate-500">Member States</span>
                      </div>
                    </div>

                    {/* Member state listing splits */}
                    <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-900">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Member States Position Listing</h4>
                      
                      <div className="space-y-3 divide-y divide-slate-900/60">
                        <div className="flex justify-between items-start pt-0 text-xs">
                          <span className="text-[10px] font-mono text-red-400 uppercase font-bold shrink-0 w-28">Voted Against:</span>
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            {activeVote.votingSheet.countriesAgainst.map((c: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-red-950/20 border border-red-900/30 text-red-400 font-mono text-[10px]">{c}</span>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-start pt-3 text-xs">
                          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold shrink-0 w-28">Abstained:</span>
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            {activeVote.votingSheet.countriesAbstaining.map((c: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[10px]">{c}</span>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 text-xs">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold shrink-0 w-28">In Favour:</span>
                          <span className="text-[10px] font-mono text-slate-400 text-right">Remaining 23 supportive Member States</span>
                        </div>
                      </div>
                    </div>

                    {/* Strategic Enel impact analysis */}
                    <div className="p-4 bg-slate-950 border border-slate-900 border-t-2 border-t-cyan-500 rounded-xl space-y-1.5 relative overflow-hidden">
                      <div className="absolute top-2.5 right-2.5 text-cyan-400">
                        <Cpu className="w-4 h-4 animate-pulse" />
                      </div>
                      <h4 className="text-[10px] font-mono font-extrabold uppercase text-cyan-400">Advocate AI Strategic Assessment</h4>
                      <p className="text-[11px] text-slate-350 leading-relaxed font-sans">{activeVote.strategicImpact}</p>
                    </div>

                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 italic text-xs">No comitology vote results loaded.</div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-900/60 text-center">
                <span className="text-[10px] font-mono text-slate-500">Comitology records retrieved via Commission Expert API</span>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
