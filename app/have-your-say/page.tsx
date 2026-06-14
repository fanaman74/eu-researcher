"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Users, 
  Search, 
  Sparkles, 
  Activity,
  ShieldAlert,
  ChevronRight,
  Download,
  ExternalLink,
  Cpu,
  FileText,
  PieChart,
  Globe,
  Settings,
  HelpCircle,
  MessageSquare
} from "lucide-react";

export default function HaveYourSayPage() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [activePid, setActivePid] = useState("PID-2026-EMD");
  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  const [loadingConsultation, setLoadingConsultation] = useState(false);
  
  // PDF parsing simulation states
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [parsingSub, setParsingSub] = useState(false);
  const [parsedBriefing, setParsedBriefing] = useState<string | null>(null);

  const fetchConsultations = async () => {
    try {
      const res = await fetch("/api/have-your-say");
      if (res.ok) {
        const data = await res.json();
        setConsultations(data.consultations || []);
      }
    } catch (err) {
      console.error("Failed to fetch consultations:", err);
    }
  };

  const fetchActiveConsultation = async (pid: string) => {
    setLoadingConsultation(true);
    setParsedBriefing(null);
    setSelectedSubId(null);
    try {
      const res = await fetch(`/api/have-your-say?pid=${pid}`);
      if (res.ok) {
        const data = await res.json();
        setActiveConsultation(data.consultation);
      }
    } catch (err) {
      console.error("Failed to fetch active consultation:", err);
    } finally {
      setLoadingConsultation(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  useEffect(() => {
    fetchActiveConsultation(activePid);
  }, [activePid]);

  const handleParseSub = async (sub: any) => {
    setSelectedSubId(sub.id);
    setParsingSub(true);
    setParsedBriefing(null);

    // Call LLM router to parse public position feedback
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Analyze this stakeholder consultation feedback snippet and draft a highly detailed lobbying impact brief for Enel Brussels public affairs office:
              Stakeholder: "${sub.stakeholder}"
              Paper Content: "${sub.snippet}"
              Highlight: 1) Strategic lobby alignment score with Enel targets (0-100%). 2) Immediate policy threat or benefit to Enel. 3) Counter-advocacy recommendation for Enel's Brussels team.`
            }
          ]
        })
      });
      if (res.ok) {
        const data = await res.json();
        setParsedBriefing(data.content);
      } else {
        throw new Error("Failed to parse paper.");
      }
    } catch (err: any) {
      setParsedBriefing(`⚠️ Error: ${err.message || "Failed to parse stakeholder position."}`);
    } finally {
      setParsingSub(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Background Sphere */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

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
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_#f59e0b]" />
            <span className="text-xs font-bold font-mono text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              EC Consultation Watcher
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" /> Have Your Say Public Consultation Monitor
          </h2>
          <p className="text-xs text-slate-400">Capture early-stage European Commission proposals feedback, map stakeholder sentiment, and parse trade associations position papers</p>
        </div>

        {/* Selector Header Bar */}
        <div className="bg-slate-900/20 border border-slate-900 border-t-4 border-t-amber-500 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-mono tracking-widest font-extrabold uppercase text-amber-400">[Target Consultation PID]</span>
            <div className="flex flex-wrap gap-3 mt-1.5">
              {consultations.map((item) => (
                <button
                  key={item.pid}
                  onClick={() => setActivePid(item.pid)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border backdrop-blur-sm transition-all duration-350 cursor-pointer active:scale-95 ${activePid === item.pid ? "border-amber-500 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"}`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
          
          {activeConsultation && (
            <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl shrink-0 flex items-center gap-4">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 font-mono font-bold uppercase">Submissions</div>
                <div className="text-lg font-bold text-white font-mono">{activeConsultation.totalSubmissions}</div>
              </div>
              <div className="w-px h-8 bg-slate-900" />
              <div className="text-center">
                <div className="text-[10px] text-slate-500 font-mono font-bold uppercase">Closing Date</div>
                <div className="text-xs font-bold text-amber-400 font-mono">{activeConsultation.closingDate}</div>
              </div>
            </div>
          )}
        </div>

        {/* Division Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Demographics Metrics (5/12 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md pointer-events-none">
                [Demographic Charts]
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-200 flex items-center gap-1.5"><Globe className="w-4.5 h-4.5 text-amber-400" /> Stakeholder Sentiment Metrics</h3>
                  <p className="text-[11px] text-slate-455">Granular splits mapping country, sector, and sentiment dynamics</p>
                </div>

                {loadingConsultation ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Activity className="w-8 h-8 text-amber-400 animate-spin" />
                    <span className="text-xs text-slate-400 font-medium">Extracting demographic parameters...</span>
                  </div>
                ) : activeConsultation ? (
                  <div className="space-y-6">
                    
                    {/* Country breakdown */}
                    <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-900">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Country Submissions Split</h4>
                      <div className="space-y-2.5">
                        {activeConsultation.demographics.countries.map((c: any, idx: number) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-slate-350">{c.country}</span>
                              <span className="text-slate-455 font-bold">{c.submissions} ({c.percentage}%)</span>
                            </div>
                            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${c.percentage}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sectors breakdown */}
                    <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-900">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Stakeholder Sectors Split</h4>
                      <div className="space-y-2.5">
                        {activeConsultation.demographics.sectors.map((s: any, idx: number) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-slate-350">{s.name}</span>
                              <span className="text-slate-455 font-bold">{s.count} ({s.percentage}%)</span>
                            </div>
                            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${s.percentage}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Advocacy Sentiments breakdown */}
                    <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-900">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Lobbying Sentiment Splitting</h4>
                      <div className="space-y-2.5">
                        {activeConsultation.demographics.sentiments.map((s: any, idx: number) => {
                          const isSupportive = s.label.includes("Supportive");
                          const isHostile = s.label.includes("Hostile");
                          const barColor = isSupportive ? "bg-emerald-500" : isHostile ? "bg-red-500" : "bg-slate-500";
                          const labelColor = isSupportive ? "text-emerald-400" : isHostile ? "text-red-400" : "text-slate-400";
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className={`font-bold ${labelColor}`}>{s.label}</span>
                                <span className="text-slate-455 font-bold">{s.count} ({s.percentage}%)</span>
                              </div>
                              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${s.percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 italic text-xs">No metrics loaded.</div>
                )}
              </div>

            </div>

          </div>

          {/* Submissions Stream & Ingestion Parser (7/12 columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[500px]">
              <div className="absolute top-4 right-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md pointer-events-none">
                [Lobby Ingestion Parser]
              </div>

              <div className="space-y-5 flex-1">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Stakeholder Position Ingestion Parser</h3>
                  <p className="text-[11px] text-slate-455">Download attached stakeholder position PDFs, ingest content, and parse lobbying brief</p>
                </div>

                {loadingConsultation ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Activity className="w-8 h-8 text-amber-400 animate-spin" />
                    <span className="text-xs text-slate-400 font-medium">Loading consultations feed...</span>
                  </div>
                ) : activeConsultation ? (
                  <div className="space-y-4">
                    
                    {/* Positions Stream List */}
                    <div className="space-y-3">
                      {activeConsultation.submissions.map((sub: any) => {
                        const isSupportive = sub.sentiment === "Supportive";
                        const tagColor = isSupportive ? "bg-emerald-950/40 border-emerald-900 text-emerald-400" : "bg-red-950/40 border-red-900 text-red-400";
                        const borderAccent = selectedSubId === sub.id ? "border-amber-500/50 bg-amber-500/[0.01]" : "border-slate-900 bg-slate-950/40";
                        return (
                          <div 
                            key={sub.id}
                            className={`p-4 border rounded-xl flex flex-col gap-3 transition-all ${borderAccent}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-bold text-slate-200">{sub.stakeholder}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${tagColor}`}>
                                  {sub.sentiment}
                                </span>
                                <span className="text-[9px] font-mono text-slate-500 font-bold">{sub.id}</span>
                              </div>
                            </div>

                            <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">{sub.snippet}</p>

                            <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-2 border-t border-slate-900/50">
                              <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Attachment: <strong className="text-slate-400">{sub.attachment}</strong></span>
                              <button
                                onClick={() => handleParseSub(sub)}
                                disabled={parsingSub}
                                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-450 disabled:opacity-50 text-slate-950 text-[10px] font-extrabold flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-md shadow-amber-500/5"
                              >
                                Analyze Position Paper <Sparkles className="w-3 h-3 text-slate-950" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Parser Result Frame */}
                    {(parsingSub || parsedBriefing) && (
                      <div className="p-4 bg-slate-950 border border-slate-900 border-t-2 border-t-amber-500 rounded-xl space-y-3 relative overflow-hidden animate-fade-in shadow-xl">
                        
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-slate-600">
                          <Cpu className="w-4 h-4 text-amber-500 animate-pulse" />
                          <span className="text-[8px] font-mono font-bold tracking-widest uppercase">Lobby AI Parser</span>
                        </div>
                        
                        <h4 className="text-[10px] font-mono font-extrabold uppercase text-amber-400">Position Analysis Briefing</h4>

                        {parsingSub ? (
                          <div className="flex flex-col items-center justify-center gap-2.5 py-6">
                            <Activity className="w-6 h-6 text-amber-400 animate-spin" />
                            <span className="text-[10px] text-slate-400 font-medium font-mono">Parsing attached PDF & aligning advocate benchmarks...</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                            {parsedBriefing}
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 italic text-xs">No submissions loaded. Select consultation PID above.</div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
