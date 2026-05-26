"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Send, 
  Scale, 
  BookOpen, 
  Settings, 
  Sliders, 
  MessageSquare, 
  Globe, 
  Activity,
  ChevronDown,
  ChevronUp,
  Shield,
  Terminal,
  Sparkles,
  ArrowLeft,
  ExternalLink
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  searchLogs?: {
    q: string;
    namespace: string;
    top_k: number;
    success: boolean;
    resultsCount: number;
    results: any;
  }[];
}

export default function ResearchPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Greetings. I am your EU Legal Data Hunter AI agent. I can perform active research on European Union regulations, directives, decisions, CJEU/ECJ case law, and member state jurisdictions to assist your inquiry. What EU legal concepts would you like to search today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Settings
  const [namespace, setNamespace] = useState("case_law");
  const [topK, setTopK] = useState(5);

  // Accordion search states
  const [expandedLog, setExpandedLog] = useState<{ [key: number]: boolean }>({});

  // Summarizer Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSummaryDoc, setActiveSummaryDoc] = useState<{ title: string; snippet: string; namespace: string; celex: string } | null>(null);
  const [isDetailedSummary, setIsDetailedSummary] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const ALL_PRESETS = [
    {
      title: "Employment Precedents",
      query: "Analyze European Court of Justice precedents regarding gender pay discrimination and constructive dismissal."
    },
    {
      title: "Environmental Liability",
      query: "What are the EU regulatory disclosure requirements and ECHR precedents regarding offshore industrial pollution liability?"
    },
    {
      title: "GDPR Data Violations",
      query: "Find European precedents concerning biometric data processing violations and class action claims under GDPR."
    },
    {
      title: "Digital Markets Act",
      query: "Search for European Commission antitrust rulings and DMA compliance guidelines regarding third-party app stores."
    },
    {
      title: "AI Act Compliance",
      query: "Review EU AI Act compliance mandates, risk classification thresholds, and penalties for prohibited AI systems."
    },
    {
      title: "Consumer Rights",
      query: "Analyze CJEU decisions regarding consumer contract transparency, geoblocking restrictions, and airline delay refunds."
    }
  ];

  const [activePresets, setActivePresets] = useState<typeof ALL_PRESETS>([]);

  const rotatePresets = () => {
    const shuffled = [...ALL_PRESETS].sort(() => 0.5 - Math.random());
    setActivePresets(shuffled.slice(0, 2));
  };

  useEffect(() => {
    rotatePresets();
  }, []);

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: "Greetings. I am your EU Legal Data Hunter AI agent. I can perform active research on European Union regulations, directives, decisions, CJEU/ECJ case law, and member state jurisdictions to assist your inquiry. What EU legal concepts would you like to search today?"
      }
    ]);
    setInput("");
    setLoading(false);
    rotatePresets();
  };

  const handleSummarize = async (title: string, snippet: string, docNamespace: string, celex: string, detailed: boolean = false) => {
    setActiveSummaryDoc({ title, snippet, namespace: docNamespace, celex });
    setIsDetailedSummary(detailed);
    setModalOpen(true);
    setSummarizing(true);
    setSummaryText("");
    setCopySuccess(false);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, snippet, namespace: docNamespace, celex, detailed })
      });

      if (!res.ok) {
        throw new Error("Failed to generate summary.");
      }

      const data = await res.json();
      setSummaryText(data.summary);
    } catch (err: any) {
      setSummaryText(`⚠️ Failed to draft summary: ${err.message || "An error occurred."}`);
    } finally {
      setSummarizing(false);
    }
  };

  const downloadSummary = () => {
    if (!activeSummaryDoc || !summaryText) return;
    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeSummaryDoc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    if (!summaryText) return;
    navigator.clipboard.writeText(summaryText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSend = async (textToSend?: string) => {
    const activeText = textToSend || input;
    if (!activeText.trim()) return;

    if (!textToSend) setInput("");
    setLoading(true);

    const newMessages = [...messages, { role: "user" as const, content: activeText }];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          defaultNamespace: namespace,
          defaultTopK: topK
        })
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with coordinator API.");
      }

      const data = await response.json();
      setMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: data.content,
          searchLogs: data.searchLogs 
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `⚠️ Error occurred: ${err.message || "Failed to process chat response."}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-teal-500/30 selection:text-teal-200 p-6 md:p-12">
      
      {/* Animated Background Mesh Spheres */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-2/3 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full space-y-8 z-10">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-6">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Portal Landing
          </Link>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_#a855f7]" />
            <span className="text-xs font-bold font-mono text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
              Advanced AI Research Terminal
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: SYSTEM STATUS & PRESETS OVERVIEW               */}
        {/* ========================================================= */}
        <div className="bg-slate-900/20 border border-slate-800/80 border-t-4 border-t-cyan-500 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)] backdrop-blur-md relative overflow-hidden">
          {/* Floating glass badge */}
          <div className="absolute top-4 right-4 md:top-6 md:right-8 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md pointer-events-none z-10">
            [02 / System & Presets]
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  System Status & Presets <span className="text-[10px] font-mono tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2.5 py-0.5 rounded-full">Terminal Info</span>
                </h2>
                <p className="text-xs text-slate-400">Confirm database connection endpoints and launch fast preset search queries</p>
              </div>
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-emerald" />
              <span className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1 rounded-full font-medium">System Armed</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            {/* Status Panel */}
            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" /> Connection Status
                </span>
                <span className="text-[10px] uppercase bg-cyan-950/50 border border-cyan-800/80 text-cyan-400 px-2 py-0.5 rounded-full">Secure</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">OpenRouter (DeepSeek)</span>
                  <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Connected
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">EUR-Lex SPARQL Endpoint</span>
                  <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Secured
                  </span>
                </div>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
              <span className="text-sm font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" /> Quick Search Presets
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(preset.query)}
                    className="text-left p-3.5 rounded-xl bg-slate-950/40 border border-slate-855 hover:border-teal-500 hover:bg-slate-900/60 transition-all duration-300 group cursor-pointer h-24 flex flex-col justify-between"
                  >
                    <div className="text-[11px] font-bold text-teal-400 group-hover:text-emerald-400 transition-colors line-clamp-1">{preset.title}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">{preset.query}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: INTERACTIVE SEARCH & CONFIG CONSOLE            */}
        {/* ========================================================= */}
        <div className="bg-slate-900/20 border border-slate-800/80 border-t-4 border-t-purple-500 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_50px_-12px_rgba(168,85,247,0.15)] backdrop-blur-md relative overflow-hidden">
          {/* Floating glass badge */}
          <div className="absolute top-4 right-4 md:top-6 md:right-8 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md pointer-events-none z-10">
            [03 / Search & Config Console]
          </div>

          <div className="border-b border-slate-850 pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Scale className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  Interactive Search Console <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                </h2>
                <p className="text-xs text-slate-400">Query EU case precedents, directive mandates, and regulations in pure natural language</p>
              </div>
            </div>
          </div>

          {/* Selector Bubbles & Slider */}
          <div className="space-y-6 border-b border-slate-850 pb-6 relative z-10">
            {/* Sector Pills */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> Targeted Legal Sectors & Domains
              </label>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { id: "consolidated", label: "Consolidated Texts (Sector 0)", color: "rose" },
                  { id: "international", label: "Primary Law & Treaties (Sector 1)", color: "amber" },
                  { id: "agreements", label: "International Agreements (Sector 2)", color: "violet" },
                  { id: "statutes", label: "Secondary Legislation (Sector 3)", color: "cyan" },
                  { id: "complementary", label: "Complementary Legislation (Sector 4)", color: "blue" },
                  { id: "regulatory", label: "Preparatory Documents (Sector 5)", color: "indigo" },
                  { id: "case_law", label: "Case Law (Sector 6)", color: "emerald" },
                  { id: "transposition", label: "National Transposition (Sector 7)", color: "yellow" },
                  { id: "national_case_law", label: "National Case-Law (Sector 8)", color: "teal" },
                  { id: "parliamentary", label: "Parliamentary Questions (Sector 9)", color: "fuchsia" }
                ].map((item) => {
                  const isActive = namespace === item.id;
                  let pillStyle = "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200";
                  
                  if (isActive) {
                    if (item.color === "emerald") pillStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                    else if (item.color === "cyan") pillStyle = "border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]";
                    else if (item.color === "indigo") pillStyle = "border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]";
                    else if (item.color === "amber") pillStyle = "border-amber-500 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]";
                    else if (item.color === "rose") pillStyle = "border-rose-500 bg-rose-500/10 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)]";
                    else if (item.color === "violet") pillStyle = "border-violet-500 bg-violet-500/10 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.1)]";
                    else if (item.color === "blue") pillStyle = "border-blue-500 bg-blue-500/10 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]";
                    else if (item.color === "yellow") pillStyle = "border-yellow-500 bg-yellow-500/10 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.1)]";
                    else if (item.color === "teal") pillStyle = "border-teal-500 bg-teal-500/10 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.1)]";
                    else if (item.color === "fuchsia") pillStyle = "border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-300 shadow-[0_0_15px_rgba(217,70,239,0.1)]";
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNamespace(item.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border backdrop-blur-sm transition-all duration-350 cursor-pointer active:scale-95 flex items-center gap-1.5 ${pillStyle}`}
                    >
                      {isActive && <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-current" />}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slider */}
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 bg-slate-950/40 p-4 border border-slate-850 rounded-2xl">
              <div className="flex flex-col gap-1 col-span-1">
                <label className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Database Search Depth (top_k)
                </label>
                <p className="text-[10px] text-slate-500 leading-none">Max matching documents to retrieve for reasoning</p>
              </div>
              <div className="flex items-center gap-4 col-span-2">
                <input 
                  type="range"
                  min="1"
                  max="15"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <span className="text-emerald-400 font-mono font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                  {topK} Documents
                </span>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="space-y-8 min-h-[350px] max-h-[600px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950 relative z-10">
            {messages.map((message, index) => {
              let displayContent = message.content;
              const messageOptions = [];
              
              if (message.role === "assistant") {
                const optionRegex = /\[Option:\s*(.*?)\]/gi;
                let match;
                while ((match = optionRegex.exec(message.content)) !== null) {
                  messageOptions.push(match[1].trim());
                }
                displayContent = message.content.replace(/\[Option:\s*(.*?)\]/gi, '').trim();
              }

              return (
                <div 
                  key={index}
                  className={`flex gap-4 max-w-6xl ${message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${message.role === "user" ? "bg-gradient-to-tr from-emerald-500 to-cyan-500 border-cyan-400 text-white" : "bg-slate-900 border-slate-800 text-teal-400"}`}>
                    {message.role === "user" ? <MessageSquare className="w-4.5 h-4.5" /> : <Scale className="w-4.5 h-4.5" />}
                  </div>

                  <div className="space-y-4 w-[90%]">
                    <div className={`p-5 rounded-2xl border text-sm leading-relaxed whitespace-pre-wrap ${message.role === "user" ? "bg-gradient-to-br from-emerald-950/40 to-teal-900/40 border-teal-800/80 text-teal-55" : "bg-slate-900/50 border-slate-800 backdrop-blur-md text-slate-100"}`}>
                      {displayContent}
                    </div>

                    {message.role === "assistant" && messageOptions.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 pt-1">
                        {messageOptions.map((opt, optIdx) => (
                          <button
                            key={optIdx}
                            onClick={() => handleSend(opt)}
                            disabled={loading}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-950 border border-slate-850 hover:border-teal-500/50 hover:bg-slate-900/40 text-slate-300 hover:text-slate-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {message.role === "assistant" && message.searchLogs && message.searchLogs.length > 0 && (
                      <div className="space-y-6 pt-2">
                        {message.searchLogs.map((log: any, logIdx: number) => (
                          <div key={logIdx} className="border border-slate-800 bg-slate-950/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
                            <div 
                              onClick={() => setExpandedLog(prev => ({ ...prev, [logIdx]: !prev[logIdx] }))}
                              className="px-5 py-4 bg-slate-900/40 border-b border-slate-850 flex items-center justify-between cursor-pointer hover:bg-slate-900/70 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Terminal className="text-teal-400 w-4 h-4 animate-pulse" />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">EUR-Lex Database Search Event</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] bg-teal-950/40 border border-teal-850 text-teal-400 px-2.5 py-0.5 rounded-full font-semibold">
                                  {log.resultsCount} Hits Found
                                </span>
                                {expandedLog[logIdx] ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                              </div>
                            </div>

                            {expandedLog[logIdx] && (
                              <div className="p-4 border-b border-slate-850 bg-slate-950 text-[10px] font-mono text-slate-500 space-y-1.5 leading-relaxed">
                                <div>SPARQL Host URI: <strong className="text-slate-400">publications.europa.eu/webapi/rdf/sparql</strong></div>
                                <div>Searched Namespace: <strong className="text-teal-400">"{log.namespace}"</strong> for <strong className="text-teal-400">"{log.q}"</strong></div>
                                <div>Database Query Success: <strong className={log.success ? "text-emerald-400" : "text-red-400"}>{log.success ? "true" : "false"}</strong></div>
                                <div>Result limit depth (top_k): <strong className="text-slate-400">{log.top_k}</strong></div>
                              </div>
                            )}

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-400 font-medium">
                                    <th className="p-4 w-1/4">📜 Document Name</th>
                                    <th className="p-4 w-[12%] text-center">🎯 Relevance</th>
                                    <th className="p-4">🔍 Context Preview Snippet</th>
                                    <th className="p-4 w-[10%] text-center">🔗 Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850">
                                  {Array.isArray(log.results) && log.results.length > 0 ? (
                                    log.results.map((doc: any, docIdx: number) => {
                                      const score = doc.score || (0.95 - docIdx * 0.08);
                                      const scorePercent = (score * 100).toFixed(0);
                                      let scoreColor = "text-emerald-400 bg-emerald-950/40 border-emerald-800/80";
                                      if (score < 0.8) scoreColor = "text-cyan-400 bg-cyan-950/40 border-cyan-800/80";
                                      if (score < 0.6) scoreColor = "text-slate-400 bg-slate-900/40 border-slate-800/80";
                                      const targetLink = doc.url || `https://legaldatahunter.com/doc/${encodeURIComponent(doc.id || doc.title || "document")}`;

                                      return (
                                        <tr key={docIdx} className={`hover:bg-slate-900/40 transition-colors ${docIdx % 2 === 0 ? "bg-transparent" : "bg-slate-900/10"}`}>
                                          <td className="p-4 font-semibold text-slate-200 align-top">{doc.title}</td>
                                          <td className="p-4 align-top text-center">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${scoreColor}`}>
                                              {scorePercent}% Match
                                            </span>
                                          </td>
                                          <td className="p-4 align-top text-slate-400 leading-relaxed font-mono text-[11px] whitespace-pre-wrap">{doc.snippet}</td>
                                          <td className="p-4 align-top text-center">
                                            <div className="flex items-center justify-center gap-3">
                                              <a href={targetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-emerald-400 hover:underline transition-colors font-medium">
                                                Link
                                              </a>
                                              <button onClick={() => handleSummarize(doc.title, doc.snippet, log.namespace, doc.id)} className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-teal-455 hover:underline transition-colors font-medium">
                                                Summarise
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })
                                  ) : (
                                    <tr>
                                      <td colSpan={4} className="p-8 text-center text-slate-500 italic">No snippets returned.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-4 max-w-4xl mr-auto">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-slate-900 border-slate-800 text-emerald-400 animate-pulse animate-spin">
                  <Scale className="w-4.5 h-4.5" />
                </div>
                <div className="p-4 bg-slate-900/40 border border-slate-800 backdrop-blur-md rounded-2xl flex items-center gap-3">
                  <span className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" />
                  </span>
                  <span className="text-xs text-slate-400 font-medium">DeepSeek-V4 is querying database indexes...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form */}
          <div className="mt-6 border-t border-slate-850 pt-6 relative z-10">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="max-w-6xl mx-auto flex gap-3 p-2 bg-slate-950/60 border border-slate-800 rounded-2xl focus-within:border-teal-500/80 focus-within:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-300 relative z-10"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about European cases, EU directives, precedents, or statutory definitions..."
                className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none text-slate-100 placeholder-slate-500"
              />
              <button type="button" onClick={handleReset} className="px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/50 hover:text-red-400 text-slate-400 text-sm font-medium transition-all cursor-pointer">
                Reset
              </button>
              <button type="submit" disabled={!input.trim() || loading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-450 hover:to-cyan-450 text-white font-medium text-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none">
                Query <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Senior Lawyer modal */}
      {modalOpen && activeSummaryDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] flex flex-col justify-between shadow-2xl glass-card relative z-50">
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale className="text-emerald-400 w-6 h-6 animate-pulse" />
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    {isDetailedSummary ? "Senior EU Lawyer Detailed Case Analysis" : "Senior EU Lawyer Quick Overview"} <Sparkles className="w-4 h-4 text-teal-400" />
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-lg">Doc: {activeSummaryDoc.title}</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-400 hover:text-slate-100 transition-all cursor-pointer text-xs">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto my-6 pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
              {summarizing ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="relative animate-spin w-12 h-12 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center text-emerald-400">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <p className="text-sm font-semibold text-slate-300">
                      {isDetailedSummary ? "Drafting Comprehensive Case Analysis..." : "Drafting Concise Legal Overview..."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-line space-y-4 pr-1">
                  {summaryText}
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-4 flex gap-3 justify-end flex-wrap">
              {!isDetailedSummary && (
                <button
                  onClick={() => handleSummarize(activeSummaryDoc.title, activeSummaryDoc.snippet, activeSummaryDoc.namespace, activeSummaryDoc.celex, true)}
                  disabled={summarizing || !summaryText}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-100 text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-lg shadow-emerald-500/20 mr-auto border border-emerald-500/30"
                >
                  <Sparkles className="w-4 h-4 text-teal-200" /> Detailed Case Analysis (1000 words)
                </button>
              )}
              <button onClick={copyToClipboard} disabled={summarizing || !summaryText} className="px-5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none">
                {copySuccess ? "✓ Copied!" : "Copy Summary"}
              </button>
              <button onClick={downloadSummary} disabled={summarizing || !summaryText} className="px-5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none">
                Save Summary (.txt)
              </button>
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-450 hover:to-cyan-450 text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="p-8 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500 mt-12">
        <p>© 2026 Legal Data Hunter AI. Built on Next.js 15, Tailwind CSS v4, and OpenRouter.</p>
      </footer>

    </div>
  );
}
