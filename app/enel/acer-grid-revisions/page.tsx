"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Zap, 
  Search, 
  ExternalLink,
  Cpu,
  TrendingUp,
  FileText
} from "lucide-react";

export default function AcerGridRevisionsPage() {
  const [votes, setVotes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/comitology");
        if (res.ok) {
          const data = await res.json();
          setVotes(data.votes || []);
        }
      } catch (err) {
        console.error("Error fetching ACER revisions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = votes.filter(item => 
    item.measure.toLowerCase().includes(search.toLowerCase()) ||
    item.id.toLowerCase().includes(search.toLowerCase()) ||
    item.registerId.toLowerCase().includes(search.toLowerCase()) ||
    item.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 space-y-8 z-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/enel"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Enel Hub
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Zap className="w-5.5 h-5.5 text-cyan-400" /> ACER Grid Revisions Watcher
              </h1>
              <p className="text-xs text-slate-400 mt-1">European Comitology Register Watcher — Pre-filtered for smart grid codes & delegated revisions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#06b6d4]" />
            <span className="text-[10px] font-mono font-bold text-slate-350 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              {loading ? "..." : `${votes.length} Revisions Tracked`}
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 backdrop-blur-md">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter grid codes by ID, measure title, register ID, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-900 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/40"
            />
          </div>

        </div>

        {/* Tabular View */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden backdrop-blur-md">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3">
              <Zap className="w-8 h-8 text-cyan-400 animate-pulse" />
              <span className="text-xs text-slate-400">Fetching technical comitology votes...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center text-slate-500 italic text-xs">
              No grid revisions match your filtering criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="p-4 w-36">Vote ID</th>
                    <th className="p-4 min-w-[280px]">Technical Grid Measure</th>
                    <th className="p-4 w-40">Register ID</th>
                    <th className="p-4 w-32">Sitting Date</th>
                    <th className="p-4 w-36">Chairperson</th>
                    <th className="p-4 w-44">Vote Split</th>
                    <th className="p-4 w-32">Status</th>
                    <th className="p-4 w-28 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {filtered.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-900/35 transition-colors duration-150"
                    >
                      <td className="p-4 font-mono font-bold text-cyan-400">{item.id}</td>
                      <td className="p-4 font-medium text-slate-200">
                        <div className="space-y-1">
                          <div>{item.measure}</div>
                          <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl space-y-1 relative overflow-hidden mt-1.5 max-w-[400px]">
                            <div className="absolute top-1.5 right-2 flex items-center gap-1 text-slate-600">
                              <Cpu className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
                              <span className="text-[8px] font-mono font-bold tracking-widest uppercase">Advocate AI</span>
                            </div>
                            <h5 className="text-[9px] font-mono font-extrabold text-cyan-400 uppercase">Strategic Lobby Impact</h5>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">{item.strategicImpact}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-350">{item.registerId}</td>
                      <td className="p-4 font-mono text-slate-400">{item.date}</td>
                      <td className="p-4 text-slate-400">{item.chairperson}</td>
                      <td className="p-4 text-slate-350">
                        <div className="space-y-1 font-mono font-bold text-[10px]">
                          <div className="flex justify-between w-32">
                            <span className="text-emerald-400">IN FAVOUR:</span>
                            <span>{item.votingSheet.inFavour}</span>
                          </div>
                          <div className="flex justify-between w-32">
                            <span className="text-red-400">AGAINST:</span>
                            <span>{item.votingSheet.against}</span>
                          </div>
                          <div className="text-[9px] text-slate-500 font-normal">
                            Abstentions: {item.votingSheet.abstentions}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400">
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <Link
                          href={`/comitology?id=${item.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          Comitology <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
