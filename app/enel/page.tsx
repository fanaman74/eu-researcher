"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Download, Sparkles } from "lucide-react";
import { AiLabel, Button, Card, EmptyState, ErrorState, Loading, Page, Segmented, SourceNote, formatDate } from "@/components/ui";
import { downloadDocx } from "@/lib/exportBriefing";
import { type Consultation, type EnelBrief, type EurLexHit, type ParliamentQuestion } from "@/lib/types";

type FeedTab = "questions" | "consultations" | "state_aid";
type Depth = "standard" | "in-depth";

const FEEDS: { key: FeedTab; label: string; url: string; map: (data: any) => EnelBrief[] }[] = [
  {
    key: "questions",
    label: "MEP questions",
    url: "/api/parliament",
    map: (d) =>
      (d.questions || []).slice(0, 8).map((q: ParliamentQuestion) => ({ id: q.id, title: q.title, type: q.status, date: q.date, source: `MEP question by ${q.askedBy}`, url: q.url })),
  },
  {
    key: "consultations",
    label: "Consultations",
    url: "/api/have-your-say",
    map: (d) =>
      (d.consultations || []).slice(0, 8).map((c: Consultation) => ({
        id: `hys-${c.pid}`,
        title: c.title,
        type: c.status.startsWith("Open") ? "Open consultation" : "Closed consultation",
        date: c.closingDate ?? "",
        source: "Have Your Say",
        url: c.url,
      })),
  },
  {
    key: "state_aid",
    label: "State aid rulings",
    url: "/api/eurlex?q=state aid energy&top_k=8",
    map: (d) =>
      (d.hits || []).map((h: EurLexHit) => ({
        id: h.id,
        title: h.title,
        type: h.sector,
        date: /Document Date: (\d{4}-\d{2}-\d{2})/.exec(h.snippet)?.[1] ?? "",
        source: "EUR-Lex",
        url: h.url,
      })),
  },
];

const prompt = (b: EnelBrief, depth: Depth) =>
  depth === "in-depth"
    ? `Draft an extremely comprehensive strategic briefing playbook (approximately 1,200 words) on lobbying risks. Focus on this topic: "${b.title}" (Type: ${b.type}, Source: ${b.source}) in Brussels public affairs context.
       Include: 1. EXECUTIVE SUMMARY & STRATEGIC RATIONALE, 2. DETAILED REGULATORY CONTEXT & POLICY THREATS, 3. HISTORICAL PRECEDENTS, 4. IMPACT EVALUATION ON ENERGY PORTFOLIOS, 5. ADVOCACY RECOMMENDATIONS.`
    : `Draft a detailed executive briefing paper on public affairs policy risks. Topic: "${b.title}" (Type: ${b.type}, Source: ${b.source}). List policy threats and counter-advocacy recommendations.`;

/** Follow-up questions the model suggests, as "[Option: …]" lines or numbered questions. */
function followUps(text: string): string[] {
  const found: string[] = [];
  for (const line of text.split("\n").map((l) => l.trim())) {
    const option = /^\[Option:\s*([\s\S]+?)\]$/i.exec(line)?.[1];
    const question = /^[-*\d.]+\s+["']?((What|How|Why|Is|Can|Are|Should|Will|Could|Would|Which|Who|Where|When)[\s\S]+\?)["']?$/i.exec(line)?.[1];
    const q = (option ?? question)?.trim();
    if (q && !found.includes(q)) found.push(q);
  }
  return found.slice(0, 5);
}

async function ask(content: string): Promise<string> {
  const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content }] }) });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()).content;
}

