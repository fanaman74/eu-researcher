"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Users, 
  Sparkles, 
  Activity,
  FileText,
  Globe,
  Download,
  Cpu
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

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Analyze this stakeholder consultation feedback snippet and draft a detailed lobbying impact brief for corporate public affairs team:
              Stakeholder: "${sub.stakeholder}"
              Paper Content: "${sub.snippet}"
              Highlight: 1) Strategic lobby alignment score (0-100%). 2) Immediate policy threat or benefit. 3) Counter-advocacy recommendation.`
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
              EC Consultation Watch
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" /> Have Your Say Consultation Monitor
          </h1>
          <p className="text-xs text-slate-400">Capture Commission proposals feedback, map stakeholder demographics, and parse trade position papers</p>
        </div>

        {/* Selector Header Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Target Consultation PID</span>
            <div className="flex flex-wrap gap-2">
              {consultations.map((item) => (
                <button
                  key={item.pid}
                  onClick={() => setActivePid(item.pid)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                    activePid === item.pid 
                      ? "border-blue-500 bg-blue-500/10 text-blue-400" 
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
          
          {activeConsultation && (
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-md shrink-0 flex items-center gap-4">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 font-mono font-semibold uppercase">Submissions</div>
                <div className="text-base font-bold text-white font-mono">{activeConsultation.totalSubmissions}</div>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="text-center">
                <div className="text-[10px] text-slate-500 font-mono font-semibold uppercase">Closing Date</div>
                <div className="text-xs font-semibold text-blue-400 font-mono">{activeConsultation.closingDate}</div>
              </div>
            </div>
          )}
        </div>

        {/* Division Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Demographics Metrics (5/12 columns) */}
          <div className="lg:col-span-5 space-y-5">
            
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-1.5"><Globe className="w-4 h-4 text-blue-400" /> Stakeholder Demographics</h2>
                <p className="text-xs text-slate-400 mt-0.5">Granular splits mapping country, sector, and sentiment dynamics</p>
              </div>

              {loadingConsultation ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <Activity className="w-6 h-6 text-blue-400 animate-spin" />
                  <span className="text-xs text-slate-400">Extracting demographic parameters...</span>
                </div>
              ) : activeConsultation ? (
                <div className="space-y-4">
                  
                  {/* Country breakdown */}
                  <div className="space-y-2 bg-slate-950 p-4 rounded-md border border-slate-800">
                    <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Country Submissions Breakdown</h3>
                    <div className="space-y-2">
                      {activeConsultation.demographics.countries.map((c: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-300">{c.country}</span>
                            <span className="text-slate-400">{c.submissions} ({c.percentage}%)</span>
                          </div>
                          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sectors breakdown */}
                  <div className="space-y-2 bg-slate-950 p-4 rounded-md border border-slate-800">
                    <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Stakeholder Sectors Breakdown</h3>
                    <div className="space-y-2">
                      {activeConsultation.demographics.sectors.map((s: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-300">{s.name}</span>
                            <span className="text-slate-400">{s.count} ({s.percentage}%)</span>
                          </div>
                          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-500 rounded-full" style={{ width: `${s.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advocacy Sentiments breakdown */}
                  <div className="space-y-2 bg-slate-950 p-4 rounded-md border border-slate-800">
                    <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Lobbying Sentiment Splitting</h3>
                    <div className="space-y-2">
                      {activeConsultation.demographics.sentiments.map((s: any, idx: number) => {
                        const isSupportive = s.label.includes("Supportive");
                        const isHostile = s.label.includes("Hostile");
                        const barColor = isSupportive ? "bg-emerald-500" : isHostile ? "bg-red-500" : "bg-slate-500";
                        const labelColor = isSupportive ? "text-emerald-400" : isHostile ? "text-red-400" : "text-slate-400";
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className={`font-semibold ${labelColor}`}>{s.label}</span>
                              <span className="text-slate-400">{s.count} ({s.percentage}%)</span>
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
                <div className="p-8 text-center text-slate-400 text-xs italic">No metrics loaded.</div>
              )}
            </div>

          </div>

          {/* Submissions Stream & Ingestion Parser (7/12 columns) */}
          <div className="lg:col-span-7 space-y-5">
            
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-5 flex flex-col justify-between min-h-[500px]">

              <div className="space-y-4 flex-1">
                <div>
                  <h2 className="text-sm font-bold text-slate-200">Stakeholder Position Papers</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Review position snippets and parse detailed public affairs briefs</p>
                </div>

                {loadingConsultation ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <Activity className="w-6 h-6 text-blue-400 animate-spin" />
                    <span className="text-xs text-slate-400">Loading consultations feed...</span>
                  </div>
                ) : activeConsultation ? (
                  <div className="space-y-3">
                    
                    {/* Positions Stream List */}
                    <div className="space-y-3">
                      {activeConsultation.submissions.map((sub: any) => {
                        const isSupportive = sub.sentiment === "Supportive";
                        const tagColor = isSupportive ? "bg-slate-900 border-slate-700 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400";
                        const borderStyle = selectedSubId === sub.id ? "border-blue-500/60 bg-slate-900" : "border-slate-800 bg-slate-950/60 hover:border-slate-700";
                        return (
                          <div 
                            key={sub.id}
                            className={`p-4 border rounded-md flex flex-col gap-3 transition-colors ${borderStyle}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-bold text-slate-100">{sub.stakeholder}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${tagColor}`}>
                                  {sub.sentiment}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 font-semibold">{sub.id}</span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed font-sans">{sub.snippet}</p>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-800">
                              <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" /> File: <strong className="text-slate-300">{sub.attachment}</strong></span>
                              <button
                                onClick={() => handleParseSub(sub)}
                                disabled={parsingSub}
                                className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <span>Analyze Paper</span> <Sparkles className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Parser Result Frame */}
                    {(parsingSub || parsedBriefing) && (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-md space-y-2">
                        
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-mono font-bold uppercase text-blue-400">Position Analysis Briefing</h3>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Cpu className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[9px] font-mono font-semibold uppercase">Lobby AI Parser</span>
                          </div>
                        </div>

                        {parsingSub ? (
                          <div className="flex flex-col items-center justify-center gap-2 py-6">
                            <Activity className="w-5 h-5 text-blue-400 animate-spin" />
                            <span className="text-[10px] text-slate-400 font-mono">Parsing attached position paper...</span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                            {parsedBriefing}
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs italic">No submissions loaded. Select consultation PID above.</div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
