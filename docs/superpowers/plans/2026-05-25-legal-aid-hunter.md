# Legal Data Hunter AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern, premium full-stack Next.js chat application using React, TypeScript, and Tailwind CSS v4 that searches global legal documents using natural language via OpenRouter (Gemini-1.5-Flash) and the Legal Data Hunter REST API.

**Architecture:** We use a full server-side tool loop. The React frontend communicates with a single Next.js Route Handler `/api/chat`. The handler coordinates with OpenRouter, handles tool requests, executes database searches using `LDH_API_KEY`, sends results back to OpenRouter, and returns the final narrative answer with detailed search logs.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, OpenAI SDK, Lucide React icons.

---

## Proposed Changes

### Tech Stack & Dependencies

#### [NEW] [package.json](file:///Users/fred/Documents/VibeCoding/antigravity/eu-researcher/package.json)
Creates the package manifest containing all necessary dependencies for Next.js, React, TypeScript, and Tailwind CSS v4.

#### [NEW] [tsconfig.json](file:///Users/fred/Documents/VibeCoding/antigravity/eu-researcher/tsconfig.json)
Configures TypeScript compilation for a modern Next.js project.

#### [NEW] [next.config.ts](file:///Users/fred/Documents/VibeCoding/antigravity/eu-researcher/next.config.ts)
Enables clean Next.js configurations.

#### [NEW] [postcss.config.mjs](file:///Users/fred/Documents/VibeCoding/antigravity/eu-researcher/postcss.config.mjs)
Integrates Tailwind CSS v4 PostCSS plugin.

#### [NEW] [.env](file:///Users/fred/Documents/VibeCoding/antigravity/eu-researcher/.env)
Configures local API environment variables.

---

### Backend Coordinator API

#### [NEW] [route.ts](file:///Users/fred/Documents/VibeCoding/antigravity/eu-researcher/app/api/chat/route.ts)
A Next.js server-side coordinator that performs the LLM and tool completion loop with OpenRouter and Legal Data Hunter API.

---

### UI/UX & Styling

#### [NEW] [globals.css](file:///Users/fred/Documents/VibeCoding/antigravity/eu-researcher/app/globals.css)
Initializes Tailwind CSS v4 and defines key variable-based animations.

#### [NEW] [layout.tsx](file:///Users/fred/Documents/VibeCoding/antigravity/eu-researcher/app/layout.tsx)
Sets up the responsive root layout with custom modern Google Fonts ("Outfit" or "Inter").

#### [NEW] [page.tsx](file:///Users/fred/Documents/VibeCoding/antigravity/eu-researcher/app/page.tsx)
A premium dashboard layout providing an interactive chat interface, an expandable search accordion, a custom loading wave, and a sidebar for settings and preset searches.

---

## Implementation Tasks

### Task 1: Environment & Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `.env`

- [ ] **Step 1: Write `package.json`**
  ```json
  {
    "name": "eu-researcher",
    "version": "1.0.0",
    "private": true,
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint"
    },
    "dependencies": {
      "next": "^15.0.3",
      "react": "^19.0.0-rc.0",
      "react-dom": "^19.0.0-rc.0",
      "openai": "^4.73.0",
      "lucide-react": "^0.460.0"
    },
    "devDependencies": {
      "typescript": "^5.6.3",
      "@types/node": "^22.9.0",
      "@types/react": "^19.0.0-rc.0",
      "@types/react-dom": "^19.0.0-rc.0",
      "postcss": "^8.4.49",
      "tailwindcss": "^4.0.0-alpha.30",
      "@tailwindcss/postcss": "^4.0.0-alpha.30"
    }
  }
  ```

