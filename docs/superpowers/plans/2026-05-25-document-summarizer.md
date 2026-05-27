# Senior EU Lawyer Case Summarizer Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a legal document summarizer featuring a Next.js server route `/api/summarize` representing a Senior EU Lawyer agent, and an interactive pop-up modal in `app/page.tsx` displaying the drafted 1000-word legal analysis alongside Copy and Save (download as `.txt`) controls.

**Architecture:** We will build a new Route Handler `/app/api/summarize/route.ts` which calls OpenRouter (`deepseek/deepseek-v4-flash`) with a strict expert system prompt to generate a highly detailed ~1000-word case analysis. On the frontend, clicking "Summarise" in a document's table row launches a full-viewport overlay modal showing loading indicators and rendering the scrollable legal text.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, OpenAI SDK, Lucide Icons.

---

## Proposed Changes

### Backend API Route

#### [NEW] [route.ts](file:///Users/fred/Documents/VibeCoding/antigravity/eu-researcher/app/api/summarize/route.ts)
Create `/app/api/summarize/route.ts` to coordinate with OpenRouter and prompt DeepSeek for senior legal summaries of selected documents.

---

### Dashboard Redesign

#### [MODIFY] [page.tsx](file:///Users/fred/Documents/VibeCoding/antigravity/eu-researcher/app/page.tsx)
- Add "Summarise" button inside each document table row.
- Integrate modal state managers (`modalOpen`, `summarizing`, `activeSummaryDoc`, `summaryText`).
- Implement `handleSummarize` API caller and file downloader logic.
- Render the custom floating overlay modal overlaying the main viewport.

---

## Implementation Tasks

### Task 1: Create the Summarize Route Handler

**Files:**
- Create: `app/api/summarize/route.ts`

- [ ] **Step 1: Write `app/api/summarize/route.ts`**
  Setup OpenAI client pointing to OpenRouter with DeepSeek and draft the rigorous legal system instructions:
  ```typescript
  import { NextResponse } from "next/server";
  import OpenAI from "openai";

  export const dynamic = "force-dynamic";

  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || "",
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://legaldatahunter.com",
      "X-Title": "Legal Data Hunter AI",
    },
  });

  export async function POST(req: Request) {
    try {
      const { title, snippet, namespace } = await req.json();

      if (!title || !snippet) {
        return NextResponse.json({ error: "Missing title or snippet." }, { status: 400 });
      }

      const systemPrompt = `You are a Senior European Union Lawyer and expert legal analyst.
Your objective is to write a highly comprehensive, professional, and rigorous legal case summary of approximately 1000 words based on the legal document provided.
The summary must focus strictly on the case, its background, and implications under European Union law.

You must structure your summary with these sections:
1. CASE CITATION & IDENTIFICATION
   - Document Title
   - Database Namespace (e.g. case_law, statutes, regulatory)
   - Source context.
2. CORE FACTS OF THE DISPUTE
   - Complete factual background and timelines of the dispute.
   - The primary parties involved and their legal contentions.
3. KEY LEGAL ISSUES & DIRECTIVES
   - Core legal questions raised under European Union law.
   - Specific EU Directives, Regulations, or Treaty Articles involved (e.g. GDPR, Pay Equity, Environmental Liability).
4. COURT'S RATIONALE & HOLDING
   - The detailed legal reasoning of the court.
   - Critical legal precedents analyzed.
   - The final binding holding and orders.
5. STRATEGIC IMPLICATIONS FOR EU LAW
   - Broad impact on European Union jurisprudence.
   - Practical consequences for member states, corporations, or individuals.

Maintain a formal, authoritative, and sophisticated legal tone. Present the summary with clear spacing and paragraph divisions.`;

      const userMessage = `Please draft the comprehensive case summary for the following European document:

Title: ${title}
Namespace: ${namespace || "case_law"}
Content/Snippet: ${snippet}`;

      const response = await openai.chat.completions.create({
        model: "deepseek/deepseek-v4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ]
      });

      const summaryText = response.choices[0].message.content || "Failed to generate legal summary.";

      return NextResponse.json({ summary: summaryText });

    } catch (error: any) {
      console.error("Summarize Route Error:", error);
      return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
    }
  }
  ```

