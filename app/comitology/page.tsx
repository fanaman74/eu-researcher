"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Zap, 
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  Cpu
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
  }, []);

  useEffect(() => {
    fetchActiveVote(activeVoteId);
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
              Comitology Watcher
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-400" /> Comitology & Technical Acts Monitor
          </h1>
          <p className="text-xs text-slate-400">Track voting sheets, smart-grid balancing acts, battery storage standards, and delegated acts</p>
        </div>

        {/* Divisions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Active comitology regulations list (5/12 columns) */}
          <div className="lg:col-span-5 space-y-5">
            
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-200">Monitored Committee Measures</h2>
                <p className="text-xs text-slate-400 mt-0.5">Select a delegated act to track voting details and strategic impacts</p>
              </div>

              <div className="space-y-3">
                {votes.map((item) => {
                  const isActive = activeVoteId === item.id;
                  const borderStyle = isActive ? "border-blue-500/60 bg-slate-900" : "border-slate-800 bg-slate-950/60 hover:border-slate-700";
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveVoteId(item.id)}
                      className={`p-4 border rounded-md cursor-pointer transition-colors space-y-2 ${borderStyle}`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-400 font-semibold">{item.registerId}</span>
                        <span className="text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded font-semibold">{item.status}</span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-100 leading-snug">{item.measure}</h3>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Chair: {item.chairperson}</span>
                        <span>Date: {item.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Voting Details & Enel Impact (7/12 columns) */}
          <div className="lg:col-span-7 space-y-5">
            
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-5 flex flex-col justify-between min-h-[500px]">

              <div className="space-y-5 flex-1">
                <div>
                  <h2 className="text-sm font-bold text-slate-200 flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-blue-400" /> Voting Sheet & Alignment Analysis</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Analyze member states approval patterns and technical alignment targets</p>
                </div>

                {loadingVote ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Activity className="w-6 h-6 text-blue-400 animate-spin" />
                    <span className="text-xs text-slate-400">Extracting voting sheet layouts...</span>
                  </div>
                ) : activeVote ? (
                  <div className="space-y-5">
                    
                    {/* Voting card stats */}
                    <div className="grid grid-cols-3 gap-4 bg-slate-950 p-4 border border-slate-800 rounded-md">
                      <div className="text-center space-y-1">
                        <span className="text-[10px] font-mono font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> IN FAVOUR</span>
                        <div className="text-xl font-bold font-mono text-white">{activeVote.votingSheet.inFavour}</div>
                        <span className="text-[10px] font-sans text-slate-400">Member States</span>
                      </div>
                      <div className="text-center space-y-1 border-x border-slate-800">
                        <span className="text-[10px] font-mono font-semibold text-red-400 uppercase tracking-wider flex items-center justify-center gap-1"><XCircle className="w-3 h-3" /> AGAINST</span>
                        <div className="text-xl font-bold font-mono text-white">{activeVote.votingSheet.against}</div>
                        <span className="text-[10px] font-sans text-slate-400">Member States</span>
                      </div>
                      <div className="text-center space-y-1">
                        <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" /> ABSTAIN</span>
                        <div className="text-xl font-bold font-mono text-white">{activeVote.votingSheet.abstentions}</div>
                        <span className="text-[10px] font-sans text-slate-400">Member States</span>
                      </div>
                    </div>

                    {/* Member state listing splits */}
                    <div className="space-y-3 bg-slate-950 p-4 rounded-md border border-slate-800">
                      <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Member States Position Breakdown</h3>
                      
                      <div className="space-y-3 divide-y divide-slate-800">
                        <div className="flex justify-between items-start pt-0 text-xs">
                          <span className="text-[10px] font-mono text-red-400 font-semibold shrink-0 w-28 uppercase">Voted Against:</span>
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            {activeVote.votingSheet.countriesAgainst.map((c: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-red-400 font-mono text-[10px]">{c}</span>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-start pt-3 text-xs">
                          <span className="text-[10px] font-mono text-slate-400 font-semibold shrink-0 w-28 uppercase">Abstained:</span>
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            {activeVote.votingSheet.countriesAbstaining.map((c: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[10px]">{c}</span>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 text-xs">
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold shrink-0 w-28 uppercase">In Favour:</span>
                          <span className="text-[10px] font-mono text-slate-400 text-right">Remaining Member States</span>
                        </div>
                      </div>
                    </div>

                    {/* Strategic Enel impact analysis */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-md space-y-1">
                      <h4 className="text-[10px] font-mono font-bold uppercase text-blue-400">Strategic Impact Assessment</h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{activeVote.strategicImpact}</p>
                    </div>

                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs italic">No comitology vote results loaded.</div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
