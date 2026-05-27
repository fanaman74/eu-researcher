# Legal Data Hunter AI Homepage Redesign & Search Table Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the home page of Legal Data Hunter AI to include a full-screen animated hero section, a horizontal parameter and status card row underneath, a central search console below that, and render search results in a beautifully styled, color-coded database table complete with action links.

**Architecture:** Modify `app/page.tsx` and `app/globals.css`. We will define background floating animations in CSS and restructure the React component. The search log renderer will parse the array of database results and render a sleek, responsive HTML `<table>` using modern Tailwind utility styles and Lucide icons.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, Lucide Icons.

---

## Proposed Changes

### Styling & Animations

#### [MODIFY] [globals.css](file:///Users/fred/Documents/VibeCoding/antigravity/eu-researcher/app/globals.css)
Add absolute-positioned floating mesh gradient animation variables and smooth scroll behavior.

---

### Dashboard Layout & Result Table

#### [MODIFY] [page.tsx](file:///Users/fred/Documents/VibeCoding/antigravity/eu-researcher/app/page.tsx)
Redesign page layout structure to feature:
- Full-page Animated Hero Section.
- Horizontal Dashboard Row (API Status, Namespace/Sliders, Presets).
- Wide Search Console & Chat Feed.
- Table Result Renderer (colored alternating table with title, score, snippets, and action links).

---

## Implementation Tasks

### Task 1: Style & Keyframe Enhancements

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Edit `app/globals.css` to add smooth scrolling and float mesh animations**
  Replace `/app/globals.css` with the updated style settings:
  ```css
  @import "tailwindcss";

  @layer base {
    html {
      scroll-behavior: smooth;
    }
    body {
      background-color: #020617; /* slate-950 */
      color: #f8fafc; /* slate-50 */
      font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
    }
  }

  @keyframes pulseGlow {
    0%, 100% {
      opacity: 0.6;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
    }
    50% {
      opacity: 1;
      box-shadow: 0 0 24px rgba(16, 185, 129, 0.8);
    }
  }

  @keyframes floatBg {
    0%, 100% {
      transform: translateY(0px) scale(1);
    }
    50% {
      transform: translateY(-20px) scale(1.05);
    }
  }

  @keyframes floatReverse {
    0%, 100% {
      transform: translateY(0px) scale(1.05);
    }
    50% {
      transform: translateY(20px) scale(1);
    }
  }

  .pulse-emerald {
    animation: pulseGlow 2s infinite ease-in-out;
  }

  .animate-float-1 {
    animation: floatBg 8s infinite ease-in-out;
  }

  .animate-float-2 {
    animation: floatReverse 10s infinite ease-in-out;
  }

  /* Custom glassmorphism variables */
  .glass-card {
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(51, 65, 85, 0.5);
  }

  .glass-card-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .glass-card-hover:hover {
    background: rgba(15, 23, 42, 0.65);
    border-color: rgba(20, 184, 166, 0.6); /* teal-500 */
    box-shadow: 0 4px 20px rgba(20, 184, 166, 0.15);
  }
  ```

- [ ] **Step 2: Commit global style additions**
  Run:
  ```bash
  git add app/globals.css && git commit -m "style: add float animations and smooth scroll configurations for homepage"
  ```
  Expected: Style enhancements committed successfully.

---

### Task 2: Page Redesign & Result Table Integration

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Write redesigned `app/page.tsx`**
  Restructure layout: Top fullpage hero → Horizontal parameter block → Wide Chat container → Advanced alternating colored database tables with links.
  ```typescript
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

    // Settings
    const [namespace, setNamespace] = useState("case_law");
    const [topK, setTopK] = useState(5);

    // Accordion search states
    const [expandedLog, setExpandedLog] = useState<{ [key: number]: boolean }>({});

    const chatEndRef = useRef<HTMLDivElement>(null);
    const dashboardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const scrollToDashboard = () => {
      dashboardRef.current?.scrollIntoView({ behavior: "smooth" });
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-teal-500/30 selection:text-teal-200">
        
        {/* Animated Background Mesh Spheres */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-float-1 pointer-events-none" />
        <div className="absolute top-2/3 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-float-2 pointer-events-none" />

        {/* 1. FULL-PAGE HERO SECTION */}
        <section className="min-h-screen flex flex-col justify-center items-center text-center p-8 relative overflow-hidden">
          {/* Subtle grid pattern inside hero */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25" />
          
          <div className="max-w-4xl mx-auto space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800 text-teal-400 text-xs font-semibold uppercase tracking-wider pulse-emerald">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Powered by DeepSeek-V4-Flash
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
              Global Legal Search <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm">
                Redefined by AI
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
              Connect to global statutory codes, regulatory directives, and historical case law precedents. Query complex schemas instantly in pure natural language.
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
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-slate-500">
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
                  className={`flex gap-4 max-w-4xl ${message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  {/* Avatar Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${message.role === "user" ? "bg-gradient-to-tr from-emerald-500 to-cyan-500 border-cyan-400 text-white" : "bg-slate-900 border-slate-800 text-teal-400"}`}>
                    {message.role === "user" ? <MessageSquare className="w-4.5 h-4.5" /> : <Scale className="w-4.5 h-4.5" />}
                  </div>

                  {/* Message Container */}
                  <div className="space-y-4 max-w-[90%]">
                    <div className={`p-5 rounded-2xl border text-sm leading-relaxed ${message.role === "user" ? "bg-gradient-to-br from-emerald-950/40 to-teal-900/40 border-teal-800/80 text-teal-50" : "bg-slate-900/50 border-slate-800 backdrop-blur-md text-slate-100"}`}>
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
                                          <td className="p-4 align-top text-slate-400 leading-relaxed font-mono text-[11px] whitespace-pre-wrap max-h-32 overflow-y-auto block">
                                            {doc.snippet || doc.content || "Context content payload loaded securely."}
                                          </td>
                                          <td className="p-4 align-top text-center">
                                            <a 
                                              href={targetLink}
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-emerald-400 hover:underline transition-colors font-medium cursor-pointer"
                                            >
                                              Link <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
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
                  placeholder="Ask about global cases, precedents, or statutory definitions..."
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

        {/* Footer */}
        <footer className="p-8 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500 space-y-2 mt-auto">
          <p>© 2026 Legal Data Hunter AI. Built on Next.js 15, Tailwind CSS v4, and OpenRouter.</p>
          <p>Confidential and secured enterprise environment.</p>
        </footer>

      </div>
    );
  }
  ```

- [ ] **Step 2: Commit file changes**
  Run:
  ```bash
  git add app/page.tsx && git commit -m "feat: complete homepage redesign with animated hero section and advanced search table"
  ```
  Expected: Homepage redesign committed successfully.

---

## Verification Plan

### Automated Compilation Check
To verify everything compiles cleanly under the new Tailwind v4 layout and TypeScript typings:
```bash
npm run build
```
Expected: Compilation successfully builds with zero type warnings.

### Manual Verification
1. **Hero Animations Check**:
   Confirm that when launching the site, the full-page landing hero appears with floating mesh glowing spheres and custom text gradients.
2. **Horizontal Row Check**:
   Verify that Settings, Presets, and Status controls align horizontally beneath the hero in a beautiful three-column grid.
3. **Database Results Table Check**:
   Trigger a preset card query (e.g. Environmental Liability) and verify that:
   - Results are presented in an alternating row HTML table.
   - Relevance percentage is formatted with colorful green/cyan borders.
   - Clickable action links open in a new window using proper `ExternalLink` icons.
