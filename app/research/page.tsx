"use client";

import React, { useEffect, useRef, useState } from "react";
import { RotateCcw, Send, Sparkles } from "lucide-react";
import { Badge, Button, ButtonLink, Card, Field, Page, SourceNote, inputClass } from "@/components/ui";
import SummarizerModal from "@/components/SummarizerModal";
import { type EurLexHit, type Message, type SearchLog, type SummarizerConfig } from "@/lib/types";

const GREETING: Message = {
  role: "assistant",
  content:
    "Ask a question about EU law in plain language. I search EUR-Lex for regulations, directives, decisions and court judgments, and answer from what I find, with links to the documents.",
};

const EXAMPLES = [
  "What does EU law say about network tariffs for electricity?",
  "Which court cases deal with state aid for renewable energy?",
  "How are grid connection rules set in the electricity market regulation?",
];

/** Splits the assistant's "[Option: …]" follow-up suggestions from its text. */
function parseOptions(content: string): { text: string; options: string[] } {
  const options = [...content.matchAll(/\[Option:\s*(.*?)\]/gi)].map((m) => m[1].trim());
  return { text: content.replace(/\[Option:\s*(.*?)\]/gi, "").trim(), options };
}

function Sources({ logs, onSummarize }: { logs: SearchLog[]; onSummarize: (doc: EurLexHit, namespace: string) => void }) {
  const docs = logs.flatMap((l) => (Array.isArray(l.results) ? l.results.map((d) => ({ d, ns: l.namespace })) : []));
  if (docs.length === 0) return null;
  return (
    <details className="rounded-md border border-line bg-surface">
      <summary className="px-4 py-3 min-h-11 text-sm font-medium text-fg">Documents consulted ({docs.length})</summary>
      <ul className="divide-y divide-line border-t border-line">
        {docs.map(({ d, ns }, i) => (
          <li key={`${d.id}-${i}`} className="p-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-subtle">
              {d.sector && <Badge>{d.sector}</Badge>}
              <span className="font-mono text-xs">{d.id}</span>
            </div>
            <p className="text-sm font-medium text-fg">{d.title}</p>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={d.url || `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${d.id}`} external size="sm">Official record</ButtonLink>
              <Button size="sm" variant="ghost" onClick={() => onSummarize(d, ns)}><Sparkles className="w-4 h-4" aria-hidden="true" /> AI summary</Button>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function ResearchPage() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [topK, setTopK] = useState(5);
  const [activeDoc, setActiveDoc] = useState<SummarizerConfig | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 1) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const send = async (text = input) => {
    const question = text.trim();
    if (!question || loading) return;
    setInput("");
    setLoading(true);
    const next = [...messages, { role: "user" as const, content: question }];
    setMessages(next);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })), defaultNamespace: "all", defaultTopK: topK }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.content, searchLogs: data.searchLogs }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I could not answer that. The AI service did not respond; please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([GREETING]);
    setInput("");
  };

  return (
    <Page actions={messages.length > 1 && <Button onClick={reset}><RotateCcw className="w-4 h-4" aria-hidden="true" /> New conversation</Button>}>
      <Card padded={false}>
        <div className="p-4 sm:p-5 space-y-6 min-h-[22rem]" aria-live="polite">
          {messages.map((m, i) => {
            if (m.role === "user") {
              return (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] border border-line-strong px-4 py-3 font-serif text-lg font-semibold whitespace-pre-wrap">{m.content}</p>
                </div>
              );
            }
            const { text, options } = parseOptions(m.content);
            return (
              <div key={i} className="max-w-3xl space-y-3">
                {i > 0 && <Badge tone="warning">AI answer — check the documents it cites</Badge>}
                <p className="text-base text-fg whitespace-pre-wrap">{text}</p>
                {options.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {options.map((o) => <Button key={o} size="sm" onClick={() => send(o)} disabled={loading}>{o}</Button>)}
                  </div>
                )}
                {m.searchLogs && m.searchLogs.length > 0 && (
                  <Sources logs={m.searchLogs} onSummarize={(d, ns) => setActiveDoc({ title: d.title, snippet: d.snippet, namespace: ns, celex: d.id })} />
                )}
              </div>
            );
          })}
          {messages.length === 1 && (
            <div className="space-y-2">
              <p className="text-sm text-muted">Try one of these:</p>
              <div className="flex flex-col items-start gap-2">
                {EXAMPLES.map((e) => <Button key={e} size="sm" variant="ghost" onClick={() => send(e)}>{e}</Button>)}
              </div>
            </div>
          )}
          {loading && <p className="text-sm text-muted" role="status">Searching EUR-Lex and writing an answer… this can take up to a minute.</p>}
          <div ref={endRef} />
        </div>

        <form
          className="border-t border-line p-4 sm:p-5 grid grid-cols-1 md:grid-cols-[1fr_14rem_auto] gap-3 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <Field label="Your question">
            {(p) => (
              <textarea
                {...p}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder="Ask about EU rules, directives or court cases"
                className={`${inputClass} py-2.5 resize-y`}
              />
            )}
          </Field>
          <Field label="Documents to consult">
            {(p) => (
              <select {...p} className={inputClass} value={topK} onChange={(e) => setTopK(Number(e.target.value))}>
                <option value={3}>3 (fastest)</option>
                <option value={5}>5 (recommended)</option>
                <option value={10}>10</option>
                <option value={15}>15 (slowest)</option>
              </select>
            )}
          </Field>
          <Button type="submit" variant="primary" disabled={!input.trim()} loading={loading}>
            <Send className="w-4 h-4" aria-hidden="true" /> Ask
          </Button>
        </form>
      </Card>

      <SourceNote>Answers are written by an AI model from EUR-Lex search results. They can be incomplete or wrong; rely on the official documents.</SourceNote>

      <SummarizerModal isOpen={!!activeDoc} onClose={() => setActiveDoc(null)} document={activeDoc} />
    </Page>
  );
}
