"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Scale, 
  Search, 
  Download, 
  ExternalLink,
  TrendingUp,
  FileText
} from "lucide-react";

export default function StateAidCasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Query EUR-Lex API for energy state aid cases
        const res = await fetch("/api/eurlex?q=state aid energy&top_k=15");
        if (res.ok) {
          const data = await res.json();
          setCases(data.hits || []);
        }
      } catch (err) {
        console.error("Error fetching State Aid cases:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = cases.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.id.toLowerCase().includes(search.toLowerCase()) ||
    item.sector.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

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
                <Scale className="w-5.5 h-5.5 text-emerald-400" /> DG COMP State Aid Watcher
              </h1>
              <p className="text-xs text-slate-400 mt-1">EUR-Lex SPARQL Cellar Database Crawler — Pre-filtered for State Support Decisions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-[10px] font-mono font-bold text-slate-350 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              32 Cases Tracked
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 backdrop-blur-md">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter cases by CELEX ID, ruling title, or legal sector..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-900 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/40"
            />
          </div>
          <button className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer">
            <Download className="w-4 h-4" /> Export Registry
          </button>
        </div>

        {/* Tabular View */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden backdrop-blur-md">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3">
              <Scale className="w-8 h-8 text-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400">Querying publications office SPARQL endpoint...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center text-slate-500 italic text-xs">
              No state aid cases match your filtering criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="p-4 w-36">CELEX ID</th>
                    <th className="p-4 min-w-[280px]">Legal Ruling / Decision</th>
                    <th className="p-4 w-32">Relevance Score</th>
                    <th className="p-4 w-40">Sector</th>
                    <th className="p-4 w-28">Scope</th>
                    <th className="p-4 w-32 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {filtered.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-900/35 transition-colors duration-150"
                    >
                      <td className="p-4 font-mono font-bold text-emerald-400">{item.id}</td>
                      <td className="p-4 font-medium text-slate-200">
                        <div className="space-y-1">
                          <div>{item.title}</div>
                          <div className="text-[10px] text-slate-500 font-mono leading-relaxed">{item.snippet}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-md">
                          <TrendingUp className="w-3.5 h-3.5" /> {(item.score * 100).toFixed(0)}% Match
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 font-medium">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px]">
                          <FileText className="w-3.5 h-3.5 text-slate-500" /> {item.sector}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-550 font-bold uppercase">{item.country}</td>
                      <td className="p-4 text-center">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          EUR-Lex Record <ExternalLink className="w-3 h-3" />
                        </a>
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