- [ ] **Step 2: Commit Summarize API Handler**
  Run:
  ```bash
  git add app/api/summarize/route.ts && git commit -m "feat: add secure /api/summarize endpoint driven by DeepSeek EU Lawyer agent"
  ```
  Expected: Endpoint handler committed successfully.

---

### Task 2: UI Integration & Modal Components

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Write UI enhancements and modal panel in `app/page.tsx`**
  Update `app/page.tsx` to add states, summarizer triggers, downloaders, Action row buttons, and the visual modal overlay:
  ```typescript
  // Replace the entire page.tsx file or use targeted changes. Let's provide the updated page.tsx with modal implementation:
  // (Full file details below)
  ```
  Wait! Let's write the complete code of the new `app/page.tsx` in this plan task so it contains zero placeholders.
  Let's add state variables right inside `ChatPage()` component:
  ```typescript
    // Summarizer Modal States
    const [modalOpen, setModalOpen] = useState(false);
    const [activeSummaryDoc, setActiveSummaryDoc] = useState<{ title: string; snippet: string; namespace: string } | null>(null);
    const [summaryText, setSummaryText] = useState("");
    const [summarizing, setSummarizing] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
  ```
  And `handleSummarize` function:
  ```typescript
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
  ```
  And text downloader:
  ```typescript
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
  ```
  And clipboard copy:
  ```typescript
    const copyToClipboard = () => {
      if (!summaryText) return;
      navigator.clipboard.writeText(summaryText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    };
  ```
  And inside the `table` Action cell, we add:
  ```typescript
    <div className="flex items-center justify-center gap-3">
      <a 
        href={targetLink}
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-teal-400 hover:text-emerald-400 hover:underline transition-colors font-medium cursor-pointer"
      >
        Link <ExternalLink className="w-3.5 h-3.5" />
      </a>
      <button 
        onClick={() => handleSummarize(doc.title, doc.snippet, log.namespace)}
        className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-teal-400 hover:underline transition-colors font-medium cursor-pointer"
      >
        Summarise <Sparkles className="w-3.5 h-3.5" />
      </button>
    </div>
  ```
  And at the bottom of the Page component, we render the gorgeous Modal:
  ```typescript
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
                  <div className="w-12 h-12 rounded-xl border border-slate-800 bg-slate-950/50 flex items-center justify-center text-emerald-400 animate-spin">
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
              <div className="text-sm text-slate-350 leading-relaxed font-sans whitespace-pre-line space-y-4 pr-1">
                {summaryText}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="border-t border-slate-800 pt-4 flex gap-3 justify-end flex-wrap">
            <button
              onClick={copyToClipboard}
              disabled={summarizing || !summaryText}
              className="px-5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {copySuccess ? "✓ Copied!" : "Copy Summary"}
            </button>
            <button
              onClick={downloadSummary}
              disabled={summarizing || !summaryText}
              className="px-5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
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
  ```

- [ ] **Step 2: Commit complete page redesign**
  Run:
  ```bash
  git add app/page.tsx && git commit -m "feat: integrate Senior EU Lawyer Summariser button, pop-up modal, clipboard copy, and text downloader"
  ```
  Expected: Complete UI and summarization controls successfully committed.

---

## Verification Plan

### Automated Compilation Check
```bash
npm run build
```
Expected: Zero build-time compilation warnings or TypeScript type errors.

### Manual Verification
1. **Button Presence Check**:
   Confirm that each document row in the search results table renders both a "Link" anchor and a sparkling "Summarise" action button.
2. **Drafting Loading Indicator**:
   Click "Summarise" on a preset search result (e.g. GDPR Data Protection). Ensure the modal immediately displays in the viewport, showing the scale spinner animation and legal drafting sub-text.
3. **1000-Word Legal Analysis**:
   Verify that once loading completes:
   - The panel displays a comprehensive, structured legal summary.
   - Structured sections (Case Citation, Dispute Facts, EU Directives, Holdings, and Jurisprudential Impact) render clearly.
4. **Copy & Save Functions**:
   - Click "Copy Summary" and verify clipboard content matches.
   - Click "Save Summary (.txt)" and verify a `.txt` file containing the summary text downloads correctly onto your system.
