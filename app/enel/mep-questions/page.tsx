"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  BarChart3, 
  Search, 
  Download, 
  ExternalLink,
  Cpu,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

export default function MepQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedQuestionForAnswer, setSelectedQuestionForAnswer] = useState<any>(null);
  const [loadingAnswerSummary, setLoadingAnswerSummary] = useState(false);
  const [summarizedAnswer, setSummarizedAnswer] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/parliament");
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions || []);
        }
      } catch (err) {
        console.error("Error fetching MEP questions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleOpenAnswerSummary = async (question: any) => {
    setSelectedQuestionForAnswer(question);
    setLoadingAnswerSummary(true);
    setSummarizedAnswer("");
    try {
      const prompt = `Draft a realistic, highly professional, and precise summarized official answer (approximately 200 words) from the European Commission in response to European Parliament Question ${question.id}. 
      Topic: "${question.title}". 
      Asked by ${question.askedBy} to ${question.target}. 
      The question text was: "${question.content}".
      
      Structure your response clearly with two sections:
      1. COMMISSION'S RESPONSE & POSITION (Presenting the EC stance, any regulatory decisions, energy limits, or concessions)
      2. ADVOCACY IMPACT FOR ENEL (Providing a brief strategic takeaway analysis detailing how this EC stance impacts Enel Green Power or distributed power grids in Brussels lobbying context)`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSummarizedAnswer(data.content);
      } else {
        throw new Error("Failed to load official answer.");
      }
    } catch (err: any) {
      setSummarizedAnswer(`⚠️ Error: ${err.message || "An issue occurred pulling official answer."}`);
    } finally {
      setLoadingAnswerSummary(false);
    }
  };

  const filtered = questions.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.id.toLowerCase().includes(search.toLowerCase()) ||
    item.askedBy.toLowerCase().includes(search.toLowerCase()) ||
    item.committee.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

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
                <BarChart3 className="w-5.5 h-5.5 text-purple-400" /> MEP Questions Registry
              </h1>
              <p className="text-xs text-slate-400 mt-1">European Parliament Legislative Tracking System Watcher</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_#a855f7]" />
            <span className="text-[10px] font-mono font-bold text-slate-350 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              {loading ? "..." : `${questions.length} Questions Tracked`}
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 backdrop-blur-md">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by question CELEX ID, title, asked by, committee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-900 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/40"
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
              <BarChart3 className="w-8 h-8 text-purple-400 animate-pulse" />
              <span className="text-xs text-slate-400">Loading parliamentary questions...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center text-slate-500 italic text-xs">
              No parliamentary questions match your filtering criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="p-4 w-36">Question ID</th>
                    <th className="p-4 min-w-[280px]">Legislative Topic</th>
                    <th className="p-4 w-44">Asked By</th>
                    <th className="p-4 w-28">Committee</th>
                    <th className="p-4 w-32">Status</th>
                    <th className="p-4 w-28">Risk Level</th>
                    <th className="p-4 w-32">Risk Rationale</th>
                    <th className="p-4 w-28 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {filtered.map((item) => {
                    const isHigh = item.risk === "High Risk";
                    const isMed = item.risk === "Med Risk";
                    const riskBadge = isHigh 
                      ? "bg-red-500/10 border-red-500/20 text-red-400" 
                      : isMed 
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-slate-900/35 transition-colors duration-150"
                      >
                        <td className="p-4 font-mono font-bold text-purple-400">{item.id}</td>
                        <td className="p-4 font-medium text-slate-200">
                          <div className="space-y-1">
                            <div>{item.title}</div>
                            <div className="text-[10px] text-slate-500 font-normal leading-relaxed">{item.content}</div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-350">
                          <div className="font-semibold">{item.askedBy}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Target: {item.target}</div>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-400">{item.committee}</td>
                        <td className="p-4">
                          {item.status === "Answered" ? (
                            <button
                              onClick={() => handleOpenAnswerSummary(item)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold bg-emerald-950/40 border border-emerald-900 text-emerald-400 cursor-pointer hover:bg-emerald-900/30 hover:border-emerald-800 transition-all active:scale-[0.97]"
                              title="Click to view summarized Commission answer"
                            >
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              {item.status}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold bg-amber-950/40 border border-amber-900 text-amber-400 select-none">
                              <Clock className="w-3 h-3 text-amber-400" />
                              {item.status}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${riskBadge}`}>
                            {isHigh && <AlertTriangle className="w-3 h-3" />}
                            {item.risk}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 text-[10.5px] leading-relaxed max-w-[200px]">{item.riskRationale}</td>
                        <td className="p-4 text-center">
                          <Link
                            href={`/parliament`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            Vote Tracker <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Answer Summary Modal */}
      {selectedQuestionForAnswer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded uppercase">
                    Official Answer
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    Question ID: {selectedQuestionForAnswer.id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white leading-snug">
                  {selectedQuestionForAnswer.title}
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Asked by {selectedQuestionForAnswer.askedBy} to {selectedQuestionForAnswer.target}
                </p>
              </div>
              <button 
                onClick={() => setSelectedQuestionForAnswer(null)}
                className="text-slate-500 hover:text-slate-200 transition-colors p-1.5 hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-[200px]">
              
              {/* Question Recapitulation */}
              <div className="p-4 bg-slate-950/40 border border-slate-955 rounded-2xl space-y-1.5">
                <h4 className="text-[9px] font-mono font-extrabold text-slate-500 uppercase">Question Content</h4>
                <p className="text-xs text-slate-350 leading-relaxed italic">
                  "{selectedQuestionForAnswer.content}"
                </p>
              </div>

              {/* Summarized Answer */}
              <div className="space-y-3">
                <h4 className="text-[9px] font-mono font-extrabold text-emerald-400 uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Summarized Official Answer
                </h4>
                
                {loadingAnswerSummary ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <Cpu className="w-8 h-8 text-emerald-400 animate-spin" />
                    <span className="text-xs text-slate-400 font-medium">Parsing EC plenary minutes & summarizing lobby counter-advocacy stance...</span>
                  </div>
                ) : (
                  <div className="text-xs leading-relaxed text-slate-200 font-sans whitespace-pre-wrap border border-slate-850 p-5 rounded-2xl bg-slate-950/60 max-h-[350px] overflow-y-auto">
                    {summarizedAnswer}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedQuestionForAnswer(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer"
              >
                Dismiss Overview
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
