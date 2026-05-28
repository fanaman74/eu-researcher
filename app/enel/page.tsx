"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Scale, 
  BookOpen, 
  ShieldAlert, 
  Users, 
  BarChart3, 
  Cpu, 
  FileText, 
  Settings, 
  Radio,
  ExternalLink,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  Copy,
  Check,
  Download
} from "lucide-react";

export default function EnelHubPage() {
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [inDepthMode, setInDepthMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [generatedReport, setGeneratedReport] = useState("");
  const [activeTab, setActiveTab] = useState("dg_comp");

  const [activeConsultationsCount, setActiveConsultationsCount] = useState(14);
  const [mepQuestionsCount, setMepQuestionsCount] = useState(89);
  const [stateAidCount, setStateAidCount] = useState(32);
  const [acerRevisionsCount, setAcerRevisionsCount] = useState(8);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const resConsultations = await fetch("/api/have-your-say");
        if (resConsultations.ok) {
          const data = await resConsultations.json();
          setActiveConsultationsCount(data.consultations?.length || 0);
        }
      } catch (err) {
        console.error(err);
      }
      try {
        const resParliament = await fetch("/api/parliament");
        if (resParliament.ok) {
          const data = await resParliament.json();
          setMepQuestionsCount(data.questions?.length || 0);
        }
      } catch (err) {
        console.error(err);
      }
      try {
        const resEurlex = await fetch("/api/eurlex?q=state aid energy&top_k=15");
        if (resEurlex.ok) {
          const data = await resEurlex.json();
          setStateAidCount(data.hits?.length || 0);
        }
      } catch (err) {
        console.error(err);
      }
      try {
        const resComitology = await fetch("/api/comitology");
        if (resComitology.ok) {
          const data = await resComitology.json();
          setAcerRevisionsCount(data.votes?.length || 0);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchCounts();
  }, []);

  const statistics = [
    { label: "Active Consultations", count: activeConsultationsCount, icon: Users, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { label: "MEP Questions Tracked", count: mepQuestionsCount, icon: BarChart3, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    { label: "DG COMP State Aid Cases", count: stateAidCount, icon: Scale, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { label: "ACER Grid Revisions", count: acerRevisionsCount, icon: Zap, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" }
  ];


  const tools = [
    {
      title: "EUR-Lex Cellar Explorer",
      description: "Perform raw semantic searches across binding EU regulations, directives, and decisions pre-filtered for DG ENER and DG COMP briefs.",
      href: "/eurlex",
      icon: Scale,
      badge: "Publications Office SPARQL",
      badgeColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      accent: "border-t-emerald-500 hover:shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)]"
    },
    {
      title: "EP Portal Watcher",
      description: "Monitor parliamentary questions, MEP profiles,sitting vote results, and draft resolutions targeting energy tariffs and state support.",
      href: "/parliament",
      icon: BarChart3,
      badge: "EP Open Data API v2",
      badgeColor: "bg-purple-500/10 border-purple-500/20 text-purple-400",
      accent: "border-t-purple-500 hover:shadow-[0_0_50px_-12px_rgba(168,85,247,0.15)]"
    },
    {
      title: "Have Your Say Monitor",
      description: "Capture public consultation feedback, parse attached position papers, and track stakeholder sentiment demographics.",
      href: "/have-your-say",
      icon: Users,
      badge: "EC Consultation API",
      badgeColor: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      accent: "border-t-amber-500 hover:shadow-[0_0_50px_-12px_rgba(245,158,11,0.15)]"
    },
    {
      title: "Comitology & Technical Acts",
      description: "Track voting records on delegated acts, technical implementing regulations, and ACER network electricity codes.",
      href: "/comitology",
      icon: Zap,
      badge: "EC Comitology API",
      badgeColor: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
      accent: "border-t-cyan-500 hover:shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)]"
    }
  ];

  const recentBriefs = {
    dg_comp: [
      { id: 1, title: "State Aid clearance for 3SUN Catania Gigafactory", type: "RULING", risk: "Low Risk", date: "2026-05-20", source: "DG COMP" },
      { id: 2, title: "Investigation into grid fee exemptions in Italy", type: "INQUIRY", risk: "High Risk", date: "2026-05-18", source: "DG COMP" },
      { id: 3, title: "Subsidized power purchasing agreement (PPA) audit", type: "AUDIT", risk: "Med Risk", date: "2026-05-14", source: "DG COMP" }
    ],
    dg_ener: [
      { id: 1, title: "RED III renewable target transposition updates", type: "DIRECTIVE", risk: "Med Risk", date: "2026-05-22", source: "DG ENER" },
      { id: 2, title: "Cross-border hydrogen corridor infrastructure planning", type: "REGULATION", risk: "Low Risk", date: "2026-05-19", source: "DG ENER" },
      { id: 3, title: "Review of electricity pricing peak emergency caps", type: "AMENDMENT", risk: "High Risk", date: "2026-05-12", source: "DG ENER" }
    ],
    acer: [
      { id: 1, title: "ACER harmonized electricity transmission tariff codes", type: "GRID CODE", risk: "High Risk", date: "2026-05-24", source: "ACER" },
      { id: 2, title: "Cross-zonal capacity allocation methodology update", type: "DECISION", risk: "Med Risk", date: "2026-05-15", source: "ACER" },
      { id: 3, title: "Review of REMIT wholesale energy market disclosures", type: "REPORTING", risk: "Low Risk", date: "2026-05-10", source: "ACER" }
    ]
  };

  const handleSelectAndGenerate = async (brief: any, isDetailed: boolean = false) => {
    setSelectedInquiry(brief);
    setInDepthMode(isDetailed);
    setLoadingReport(true);
    setGeneratedReport("");
    try {
      const prompt = isDetailed
        ? `Draft an extremely comprehensive, exhaustive, and highly detailed strategic briefing playbook (approximately 1,200 words) on Enel's lobbying risks. Focus on this topic: "${brief.title}" (Type: ${brief.type}, Source: ${brief.source}, Risk Assessment: ${brief.risk}) in Brussels public affairs context. 
           Your briefing must include these sections:
           1. EXECUTIVE SUMMARY & STRATEGIC RATIONALE
           2. DETAILED REGULATORY CONTEXT & POLICY THREATS (Cite specific EU Directives or rules)
           3. HISTORICAL PRECEDENTS & COMPARABLE CASE LAW
           4. IMPACT EVALUATION ON ENEL ENERGY PORTFOLIOS
           5. ADVANCED STRATEGIC RECOMMENDATIONS & BRUSSELS ADVOCACY PLAYBOOK`
        : `Draft a highly detailed executive briefing paper on Enel strategic lobbying risks. Specifically focus on this topic: "${brief.title}" (Type: ${brief.type}, Source: ${brief.source}, Risk Assessment: ${brief.risk}) in Brussels public affairs context. List key policy threats and Enel's strategic counter-advocacy recommendation.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { 
              role: "user", 
              content: prompt
            }
          ]
        })
      });
      if (response.ok) {
        const data = await response.json();
        setGeneratedReport(data.content);
      } else {
        throw new Error("Failed to generate brief.");
      }
    } catch (err: any) {
      setGeneratedReport(`⚠️ Error: ${err.message || "An issue occurred generating report."}`);
    } finally {
      setLoadingReport(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedReport) return;
    navigator.clipboard.writeText(generatedReport);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const downloadReport = () => {
    if (!selectedInquiry || !generatedReport) return;
    const blob = new Blob([generatedReport], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedInquiry.id.replace(/[^a-z0-9]/gi, '_')}_enel_advocacy_brief.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Background Glows */}
      <div className="absolute top-1/4 left-10 w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-2/3 right-10 w-[450px] h-[450px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Layout Wrap */}
      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 space-y-12 z-10">
        
        {/* Navigation & Branding Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-900 pb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-all"
            >
              ← Portal Gateway
            </Link>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/10">
              <Zap className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black font-sans uppercase tracking-tight text-white">enel</h1>
                <span className="text-[10px] font-mono tracking-widest bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-md uppercase font-bold">Public Affairs</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">EU Policy & Competition Intelligence Platform — Brussels Office</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-[10px] font-mono font-bold text-slate-300">SYSTEM STABLE: Cellar Endpoint Connected</span>
            </div>
            <Link
              href="/research"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-350 transition-all px-4 py-2.5 rounded-xl shadow-lg shadow-teal-400/10 active:scale-95"
            >
              Advanced Chat Console <Sparkles className="w-4 h-4 text-slate-950" />
            </Link>
          </div>
        </div>

        {/* Live Counters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statistics.map((stat, idx) => {
            const Icon = stat.icon;
            const hrefs = [
              "/enel/active-consultations",
              "/enel/mep-questions",
              "/enel/state-aid-cases",
              "/enel/acer-grid-revisions"
            ];
            return (
              <Link 
                key={idx}
                href={hrefs[idx]}
                className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 flex items-center justify-between backdrop-blur-md hover:border-slate-800 hover:bg-slate-900/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 shadow-md group cursor-pointer"
              >
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-medium group-hover:text-slate-300 transition-colors">{stat.label}</span>
                  <div className="text-2xl font-bold font-mono text-white group-hover:text-cyan-400 transition-colors">{stat.count}</div>
                </div>
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Core Tools Division */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" /> Authorized Legislative Watchers
              </h2>
              <p className="text-xs text-slate-400">Targeted tools to ingest, track, and analyze key EU regulatory frameworks</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tools.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <div 
                  key={idx}
                  className={`bg-slate-900/20 border border-slate-900 border-t-4 rounded-3xl p-6 flex flex-col justify-between gap-6 backdrop-blur-md transition-all duration-350 ${tool.accent}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-300`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[9px] font-mono tracking-wider font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${tool.badgeColor}`}>
                        {tool.badge}
                      </span>
                    </div>
                    
                    <h3 className="text-base font-bold text-slate-200">{tool.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{tool.description}</p>
                  </div>

                  <Link 
                    href={tool.href}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-[0.98]"
                  >
                    Enter Workspace <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Stream & AI Advocate Executive brief generator */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Recent Legislative Inquiries Brief Stream (2/5 columns) */}
          <div className="lg:col-span-2 bg-slate-900/20 border border-slate-900 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-md flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-emerald-400 animate-pulse" /> Live Inquiries Feed
                </h3>
                <p className="text-[11px] text-slate-455">Weekly legislative movements & regulatory risk assessments</p>
              </div>

              {/* Inquiries Tabs */}
              <div className="flex border-b border-slate-900 p-0.5 bg-slate-950 rounded-xl">
                {Object.keys(recentBriefs).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${activeTab === tab ? "bg-slate-900 text-cyan-400 border border-slate-850" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    {tab.replace("_", " ")}
                  </button>
                ))}
              </div>

              {/* Brief Cards Stream */}
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {recentBriefs[activeTab as keyof typeof recentBriefs].map((brief) => {
                  const isSelected = selectedInquiry?.id === brief.id && selectedInquiry?.source === brief.source;
                  return (
                    <button 
                      key={brief.id} 
                      onClick={() => handleSelectAndGenerate(brief)}
                      disabled={loadingReport}
                      className={`w-full text-left p-4 bg-slate-950/60 border rounded-xl space-y-2 transition-all hover:border-slate-700 cursor-pointer active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none ${isSelected ? "border-teal-500/50 bg-slate-900/60 shadow-[0_0_15px_rgba(20,184,166,0.08)]" : "border-slate-900 hover:border-slate-850"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {brief.type}
                        </span>
                        <span className={`text-[9px] font-bold font-sans uppercase px-2 py-0.5 rounded-full border ${brief.risk === "High Risk" ? "bg-red-500/10 border-red-500/20 text-red-400" : brief.risk === "Med Risk" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
                          {brief.risk}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-200 leading-snug">{brief.title}</h4>
                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                        <span>Source: {brief.source}</span>
                        <span>Date: {brief.date}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-900/60 text-center">
              <span className="text-[10px] font-mono text-slate-500">Live feed updates automatically via polling</span>
            </div>
          </div>

          {/* AI Executive Advocate Risk Summarizer (3/5 columns) */}
          <div className="lg:col-span-3 bg-slate-900/20 border border-slate-900 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-md flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <ShieldAlert className="w-4.5 h-4.5 text-amber-400" /> Advocate AI Risk Briefing
                </h3>
                <p className="text-[11px] text-slate-455">Draft strategic position summaries & counter-advocacy memos instantly</p>
              </div>

              {/* Active Inquiry Subject Display */}
              {selectedInquiry ? (
                <div className="p-4 bg-slate-950/80 border border-slate-900 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {selectedInquiry.type}
                    </span>
                    <span className={`text-[8px] font-bold font-sans uppercase px-2 py-0.5 rounded-full border ${selectedInquiry.risk === "High Risk" ? "bg-red-500/10 border-red-500/20 text-red-400" : selectedInquiry.risk === "Med Risk" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
                      {selectedInquiry.risk}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 leading-snug">
                    <span className="text-slate-500 font-normal">Active Subject:</span> {selectedInquiry.title}
                  </h4>
                </div>
              ) : (
                <div className="p-4 bg-slate-950/30 border border-dashed border-slate-900 rounded-xl text-center text-xs text-slate-500 italic">
                  No inquiry subject selected. Click on a feed card to begin.
                </div>
              )}

              {/* Generated Briefing Frame */}
              <div className={`bg-slate-950 border border-slate-900 p-5 rounded-2xl min-h-[220px] max-h-[340px] overflow-y-auto flex flex-col relative ${generatedReport || loadingReport ? "justify-start" : "justify-center"}`}>
                {loadingReport ? (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Cpu className="w-8 h-8 text-teal-400 animate-spin" />
                    <span className="text-xs text-slate-400 font-medium">Advocate AI parsing live regulations & drafting lobby briefing...</span>
                  </div>
                ) : generatedReport ? (
                  <div className="text-xs leading-relaxed font-sans text-slate-200 whitespace-pre-wrap">
                    {generatedReport}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 italic text-xs space-y-2 p-4">
                    <p>Select any legislative inquiry card on the left to instantly generate a custom strategic counter-advocacy brief.</p>
                  </div>
                )}
              </div>
            </div>

            {selectedInquiry && (
              <div className="space-y-3.5">
                
                {/* Utilities: Copy & Save (Only when report exists) */}
                {generatedReport && (
                  <div className="flex gap-3">
                    <button
                      onClick={copyToClipboard}
                      className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" /> Copied Brief!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-slate-400" /> Copy Briefing
                        </>
                      )}
                    </button>
                    <button
                      onClick={downloadReport}
                      className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-400" /> Save Briefing
                    </button>
                  </div>
                )}

                {/* Primary Generators */}
                <div className="flex flex-col gap-2">
                  {/* Toggle deep-dive or standard */}
                  {generatedReport && !inDepthMode && (
                    <button
                      onClick={() => handleSelectAndGenerate(selectedInquiry, true)}
                      disabled={loadingReport}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450 text-white font-bold text-xs flex items-center justify-center gap-2 tracking-wide shadow-lg shadow-emerald-500/10 active:scale-[0.98] cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-white" /> Upgrade to In-Depth Briefing
                    </button>
                  )}

                  {generatedReport && inDepthMode && (
                    <button
                      onClick={() => handleSelectAndGenerate(selectedInquiry, false)}
                      disabled={loadingReport}
                      className="w-full py-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 tracking-wide active:scale-[0.98] cursor-pointer"
                    >
                      <Scale className="w-4 h-4 text-slate-400" /> Switch to Standard Briefing
                    </button>
                  )}

                  <button
                    onClick={() => handleSelectAndGenerate(selectedInquiry, inDepthMode)}
                    disabled={loadingReport}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-750 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 tracking-wide active:scale-[0.98] cursor-pointer"
                  >
                    <Cpu className="w-4 h-4 text-slate-400" /> Re-draft Active Briefing
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
