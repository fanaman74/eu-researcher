"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Scale,
  Users,
  BarChart3,
  Cpu,
  Sparkles,
  ArrowRight,
  Zap,
  Activity,
  Layers,
  Copy,
  Check,
  Download
} from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { type EnelBrief, type Consultation, type ParliamentQuestion, type EurLexHit } from "@/lib/types";

type FeedTab = "questions" | "consultations" | "state_aid";
const FEED_TABS: { key: FeedTab; label: string }[] = [
  { key: "questions", label: "MEP questions" },
  { key: "consultations", label: "Consultations" },
  { key: "state_aid", label: "State aid" },
];

export default function EnelHubPage() {
  const briefingRef = useRef<HTMLDivElement>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<EnelBrief | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [inDepthMode, setInDepthMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [generatedReport, setGeneratedReport] = useState("");
  const [originalReport, setOriginalReport] = useState("");
  const [activeTab, setActiveTab] = useState<FeedTab>("questions");

  const [activeConsultationsCount, setActiveConsultationsCount] = useState<number | null>(null);
  const [mepQuestionsCount, setMepQuestionsCount] = useState<number | null>(null);
  const [stateAidCount, setStateAidCount] = useState<number | null>(null);
  const [feed, setFeed] = useState<Record<FeedTab, EnelBrief[]>>({ questions: [], consultations: [], state_aid: [] });
  const [countsError, setCountsError] = useState(false);

  const fetchCounts = async () => {
    let failed = false;
    setCountsError(false);
    try {
      const resConsultations = await fetch("/api/have-your-say");
      if (resConsultations.ok) {
        const data = await resConsultations.json();
        setActiveConsultationsCount(data.consultations?.length || 0);
        setFeed((f) => ({ ...f, consultations: (data.consultations || []).slice(0, 5).map((c: Consultation) => ({
          id: `hys-${c.pid}`, title: c.title, type: c.status.startsWith("Open") ? "OPEN CONSULTATION" : "CLOSED CONSULTATION",
          date: c.closingDate ?? "", source: "Have Your Say", url: c.url })) }));
      } else {
        setActiveConsultationsCount(0);
        failed = true;
      }
    } catch (err) {
      console.error(err);
      setActiveConsultationsCount(0);
      failed = true;
    }
    try {
      const resParliament = await fetch("/api/parliament");
      if (resParliament.ok) {
        const data = await resParliament.json();
        setMepQuestionsCount(data.questions?.length || 0);
        setFeed((f) => ({ ...f, questions: (data.questions || []).slice(0, 5).map((q: ParliamentQuestion) => ({
          id: q.id, title: q.title, type: q.status.toUpperCase(), date: q.date, source: `EP question · ${q.askedBy}`, url: q.url })) }));
      } else {
        setMepQuestionsCount(0);
        failed = true;
      }
    } catch (err) {
      console.error(err);
      setMepQuestionsCount(0);
      failed = true;
    }
    try {
      const resEurlex = await fetch("/api/eurlex?q=state aid energy&top_k=15");
      if (resEurlex.ok) {
        const data = await resEurlex.json();
        setStateAidCount(data.hits?.length || 0);
        setFeed((f) => ({ ...f, state_aid: (data.hits || []).slice(0, 5).map((h: EurLexHit) => ({
          id: h.id, title: h.title, type: h.sector.toUpperCase(), date: (/Document Date: (\d{4}-\d{2}-\d{2})/.exec(h.snippet)?.[1]) ?? "", source: "EUR-Lex", url: h.url })) }));
      } else {
        setStateAidCount(0);
        failed = true;
      }
    } catch (err) {
      console.error(err);
      setStateAidCount(0);
      failed = true;
    }
    if (failed) setCountsError(true);
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const statistics = [
    { label: "Active Consultations", count: activeConsultationsCount, icon: Users, href: "/have-your-say" },
    { label: "MEP Questions Tracked", count: mepQuestionsCount, icon: BarChart3, href: "/parliament" },
    { label: "State Aid Cases (EUR-Lex)", count: stateAidCount, icon: Scale, href: "/enel/state-aid-cases" }
  ];

  const tools = [
    {
      title: "EUR-Lex Cellar Explorer",
      description: "Perform raw semantic searches across binding EU regulations, directives, and decisions pre-filtered for DG ENER and DG COMP briefs.",
      href: "/eurlex",
      icon: Scale,
      badge: "Publications Office SPARQL"
    },
    {
      title: "EP Portal Watcher",
      description: "Monitor parliamentary questions, MEP profiles, sitting vote results, and draft resolutions targeting energy tariffs and state support.",
      href: "/parliament",
      icon: BarChart3,
      badge: "EP Open Data API v2"
    },
    {
      title: "Have Your Say Monitor",
      description: "Capture public consultation feedback, read published position papers, and see who is responding (countries and organisation types).",
      href: "/have-your-say",
      icon: Users,
      badge: "EC Consultation API"
    }  ];

  const handleSelectAndGenerate = async (brief: EnelBrief, isDetailed: boolean = false) => {
    setSelectedInquiry(brief);
    setInDepthMode(isDetailed);
    setLoadingReport(true);
    setGeneratedReport("");

    setTimeout(() => {
      briefingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);

    try {
      const prompt = isDetailed
        ? `Draft an extremely comprehensive strategic briefing playbook (approximately 1,200 words) on lobbying risks. Focus on this topic: "${brief.title}" (Type: ${brief.type}, Source: ${brief.source}) in Brussels public affairs context. 
           Include: 1. EXECUTIVE SUMMARY & STRATEGIC RATIONALE, 2. DETAILED REGULATORY CONTEXT & POLICY THREATS, 3. HISTORICAL PRECEDENTS, 4. IMPACT EVALUATION ON ENERGY PORTFOLIOS, 5. ADVOCACY RECOMMENDATIONS.`
        : `Draft a detailed executive briefing paper on public affairs policy risks. Topic: "${brief.title}" (Type: ${brief.type}, Source: ${brief.source}). List policy threats and counter-advocacy recommendations.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        setGeneratedReport(data.content);
      } else {
        throw new Error("Failed to generate brief.");
      }
    } catch (err: any) {
      setGeneratedReport(`âš ï¸ Error: ${err.message || "An issue occurred generating report."}`);
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
    link.download = `${selectedInquiry.id}_advocacy_brief.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const extractQuestions = (text: string) => {
    if (!text) return [];
    const lines = text.split("\n");
    const questionsList: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      const optionMatch = trimmed.match(/^\[Option:\s*([\s\S]+?)\]$/i);
      if (optionMatch) {
        const cleanOption = optionMatch[1].trim();
        if (cleanOption && !questionsList.includes(cleanOption)) {
          questionsList.push(cleanOption);
        }
        continue;
      }
      
      const match = trimmed.match(/^[-*\d.]+\s+["']?(What|How|Why|Is|Can|Are|Should|Will|Could|Would|Which|Who|Where|When)[\s\S]+\?["']?$/i);
      if (match) {
        const cleanQuestion = trimmed
          .replace(/^[-*\d.]+\s+/, "")
          .replace(/^["']|["']$/g, "")
          .trim();
        if (cleanQuestion && !questionsList.includes(cleanQuestion)) {
          questionsList.push(cleanQuestion);
        }
      }
    }
    return questionsList;
  };

  const handleFollowUpQuestion = async (question: string) => {
    if (!originalReport) {
      setOriginalReport(generatedReport);
    }
    setLoadingReport(true);
    setGeneratedReport("");
    
    setTimeout(() => {
      briefingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);

    try {
      const prompt = `Provide a detailed, expert-level response answering this follow-up question: "${question}". Keep context focused on EU regulatory policy and corporate public affairs. Use headings and add a closing section called "STRATEGIC RECOMMENDATION".`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedReport(data.content);
      } else {
        throw new Error("Failed to generate answer.");
      }
    } catch (err: any) {
      setGeneratedReport(`âš ï¸ Error: ${err.message || "An issue occurred answering question."}`);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleBackToMain = () => {
    setGeneratedReport(originalReport);
    setOriginalReport("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 space-y-8">
        
        {/* Navigation & Branding Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md transition-colors"
            >
              â† Gateway
            </Link>
            <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white uppercase">Corporate Intelligence</h1>
                <span className="text-[10px] font-mono tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md uppercase font-semibold">Public Affairs</span>
              </div>
              <p className="text-xs text-slate-400">EU Policy & Competition Intelligence Platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-mono font-semibold text-slate-300">CELLAR Triplestore Connected</span>
            </div>
            <Link
              href="/research"
              className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors px-3 py-1.5 rounded-md"
            >
              <span>AI Console</span> <Sparkles className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Counters Grid */}
        {countsError && (
          <ErrorBanner
            message="Some live counters failed to load. Values may be incomplete."
            onRetry={fetchCounts}
          />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statistics.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 flex items-center justify-between hover:border-slate-700 transition-colors group cursor-pointer"
              >
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-semibold">{stat.label}</span>
                  <div className="text-xl font-bold font-mono text-white group-hover:text-blue-400 transition-colors">
                    {stat.count !== null ? stat.count : "..."}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Core Tools Division */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" /> Authorized Legislative Watchers
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Targeted workspaces to track and analyze EU regulatory frameworks</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.title}
                  className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 flex flex-col justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono tracking-wider font-semibold uppercase px-2 py-0.5 rounded-md border bg-slate-950 border-slate-800 text-slate-400">
                        {tool.badge}
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-bold text-slate-100">{tool.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{tool.description}</p>
                  </div>

                  <Link 
                    href={tool.href}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-md bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                  >
                    <span>Launch Workspace</span> <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Stream & AI Advocate Executive brief generator */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Recent Legislative Inquiries Brief Stream (2/5 columns) */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 flex-wrap">
                  <Activity className="w-4 h-4 text-blue-400" /> Live Regulatory Feed
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Latest items from the European Parliament, the Commission and EUR-Lex</p>
              </div>

              {/* Inquiries Tabs */}
              <div className="flex border border-slate-800 p-1 bg-slate-950 rounded-md">
                {FEED_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-1 text-[10px] font-semibold uppercase rounded transition-colors cursor-pointer ${activeTab === tab.key ? "bg-slate-800 text-blue-400" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Brief Cards Stream */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {feed[activeTab].length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400 italic border border-dashed border-slate-800 rounded-md">Nothing to show yet.</div>
                )}
                {feed[activeTab].map((brief) => {
                  const isSelected = selectedInquiry?.id === brief.id && selectedInquiry?.source === brief.source;
                  return (
                    <button
                      key={`${activeTab}-${brief.id}`} 
                      onClick={() => handleSelectAndGenerate(brief)}
                      disabled={loadingReport}
                      className={`w-full text-left p-3.5 bg-slate-950/60 border rounded-md space-y-2 transition-colors cursor-pointer disabled:opacity-70 ${isSelected ? "border-blue-500 bg-slate-900" : "border-slate-800 hover:border-slate-700"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {brief.type}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 leading-snug">{brief.title}</h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Source: {brief.source}</span>
                        <span>Date: {brief.date}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Executive Advocate Risk Summarizer (3/5 columns) */}
          <div ref={briefingRef} className="lg:col-span-3 bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" /> Advocate AI Briefing (AI-generated)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Draft strategic position summaries & counter-advocacy memos</p>
              </div>

              {/* Active Inquiry Subject Display */}
              {selectedInquiry ? (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {selectedInquiry.type}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 leading-snug mt-1">
                    <span className="text-slate-400 font-normal">Active Subject:</span> {selectedInquiry.title}
                  </h4>
                </div>
              ) : (
                <div className="p-4 bg-slate-950 border border-dashed border-slate-800 rounded-md text-center text-xs text-slate-400 italic">
                  Select an item from the live feed to draft a briefing.
                </div>
              )}

              {/* Generated Briefing Frame */}
              {originalReport && !loadingReport && (
                <button
                  onClick={handleBackToMain}
                  className="mb-3 inline-flex items-center gap-1 px-3 py-1 rounded-md bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  â† Return to Main Briefing
                </button>
              )}
              <div className={`bg-slate-950 border border-slate-800 p-4 rounded-md min-h-[220px] max-h-[340px] overflow-y-auto flex flex-col relative ${generatedReport || loadingReport ? "justify-start" : "justify-center"}`}>
                {loadingReport ? (
                  <LoadingSpinner message="Advocate AI parsing regulations & drafting briefing..." accent="blue" icon="cpu" size="sm" />
                ) : generatedReport ? (
                  <div className="text-xs leading-relaxed font-sans text-slate-300 whitespace-pre-wrap">
                    {generatedReport}
                  </div>
                ) : (
                  <div className="text-center text-slate-400 italic text-xs space-y-2 p-4">
                    <p>Select any legislative inquiry card to instantly generate a custom strategic counter-advocacy brief.</p>
                  </div>
                )}
              </div>

              {/* Follow-up Interactive Questions */}
              {!loadingReport && generatedReport && extractQuestions(generatedReport).length > 0 && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Deep Dive Follow-up Questions
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {extractQuestions(generatedReport).map((question) => (
                      <button
                        key={question}
                        onClick={() => handleFollowUpQuestion(question)}
                        className="w-full text-left p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-md text-xs text-slate-300 hover:text-white transition-colors cursor-pointer flex justify-between items-center gap-2 group"
                      >
                        <span>{question}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedInquiry && (
              <div className="space-y-3 pt-2">
                
                {/* Utilities: Copy & Save */}
                {generatedReport && (
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex-1 py-2 rounded-md border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Brief!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Briefing
                        </>
                      )}
                    </button>
                    <button
                      onClick={downloadReport}
                      className="flex-1 py-2 rounded-md border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" /> Save Briefing
                    </button>
                  </div>
                )}

                {/* Primary Generators */}
                <div className="flex flex-col gap-2">
                  {generatedReport && !inDepthMode && (
                    <button
                      onClick={() => handleSelectAndGenerate(selectedInquiry, true)}
                      disabled={loadingReport}
                      className="w-full py-2.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white" /> Upgrade to In-Depth Briefing
                    </button>
                  )}

                  {generatedReport && inDepthMode && (
                    <button
                      onClick={() => handleSelectAndGenerate(selectedInquiry, false)}
                      disabled={loadingReport}
                      className="w-full py-2.5 rounded-md border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Scale className="w-3.5 h-3.5 text-slate-400" /> Switch to Standard Briefing
                    </button>
                  )}

                  <button
                    onClick={() => handleSelectAndGenerate(selectedInquiry, inDepthMode)}
                    disabled={loadingReport}
                    className="w-full py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Cpu className="w-3.5 h-3.5 text-slate-400" /> Re-draft Active Briefing
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