export default function BriefingDrafterPage() {
  const [tab, setTab] = useState<FeedTab>("questions");
  const [feeds, setFeeds] = useState<Partial<Record<FeedTab, EnelBrief[]>>>({});
  const [feedError, setFeedError] = useState<Partial<Record<FeedTab, boolean>>>({});
  const [selected, setSelected] = useState<EnelBrief | null>(null);
  const [depth, setDepth] = useState<Depth>("standard");
  const [report, setReport] = useState("");
  const [mainReport, setMainReport] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const loadFeed = async (key: FeedTab) => {
    const feed = FEEDS.find((f) => f.key === key)!;
    setFeedError((e) => ({ ...e, [key]: false }));
    try {
      const res = await fetch(feed.url);
      if (!res.ok) throw new Error(String(res.status));
      const items = feed.map(await res.json());
      setFeeds((f) => ({ ...f, [key]: items }));
    } catch {
      setFeedError((e) => ({ ...e, [key]: true }));
    }
  };

  useEffect(() => {
    if (!feeds[tab] && !feedError[tab]) loadFeed(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const run = async (content: string, keepMain: boolean) => {
    setBusy(true);
    setFailed(false);
    if (!keepMain) setMainReport("");
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    try {
      setReport(await ask(content));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const draft = () => selected && run(prompt(selected, depth), false);
  const followUp = (q: string) => {
    if (!mainReport) setMainReport(report);
    run(`Provide a detailed, expert-level response answering this follow-up question: "${q}". Keep context focused on EU regulatory policy and corporate public affairs. Use headings and add a closing section called "STRATEGIC RECOMMENDATION".`, true);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const word = () =>
    selected &&
    downloadDocx({
      title: `Briefing — ${selected.title}`,
      subtitle: `${selected.source} · AI-generated draft, ${formatDate(new Date().toISOString().slice(0, 10))}`,
      sections: [{ heading: "Draft", lines: report.split("\n").filter((l) => l.trim()) }],
      source: "AI-generated draft. Check every statement against the original sources before use.",
    });

  const items = feeds[tab];
  const questions = report ? followUps(report) : [];

  return (
    <Page>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 items-start">
        <Card title="1. Choose an item">
          <div className="space-y-4">
            <Segmented label="Source" options={FEEDS.map((f) => ({ value: f.key, label: f.label }))} value={tab} onChange={setTab} />
            {feedError[tab] ? (
              <ErrorState onRetry={() => loadFeed(tab)} />
            ) : !items ? (
              <Loading message="Loading recent items…" rows={4} />
            ) : items.length === 0 ? (
              <EmptyState title="Nothing to show" />
            ) : (
              <ul className="space-y-2" aria-label="Items">
                {items.map((b) => {
                  const isSelected = selected?.id === b.id && selected?.source === b.source;
                  return (
                    <li key={`${tab}-${b.id}`}>
                      <button
                        type="button"
                        onClick={() => setSelected(b)}
                        aria-pressed={isSelected}
                        className={`group w-full text-left border-t py-2.5 ${isSelected ? "border-line-strong" : "border-line"}`}
                      >
                        <span className={`block text-fg group-hover:underline ${isSelected ? "font-bold" : "font-medium"}`}>{isSelected && <span className="inline-block w-2 h-2 mr-2 bg-marker align-middle" aria-hidden="true" />}{b.title}</span>
                        <span className="block text-sm text-subtle mt-0.5">{b.type}{b.date && ` · ${formatDate(b.date)}`} · {b.source}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        <div ref={resultRef} className="space-y-4 scroll-mt-6">
          <Card title="2. Draft the briefing">
            {selected ? (
              <div className="space-y-4">
                <p className="text-base text-fg"><span className="text-subtle">Topic: </span>{selected.title}</p>
                <Segmented label="Length" options={[{ value: "standard", label: "Standard briefing" }, { value: "in-depth", label: "In-depth (about 1,200 words)" }]} value={depth} onChange={setDepth} />
                <Button variant="primary" onClick={draft} loading={busy}>
                  <Sparkles className="w-4 h-4" aria-hidden="true" /> {report ? "Draft again" : "Draft briefing"}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted">Choose an item on the left first.</p>
            )}
          </Card>

          {(busy || report || failed) && (
            <Card
              title="Draft"
              actions={
                report && !busy && (
                  <>
                    <span role="status" className="sr-only">{copied ? "Draft copied" : ""}</span>
                    <Button size="sm" onClick={copy}>{copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />} {copied ? "Copied" : "Copy"}</Button>
                    <Button size="sm" onClick={word}><Download className="w-4 h-4" aria-hidden="true" /> Word</Button>
                  </>
                )
              }
            >
              <div aria-live="polite" className="space-y-4">
                {mainReport && !busy && (
                  <Button size="sm" variant="ghost" onClick={() => { setReport(mainReport); setMainReport(""); }}>
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to the main briefing
                  </Button>
                )}
                {busy ? (
                  <Loading message="Writing the draft…" slow="An in-depth briefing can take up to a minute." rows={4} />
                ) : failed ? (
                  <ErrorState title="The draft could not be written" message="The AI service did not respond. Try again in a moment." onRetry={draft} />
                ) : (
                  <>
                    <AiLabel />
                    <div className="text-base text-fg whitespace-pre-wrap max-w-prose">{report}</div>
                    {questions.length > 0 && (
                      <div className="space-y-2 border-t border-line pt-4">
                        <h3 className="text-sm font-semibold text-fg">Explore further</h3>
                        <div className="flex flex-col items-start gap-2">
                          {questions.map((q) => <Button key={q} size="sm" variant="ghost" className="text-left" onClick={() => followUp(q)}>{q}</Button>)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      <SourceNote>Drafts are written by an AI model from the item&apos;s title and type only. They are a starting point, not analysis; check every claim.</SourceNote>
    </Page>
  );
}
