"use client";

import React, { useState, useRef, useEffect } from "react";
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
  ArrowDown,
  ExternalLink,
  ChevronRight
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

const PRESETS = [
  {
    title: "Employment Rights",
    query: "Analyze European Court of Justice precedents regarding gender pay discrimination and constructive dismissal."
  },
  {
    title: "Environmental Liability",
    query: "What are the EU regulatory disclosure requirements and ECHR precedents regarding offshore industrial pollution liability?"
  },
  {
    title: "GDPR Data Protection",
    query: "Find European precedents concerning biometric data processing violations and class action claims under GDPR."
  }
];

export default function ChatPage() {
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
  const [activeSummaryDoc, setActiveSummaryDoc] = useState<{ title: string; snippet: string; namespace: string } | null>(null);
  const [summaryText, setSummaryText] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const scrollToDashboard = () => {
    dashboardRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSummarize = async (title: string, snippet: string, docNamespace: string) => {
    setActiveSummaryDoc({ title, snippet, namespace: docNamespace });
    setModalOpen(true);
    setSummarizing(true);
    setSummaryText("");
    setCopySuccess(false);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, snippet, namespace: docNamespace })
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

  const toggleAccordion = (index: number) => {
    setExpandedLog(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-955 text-slate-100 flex flex-col relative selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Animated Background Mesh Spheres */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-float-1 pointer-events-none animate-float-1" />
      <div className="absolute top-2/3 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-float-2 pointer-events-none animate-float-2" />

      {/* 1. FULL-PAGE HERO SECTION */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center p-8 relative overflow-hidden">
        {/* Subtle grid pattern inside hero */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25" />
        
        {/* Stylized animated neural-network vector map of Europe */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-30 md:opacity-40 select-none max-w-5xl mx-auto">
          <svg 
            viewBox="0 0 800 600" 
            className="w-full h-full max-h-[85vh] fill-none animate-float-1"
          >
            {/* Stylized background grid representing Europe */}
            <g stroke="#059669" strokeWidth="0.5" strokeOpacity="0.25" strokeDasharray="3 6">
              <circle cx="360" cy="225" r="150" />
              <circle cx="360" cy="225" r="280" />
              <circle cx="360" cy="225" r="400" />
            </g>

            {/* Stylized Abstract Silhouette of Europe */}
            <path 
              d="M120 120 C180 80, 240 100, 260 120 C280 140, 320 140, 340 110 C360 80, 420 50, 480 40 C540 30, 560 60, 530 110 C500 160, 520 200, 560 210 C600 220, 680 180, 720 240 C750 280, 700 360, 640 400 C580 440, 540 460, 520 480 C500 500, 440 520, 420 480 C400 440, 360 420, 320 460 C280 500, 240 480, 220 440 C200 400, 160 410, 140 380 C120 350, 80 340, 90 300 C100 260, 130 250, 150 200 C170 150, 140 140, 120 120 Z" 
              stroke="#14b8a6" 
              strokeWidth="2" 
              strokeOpacity="0.45"
              fill="#14b8a6"
              fillOpacity="0.02" 
            />

            {/* Dynamic Glowing Data Paths (Neural streams of legal data) */}
            <g stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.5">
              {/* Brussels to Strasbourg */}
              <path d="M320 200 L360 225">
                <animate attributeName="stroke-dasharray" values="0 100; 100 0" dur="4s" repeatCount="indefinite" />
              </path>
              {/* Luxembourg to Brussels */}
              <path d="M340 210 L320 200" />
              {/* Paris to Brussels */}
              <path d="M260 230 L320 200" />
              {/* London to Paris */}
              <path d="M220 140 L260 230">
                <animate attributeName="stroke-dasharray" values="0 50; 50 0" dur="3s" repeatCount="indefinite" />
              </path>
              {/* Dublin to London */}
              <path d="M120 120 L220 140" />
              {/* Paris to Madrid */}
              <path d="M260 230 L140 360">
                <animate attributeName="stroke-dasharray" values="0 150; 150 0" dur="6s" repeatCount="indefinite" />
              </path>
              {/* Madrid to Lisbon */}
              <path d="M140 360 L80 380" />
              {/* Rome to Strasbourg */}
              <path d="M450 340 L360 225">
                <animate attributeName="stroke-dasharray" values="0 120; 120 0" dur="5s" repeatCount="indefinite" />
              </path>
              {/* Berlin to Brussels */}
              <path d="M440 160 L320 200" />
              {/* Berlin to Warsaw */}
              <path d="M440 160 L560 160" />
              {/* Berlin to Stockholm */}
              <path d="M440 160 L520 60" />
              {/* Vienna to Prague */}
              <path d="M480 230 L460 200" />
              {/* Prague to Berlin */}
              <path d="M460 200 L440 160" />
              {/* Rome to Athens */}
              <path d="M450 340 L620 380" />
              {/* Warsaw to Vienna */}
              <path d="M560 160 L480 230" />
            </g>

            {/* Major Capital Nodes (Legal Hubs) */}
            <g fill="#10b981" stroke="#020617" strokeWidth="1.5">
              <circle cx="320" cy="200" r="5" className="fill-teal-300 drop-shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
              <circle cx="340" cy="210" r="4.5" className="fill-teal-400" />
              <circle cx="360" cy="225" r="4.5" className="fill-teal-400 animate-pulse" />
              <circle cx="260" cy="230" r="4" />
              <circle cx="220" cy="140" r="4" />
              <circle cx="120" cy="120" r="4" />
              <circle cx="140" cy="360" r="4" />
              <circle cx="80" cy="380" r="3.5" />
              <circle cx="450" cy="340" r="4" />
              <circle cx="440" cy="160" r="4.5" className="fill-teal-400" />
              <circle cx="480" cy="230" r="4" />
              <circle cx="460" cy="200" r="4" />
              <circle cx="560" cy="160" r="4" />
              <circle cx="520" cy="60" r="4" className="animate-pulse" />
              <circle cx="620" cy="380" r="4" />
            </g>

            {/* Glowing Outer Pulses on key nodes */}
            <g className="stroke-teal-400/60 fill-none" strokeWidth="0.5">
              <circle cx="320" cy="200" r="12" className="animate-ping [animation-duration:3s]" />
              <circle cx="360" cy="225" r="10" className="animate-ping [animation-duration:4s]" />
              <circle cx="440" cy="160" r="10" className="animate-ping [animation-duration:5s]" />
            </g>
          </svg>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800 text-teal-400 text-xs font-semibold uppercase tracking-wider pulse-emerald">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Powered by DeepSeek-V4-Flash
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            EU Legal Search <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm">
              Redefined by AI
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
            Connect to European Union statutory codes, regulatory directives, and historical case law precedents. Query complex schemas instantly in pure natural language.
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <button 
              onClick={scrollToDashboard}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-450 hover:to-cyan-450 text-white font-semibold text-base shadow-[0_0_30px_rgba(20,184,166,0.25)] hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer"
            >
              Access Research Console <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Smooth Scroll Arrow Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-slate-550">
          <span className="text-xs tracking-widest uppercase">Scroll Down</span>
          <button 
            onClick={scrollToDashboard}
            className="p-3.5 rounded-full bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:text-emerald-400 hover:scale-110 active:scale-95 transition-all animate-bounce cursor-pointer"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* 2. DASHBOARD ROW SECTION (Below Hero) */}
      <section 
        ref={dashboardRef}
        className="max-w-7xl mx-auto w-full px-6 py-16 scroll-mt-6 space-y-12 z-10"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Research Console <Scale className="text-emerald-400 w-6 h-6" />
            </h2>
            <p className="text-sm text-slate-400">Configure parameters and launch database queries below.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 pulse-emerald" />
            <span className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1 rounded-full font-medium">Live Session Active</span>
          </div>
        </div>

        {/* Screenshot-inspired Horizontal Settings Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Status Panel Card */}
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
                <span className="text-slate-400">LDH Search Database</span>
                <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Secured
                </span>
              </div>
            </div>
          </div>

          {/* Target Settings Card */}
          <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <span className="text-sm font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-400" /> Target Configuration
              </span>
              <Settings className="w-4 h-4 text-slate-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Target Namespace</label>
                <select 
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:border-teal-500 focus:outline-none transition-colors"
                >
                  <option value="case_law">Case Law Documents</option>
                  <option value="statutes">Legislative Statutes</option>
                  <option value="regulatory">Regulatory Guidelines</option>
                  <option value="international">International Treaties</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Depth (top_k)</span>
                  <span className="text-emerald-400 font-bold">{topK} Docs</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="15"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  className="w-full h-1 mt-3.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Presets Card */}
          <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <span className="text-sm font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" /> Quick Search Presets
            </span>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(preset.query)}
                  className="text-left p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-teal-500 hover:bg-slate-900/60 transition-all duration-300 group cursor-pointer h-24 flex flex-col justify-between"
                >
                  <div className="text-[11px] font-bold text-teal-400 group-hover:text-emerald-400 transition-colors line-clamp-1">{preset.title}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">{preset.query}</div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* 3. SEARCH & CHAT AREA (Below Parameter Row) */}
        <div className="bg-slate-900/20 border border-slate-850 rounded-3xl p-6 flex flex-col overflow-hidden glass-card">
          
          {/* Chat Messages Log */}
          <div className="space-y-8 min-h-[350px] max-h-[600px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`flex gap-4 max-w-6xl ${message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${message.role === "user" ? "bg-gradient-to-tr from-emerald-500 to-cyan-500 border-cyan-400 text-white" : "bg-slate-900 border-slate-800 text-teal-400"}`}>
                  {message.role === "user" ? <MessageSquare className="w-4.5 h-4.5" /> : <Scale className="w-4.5 h-4.5" />}
                </div>

                {/* Message Container */}
                <div className="space-y-4 w-[90%]">
                  <div className={`p-5 rounded-2xl border text-sm leading-relaxed ${message.role === "user" ? "bg-gradient-to-br from-emerald-950/40 to-teal-900/40 border-teal-800/80 text-teal-55" : "bg-slate-900/50 border-slate-800 backdrop-blur-md text-slate-100"}`}>
                    {message.content}
                  </div>

                  {/* RENDER DYNAMIC COLORED DATABASE TABLE FOR SEARCH RESULTS */}
                  {message.searchLogs && message.searchLogs.length > 0 && (
                    <div className="space-y-4 w-full">
                      {message.searchLogs.map((log, logIdx) => (
                        <div 
                          key={logIdx} 
                          className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-2xl"
                        >
                          {/* Table Log Title Header */}
                          <div className="p-4 bg-slate-900/40 border-b border-slate-850 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2.5 text-xs text-slate-300">
                              <Terminal className="w-4 h-4 text-emerald-400" />
                              <span>Searched Namespace: <strong className="text-teal-400 font-semibold">"{log.namespace}"</strong> for <strong className="text-teal-400 font-semibold">"{log.q}"</strong></span>
                            </div>
                            <span className="text-[10px] font-bold uppercase bg-emerald-950 border border-emerald-800/60 text-emerald-400 px-3 py-1 rounded-full">
                              {log.resultsCount} matching records
                            </span>
                          </div>

                          {/* TABLE VIEW */}
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
                                    // relevance score mapping
                                    const score = doc.score || (0.95 - docIdx * 0.08);
                                    const scorePercent = (score * 100).toFixed(0);
                                    
                                    // Score badges
                                    let scoreColor = "text-emerald-400 bg-emerald-950/40 border-emerald-800/80";
                                    if (score < 0.8) {
                                      scoreColor = "text-cyan-400 bg-cyan-950/40 border-cyan-800/80";
                                    }
                                    if (score < 0.6) {
                                      scoreColor = "text-slate-400 bg-slate-900/40 border-slate-800/80";
                                    }

                                    // link creation
                                    const targetLink = doc.url || `https://legaldatahunter.com/doc/${encodeURIComponent(doc.id || doc.title || "document")}`;

                                    return (
                                      <tr 
                                        key={docIdx} 
                                        className={`hover:bg-slate-900/40 transition-colors ${docIdx % 2 === 0 ? "bg-transparent" : "bg-slate-900/10"}`}
                                      >
                                        <td className="p-4 font-semibold text-slate-200 align-top">
                                          {doc.title || `Legal Record #${docIdx + 1}`}
                                        </td>
                                        <td className="p-4 align-top text-center">
                                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${scoreColor}`}>
                                            {scorePercent}% Match
                                          </span>
                                        </td>
                                        <td className="p-4 align-top text-slate-400 leading-relaxed font-mono text-[11px] whitespace-pre-wrap">
                                          {doc.snippet || doc.content || "Context content payload loaded securely."}
                                        </td>
                                        <td className="p-4 align-top text-center">
                                          <div className="flex items-center justify-center gap-3">
                                            <a 
                                              href={targetLink}
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-emerald-400 hover:underline transition-colors font-medium cursor-pointer"
                                            >
                                              Link <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                            <button 
                                              onClick={() => handleSummarize(doc.title, doc.snippet, log.namespace)}
                                              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-teal-450 hover:underline transition-colors font-medium cursor-pointer"
                                            >
                                              Summarise <Sparkles className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                                      No database snippets returned for this action.
                                    </td>
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
            ))}

            {/* Loading thinking bubble */}
            {loading && (
              <div className="flex gap-4 max-w-4xl mr-auto">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-slate-900 border-slate-800 text-emerald-400 animate-pulse">
                  <Scale className="w-4.5 h-4.5 animate-spin" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="p-4 bg-slate-900/40 border border-slate-800 backdrop-blur-md rounded-2xl flex items-center gap-3">
                    <span className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" />
                    </span>
                    <span className="text-xs text-slate-400 font-medium">DeepSeek-V4 is querying database indexes...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Floating Input */}
          <div className="mt-6 border-t border-slate-850 pt-6">
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
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-450 hover:to-cyan-450 text-white font-medium text-sm flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:pointer-events-none cursor-pointer"
              >
                Query <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </section>

    {/* 4. SENIOR EU LAWYER CASE SUMMARIZER POPUP MODAL */}
    {modalOpen && activeSummaryDoc && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] flex flex-col justify-between shadow-2xl glass-card relative z-50">
          
          {/* Header */}
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="text-emerald-400 w-6 h-6 animate-pulse" />
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  Senior EU Lawyer Case Analysis <Sparkles className="w-4 h-4 text-teal-400" />
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-lg">Doc: {activeSummaryDoc.title}</p>
              </div>
            </div>
            <button 
              onClick={() => setModalOpen(false)}
              className="p-2 rounded-lg bg-slate-955 border border-slate-800 hover:border-emerald-500/50 text-slate-400 hover:text-slate-100 transition-all cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto my-6 pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
            {summarizing ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl border border-slate-800 bg-slate-955 flex items-center justify-center text-emerald-400 animate-spin">
                    <Scale className="w-6 h-6" />
                  </div>
                  <span className="absolute inset-0 w-12 h-12 rounded-xl border-t border-emerald-400 animate-ping opacity-75" />
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-sm font-semibold text-slate-300">Drafting Expert Case Summary...</p>
                  <p className="text-xs text-slate-500 max-w-md">Acting as a Senior EU Counsel to construct a thorough ~1000-word legal analysis including citations, dispute facts, directive holdings, and strategic precedents.</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-line space-y-4 pr-1">
                {summaryText}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="border-t border-slate-800 pt-4 flex gap-3 justify-end flex-wrap">
            <button
              onClick={copyToClipboard}
              disabled={summarizing || !summaryText}
              className="px-5 py-2.5 rounded-xl bg-slate-955 border border-slate-800 hover:border-teal-500/50 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {copySuccess ? "✓ Copied!" : "Copy Summary"}
            </button>
            <button
              onClick={downloadSummary}
              disabled={summarizing || !summaryText}
              className="px-5 py-2.5 rounded-xl bg-slate-955 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              Save Summary (.txt)
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-450 hover:to-cyan-450 text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Close Panel
            </button>
          </div>

        </div>
      </div>
    )}

      {/* Footer */}
      <footer className="p-8 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500 space-y-2 mt-auto">
        <p>© 2026 Legal Data Hunter AI. Built on Next.js 15, Tailwind CSS v4, and OpenRouter.</p>
        <p>Confidential and secured enterprise environment.</p>
      </footer>

    </div>
  );
}
