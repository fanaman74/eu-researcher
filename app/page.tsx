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
  Sparkles
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
    title: "Employment Discrimination",
    query: "Analyze cases regarding gender discrimination and constructive discharge in California corporations."
  },
  {
    title: "Environmental Liability",
    query: "What are the regulatory disclosure requirements and precedents regarding offshore oil spillage liability?"
  },
  {
    title: "Data Privacy Protection",
    query: "Find precedents concerning class action lawsuits for consumer biometric data leaks without consent."
  }
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Greetings. I am your Legal Data Hunter AI agent. I can perform active research on global case law, statutes, and regulatory documents to assist your inquiry. What legal concepts would you like to search today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Sidebar settings
  const [namespace, setNamespace] = useState("case_law");
  const [topK, setTopK] = useState(5);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Accordion search states
  const [expandedLog, setExpandedLog] = useState<{ [key: number]: boolean }>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
    <div className="flex flex-1 overflow-hidden h-screen bg-slate-950 relative">
      {/* Decorative Grid BG */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

      {/* Dynamic Settings Sidebar */}
      <div className={`transition-all duration-300 flex flex-col border-r border-slate-800 bg-slate-900/60 backdrop-blur-md z-10 ${sidebarOpen ? "w-80" : "w-0 overflow-hidden border-r-0"}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Scale className="text-emerald-400 w-6 h-6 animate-pulse" />
            <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">LDH Console</h1>
          </div>
          <span className="flex items-center gap-1.5 text-xs bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700 text-emerald-400">
            <Activity className="w-3.5 h-3.5" />
            Active
          </span>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
          {/* API Status Pill */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-400" /> OpenRouter</span>
              <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">🟢 Connected</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400" /> LDH Database</span>
              <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">🟢 Secured</span>
            </div>
          </div>

          {/* Slider Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-slate-400">
              <Sliders className="w-4 h-4 text-cyan-400" /> Settings
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Target Namespace</label>
              <select 
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-teal-500 focus:outline-none transition-colors"
              >
                <option value="case_law">Case Law Documents</option>
                <option value="statutes">Legislative Statutes</option>
                <option value="regulatory">Regulatory Guidelines</option>
                <option value="international">International Treaties</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Retrieve Depth (top_k)</span>
                <span className="text-emerald-400">{topK} Docs</span>
              </div>
              <input 
                type="range"
                min="1"
                max="15"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* Query Presets */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-slate-400">
              <BookOpen className="w-4 h-4 text-cyan-400" /> Quick Presets
            </div>
            <div className="space-y-3">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(preset.query)}
                  className="w-full text-left p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-teal-500/50 hover:bg-slate-900/50 transition-all duration-300 group cursor-pointer"
                >
                  <div className="text-xs font-semibold text-teal-400 group-hover:text-emerald-400 transition-colors">{preset.title}</div>
                  <div className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{preset.query}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Work Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Header Bar */}
        <header className="p-4 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors md:flex hidden"
            >
              <Settings className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Legal Data Hunter AI <Sparkles className="w-4 h-4 text-teal-400" />
              </h2>
              <p className="text-xs text-slate-400">Advanced Natural Language Global Legal Database Searcher</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-emerald" />
            <span className="text-xs font-medium text-slate-300">Live Agent Session</span>
          </div>
        </header>

        {/* Chat Feed Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
          {messages.map((message, index) => (
            <div 
              key={index}
              className={`flex gap-4 max-w-4xl ${message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Icon Column */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${message.role === "user" ? "bg-gradient-to-tr from-emerald-500 to-cyan-500 border-cyan-400 text-white" : "bg-slate-900 border-slate-800 text-teal-400"}`}>
                {message.role === "user" ? <MessageSquare className="w-4.5 h-4.5" /> : <Scale className="w-4.5 h-4.5" />}
              </div>

              {/* Message Body Column */}
              <div className="space-y-3 max-w-[85%]">
                <div className={`p-4.5 rounded-2xl border text-sm leading-relaxed ${message.role === "user" ? "bg-gradient-to-br from-emerald-950/40 to-teal-900/40 border-teal-800/80 text-teal-50" : "bg-slate-900/40 border-slate-800 backdrop-blur-md text-slate-100"}`}>
                  {message.content}
                </div>

                {/* Render Accordion for Search Logs if present */}
                {message.searchLogs && message.searchLogs.length > 0 && (
                  <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/80">
                    {message.searchLogs.map((log, logIdx) => {
                      const globalLogIdx = index * 100 + logIdx;
                      const isOpen = !!expandedLog[globalLogIdx];
                      return (
                        <div key={logIdx} className="border-b border-slate-850 last:border-b-0">
                          <button
                            onClick={() => toggleAccordion(globalLogIdx)}
                            className="w-full flex items-center justify-between p-3.5 text-left text-xs bg-slate-900/60 hover:bg-slate-900 text-slate-300 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Terminal className="w-4 h-4 text-emerald-400" />
                              <span>Searched <strong className="text-teal-400">"{log.namespace}"</strong> for <strong className="text-teal-400">"{log.q}"</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-emerald-955 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded-full text-[10px]">
                                {log.resultsCount} hits
                              </span>
                              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </button>

                          {isOpen && (
                            <div className="p-4 bg-slate-950 text-xs border-t border-slate-850 space-y-3.5 max-h-72 overflow-y-auto">
                              {Array.isArray(log.results) && log.results.length > 0 ? (
                                log.results.map((doc: any, docIdx: number) => (
                                  <div key={docIdx} className="p-3 rounded-lg border border-slate-900 bg-slate-900/20 space-y-1.5">
                                    <div className="font-semibold text-slate-200 flex justify-between">
                                      <span>📜 {doc.title || `Document #${docIdx + 1}`}</span>
                                      {doc.score && <span className="text-[10px] text-teal-400">Relevance: {(doc.score * 100).toFixed(0)}%</span>}
                                    </div>
                                    <p className="text-slate-400 leading-relaxed text-[11px] font-mono">{doc.snippet || doc.content || JSON.stringify(doc)}</p>
                                  </div>
                                ))
                              ) : (
                                <div className="text-slate-500 italic py-2 px-1">
                                  No direct snippets returned or database returned mock responses.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking / Loading indicator */}
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
                  <span className="text-xs text-slate-400 font-medium">Gemini is searching legal indexes...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Floating Input Area */}
        <div className="p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="max-w-4xl mx-auto flex gap-3 p-2 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl focus-within:border-teal-500/80 focus-within:shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all duration-300 relative z-10"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about legal issues or search specific namespaces (e.g. 'consumer rights violations')..."
              className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none text-slate-100 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-450 hover:to-cyan-450 text-white font-medium text-sm flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:pointer-events-none cursor-pointer"
            >
              Send <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