- [ ] **Step 2: Write `tsconfig.json`**
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "lib": ["dom", "dom.iterable", "esnext"],
      "allowJs": true,
      "skipLibCheck": true,
      "strict": true,
      "noEmit": true,
      "esModuleInterop": true,
      "module": "esnext",
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve",
      "incremental": true,
      "plugins": [
        {
          "name": "next"
        }
      ],
      "paths": {
        "@/*": ["./*"]
      }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
  }
  ```

- [ ] **Step 3: Write `next.config.ts`**
  ```typescript
  import type { NextConfig } from "next";

  const nextConfig: NextConfig = {
    reactStrictMode: true,
  };

  export default nextConfig;
  ```

- [ ] **Step 4: Write `postcss.config.mjs`**
  ```javascript
  const config = {
    plugins: {
      "@tailwindcss/postcss": {},
    },
  };
  export default config;
  ```

- [ ] **Step 5: Write `.env`**
  Write configuration with the user's provided API keys:
  ```env
  OPENROUTER_API_KEY=your_openrouter_api_key
  LDH_API_KEY=your_optional_ldh_api_key
  ```

- [ ] **Step 6: Initialize Git and Commit**
  Run:
  ```bash
  git init && git add package.json tsconfig.json next.config.ts postcss.config.mjs .env && git commit -m "chore: initial project configuration"
  ```
  Expected: Commit successfully completed.

---

### Task 2: Core Styling & Tailwind CSS v4 Initialization

**Files:**
- Create: `app/globals.css`

- [ ] **Step 1: Write `app/globals.css`**
  Setup CSS-first Tailwind CSS v4 and key pulse/animation definitions:
  ```css
  @import "tailwindcss";

  @layer base {
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

  .pulse-emerald {
    animation: pulseGlow 2s infinite ease-in-out;
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

- [ ] **Step 2: Commit styling setup**
  Run:
  ```bash
  git add app/globals.css && git commit -m "style: initialize Tailwind v4 and dynamic custom styles"
  ```
  Expected: Style initialization committed.

---

### Task 3: Backend API route coordinator

**Files:**
- Create: `app/api/chat/route.ts`

- [ ] **Step 1: Write the coordinator logic**
  Implement OpenRouter interaction, automatic function calling, and structured logging in `app/api/chat/route.ts`:
  ```typescript
  import { NextResponse } from "next/server";
  import OpenAI from "openai";

  // Prevent handler caching
  export const dynamic = "force-dynamic";

  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || "",
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://legaldatahunter.com",
      "X-Title": "Legal Data Hunter AI",
    },
  });

  const searchTool: OpenAI.Chat.Completions.ChatCompletionTool = {
    type: "function",
    function: {
      name: "search_legal_data",
      description: "Searches the legal database for specific concepts, precedents, statutes, cases, or laws matching a query.",
      parameters: {
        type: "object",
        properties: {
          q: {
            type: "string",
            description: "The specific legal concept or query to search (e.g. 'fiduciary duty breach damages')."
          },
          namespace: {
            type: "string",
            description: "The targeted legal namespace. Defaults to 'case_law'."
          },
          top_k: {
            type: "integer",
            description: "Number of relevant documents to retrieve. Defaults to 5."
          }
        },
        required: ["q"]
      }
    }
  };

  async function callLegalDataHunterAPI(q: string, namespace: string = "case_law", top_k: number = 5) {
    const apiKey = process.env.LDH_API_KEY || "";
    try {
      const response = await fetch("https://legaldatahunter.com/v1/search", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ q, namespace, top_k })
      });

      if (!response.ok) {
        throw new Error(`LDH API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("Legal Data Hunter Fetch Error:", error);
      return { error: error.message || "Failed to contact LDH database." };
    }
  }

  export async function POST(req: Request) {
    try {
      const { messages, defaultNamespace = "case_law", defaultTopK = 5 } = await req.json();

      if (!messages || !Array.isArray(messages)) {
        return NextResponse.json({ error: "Missing messages array." }, { status: 400 });
      }

      const searchLogs: any[] = [];

      // Step 1: Initial call to OpenRouter specifying the search tool
      let response = await openai.chat.completions.create({
        model: "google/gemini-flash-1.5",
        messages: messages,
        tools: [searchTool],
        tool_choice: "auto"
      });

      let assistantMessage = response.choices[0].message;

      // Step 2: Handle function calls if Gemini requests it
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const updatedMessages = [...messages, assistantMessage];

        for (const toolCall of assistantMessage.tool_calls) {
          if (toolCall.function.name === "search_legal_data") {
            const args = JSON.parse(toolCall.function.arguments);
            const query = args.q;
            const namespace = args.namespace || defaultNamespace;
            const top_k = args.top_k || defaultTopK;

            // Execute the backend API request
            const searchResult = await callLegalDataHunterAPI(query, namespace, top_k);

            searchLogs.push({
              q: query,
              namespace,
              top_k,
              success: !searchResult.error,
              resultsCount: Array.isArray(searchResult) ? searchResult.length : 0,
              results: searchResult
            });

            // Append the tool result to the conversation
            updatedMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(searchResult)
            });
          }
        }

        // Step 3: Call OpenRouter again with the search results
        const finalResponse = await openai.chat.completions.create({
          model: "google/gemini-flash-1.5",
          messages: updatedMessages
        });

        assistantMessage = finalResponse.choices[0].message;
      }

      return NextResponse.json({
        content: assistantMessage.content || "No text response generated.",
        searchLogs
      });

    } catch (error: any) {
      console.error("Route Coordinator Error:", error);
      return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
    }
  }
  ```

- [ ] **Step 2: Commit API Route**
  Run:
  ```bash
  git add app/api/chat/route.ts && git commit -m "feat: implement backend API chat route with automatic function calling loop"
  ```
  Expected: API Route committed.

---

### Task 4: Root Layout Setup

**Files:**
- Create: `app/layout.tsx`

- [ ] **Step 1: Write `app/layout.tsx`**
  Integrate beautiful modern metadata and Google Fonts:
  ```typescript
  import type { Metadata } from "next";
  import "./globals.css";

  export const metadata: Metadata = {
    title: "Legal Data Hunter AI",
    description: "Search global legal case law and documents using advanced natural language intelligence.",
  };

  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body className="antialiased min-h-screen bg-slate-950 text-slate-100 flex flex-col">
          {children}
        </body>
      </html>
    );
  }
  ```

- [ ] **Step 2: Commit Layout**
  Run:
  ```bash
  git add app/layout.tsx && git commit -m "feat: establish root layout with Outfit typography"
  ```
  Expected: Layout setup committed.

---

### Task 5: Interactive Chat UI & settings Dashboard

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: Write `app/page.tsx`**
  Develop a stunning glassmorphic UI using Tailwind CSS v4, dynamic configuration slider sidebar, and instant preset cards.
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-teal-500 focus:outline-none transition-colors"
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
                  onChange={(e) => setK(parseInt(e.target.value))}
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
                                <span className="bg-emerald-950 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded-full text-[10px]">
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
  ```

- [ ] **Step 2: Commit Interactive UI**
  Run:
  ```bash
  git add app/page.tsx && git commit -m "feat: complete interactive frontend chat client with customizable legal database sliders"
  ```
  Expected: Chat Page committed.

---

## Verification Plan

### Automated Build Checks
To verify the TypeScript definitions, styling integration, and compilation correctness:
```bash
npm run build
```
Expected: The application compiles with zero build errors and generates optimized route chunks.

### Manual Verification
1. **API Keys Security Test**:
   Verify that no credentials leak to the client by opening chrome devtools, navigating to the Network tab, firing a query, and inspecting the JSON payload returned by `/api/chat`.
2. **Dynamic Namespace Test**:
   Adjust the Target Namespace dropdown to `"Statutes"` and input the query: `"Find legislation about biosecurity data leakage control."` Check that the Search Log accordion expands and verifies the correct parameters were fired.
3. **Preset Searches**:
   Click on the preset card `"Data Privacy Protection"` and ensure the query immediately populates, submits, and successfully yields structured legal results.
