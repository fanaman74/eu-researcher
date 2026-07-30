"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Scale,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Terminal,
  Sparkles,
  ExternalLink
} from "lucide-react";

import PageHeader from "@/components/PageHeader";
import SummarizerModal from "@/components/SummarizerModal";
import { type Message, type SearchLog, type EurLexHit, type SummarizerConfig } from "@/lib/types";

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
  const [namespace, setNamespace] = useState("all");
  const [topK, setTopK] = useState(5);

  // Accordion search states
  const [expandedLog, setExpandedLog] = useState<{ [key: number]: boolean }>({});

  // Summarizer Modal States
  const [activeSummaryDoc, setActiveSummaryDoc] = useState<SummarizerConfig | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: "Greetings. I am your EU Legal Data Hunter AI agent. I can perform active research on European Union regulations, directives, decisions, CJEU/ECJ case law, and member state jurisdictions to assist your inquiry. What EU legal concepts would you like to search today?"
      }
    ]);
    setInput("");
    setLoading(false);
  };

  const handleSummarize = (title: string, snippet: string, docNamespace: string, celex: string) => {
    setActiveSummaryDoc({ title, snippet, namespace: docNamespace, celex });
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
        <PageHeader
          backHref="/"
          backLabel="Back to Portal Landing"
          badge="Advanced AI Research Terminal"
          accent="purple"
        />



        {/* ========================================================= */}
        {/* SECTION 3: INTERACTIVE SEARCH & CONFIG CONSOLE            */}
        {/* ========================================================= */}
        <div className="bg-slate-900/20 border border-slate-800/80 border-t-4 border-t-purple-500 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_50px_-12px_rgba(168,85,247,0.15)] backdrop-blur-md relative overflow-hidden">
          {/* Floating glass badge */}
          <div className="absolute top-4 right-4 md:top-6 md:right-8 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md pointer-events-none z-10">
            [03 / Search & Config Console]
          </div>

          <div className="border-b border-slate-800 pb-4 relative z-10">
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
          <div className="space-y-6 border-b border-slate-800 pb-6 relative z-10">


            {/* Slider */}
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 bg-slate-950/40 p-4 border border-slate-800 rounded-2xl">
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
                  onChange={(e) => setTopK(parseInt(e.target.value, 10))}
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
                  key={`${message.role}-${index}`}
                  className={`flex gap-4 max-w-6xl ${message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${message.role === "user" ? "bg-gradient-to-tr from-emerald-500 to-cyan-500 border-cyan-400 text-white" : "bg-slate-900 border-slate-800 text-teal-400"}`}>
                    {message.role === "user" ? <MessageSquare className="w-4.5 h-4.5" /> : <Scale className="w-4.5 h-4.5" />}
                  </div>

                  <div className="space-y-4 w-[90%]">
                    <div className={`p-5 rounded-2xl border text-sm leading-relaxed whitespace-pre-wrap ${message.role === "user" ? "bg-gradient-to-br from-emerald-950/40 to-teal-900/40 border-teal-800/80 text-teal-50" : "bg-slate-900/50 border-slate-800 backdrop-blur-md text-slate-100"}`}>
                      {displayContent}
                    </div>

                    {message.role === "assistant" && messageOptions.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 pt-1">
                        {messageOptions.map((opt, optIdx) => (
                          <button
                            key={`${opt}-${optIdx}`}
                            onClick={() => handleSend(opt)}
                            disabled={loading}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-900/40 text-slate-300 hover:text-slate-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {message.role === "assistant" && message.searchLogs && message.searchLogs.length > 0 && (
                      <div className="space-y-6 pt-2">
                        {message.searchLogs.map((log: SearchLog, logIdx: number) => (
                          <div key={`${log.q}-${logIdx}`} className="border border-slate-800 bg-slate-950/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
                            <div
                              onClick={() => setExpandedLog(prev => ({ ...prev, [logIdx]: !prev[logIdx] }))}
                              className="px-5 py-4 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-900/70 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Terminal className="text-teal-400 w-4 h-4 animate-pulse" />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">EUR-Lex Database Search Event</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] bg-teal-950/40 border border-teal-800 text-teal-400 px-2.5 py-0.5 rounded-full font-semibold">
                                  {log.resultsCount} Hits Found
                                </span>
                                {expandedLog[logIdx] ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                              </div>
                            </div>

                            {expandedLog[logIdx] && (
                              <div className="p-4 border-b border-slate-800 bg-slate-950 text-[10px] font-mono text-slate-500 space-y-1.5 leading-relaxed">
                                <div>SPARQL Host URI: <strong className="text-slate-400">publications.europa.eu/webapi/rdf/sparql</strong></div>
                                <div>Searched Namespace: <strong className="text-teal-400">"{log.namespace}"</strong> for <strong className="text-teal-400">"{log.q}"</strong></div>
                                <div>Database Query Success: <strong className={log.success ? "text-emerald-400" : "text-red-400"}>{log.success ? "true" : "false"}</strong></div>
                                <div>Result limit depth (top_k): <strong className="text-slate-400">{log.top_k}</strong></div>
                              </div>
                            )}

                            <div className="divide-y divide-slate-800/50 bg-slate-950/20">
                              {Array.isArray(log.results) && log.results.length > 0 ? (
                                log.results.map((doc: EurLexHit, docIdx: number) => {
                                  const targetLink = doc.url || `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${doc.id}`;

                                  return (
                                    <div
                                      key={doc.id}
                                      className="p-5 hover:bg-slate-900/30 transition-all duration-300 flex flex-col gap-4 relative group"
                                    >
                                      {/* Document Main Block */}
                                      <div className="space-y-3">

                                        {/* Top Meta Line: CELEX & Sector */}
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-[10px] font-mono font-bold text-slate-500">
                                            #{docIdx + 1}
                                          </span>
                                          {doc.sector && (
                                            <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-400">
                                              {doc.sector}
                                            </span>
                                          )}
                                        </div>

                                        {/* Document Title (Extremely readable full-width) */}
                                        <h4 className="text-xs font-bold text-slate-200 leading-snug group-hover:text-white transition-colors">
                                          {doc.title}
                                        </h4>

                                        {/* Document Preview Snippet (Mono, full-width) */}
                                        <p className="text-[10px] text-slate-400 font-mono leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-slate-900/80 whitespace-pre-wrap">
                                          {doc.snippet}
                                        </p>

                                      </div>

                                      {/* Bottom Actions Block */}
                                      <div className="flex items-center justify-start gap-3 pt-2.5 border-t border-slate-900/50">
                                        <a
                                          href={targetLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-teal-500/50 text-teal-400 hover:text-teal-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                          View Source <ExternalLink className="w-3 h-3" />
                                        </a>
                                        <button
                                          onClick={() => handleSummarize(doc.title, doc.snippet, log.namespace, doc.id)}
                                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 text-[10px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                          Summarise <Sparkles className="w-3 h-3" />
                                        </button>
                                      </div>

                                    </div>
                                  );
                                })
                              ) : (
                                <div className="p-8 text-center text-slate-500 italic text-xs">
                                  No snippets returned.
                                </div>
                              )}
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
                  <span className="text-xs text-slate-400 font-medium">DeepSeek v4 Flash is querying database indexes...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form */}
          <div className="mt-6 border-t border-slate-800 pt-6 relative z-10">
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
              <button type="submit" disabled={!input.trim() || loading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-medium text-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none">
                Query <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

      </div>

      <SummarizerModal
        isOpen={!!activeSummaryDoc}
        onClose={() => setActiveSummaryDoc(null)}
        document={activeSummaryDoc}
        accent="purple"
      />

      {/* Footer */}
      <footer className="p-8 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500 mt-12">
        <p>© 2026 EU Researcher. Built on Next.js 15, Tailwind CSS v4, and OpenRouter.</p>
      </footer>

    </div>
  );
}
