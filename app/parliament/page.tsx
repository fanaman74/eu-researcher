"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Badge, Card, EmptyState, ErrorState, ExternalLink, Field, Loading, Notice, Page, SearchBox, Segmented, SourceNote, formatDate, inputClass } from "@/components/ui";
import type { ParliamentQuestion, ParliamentVote, ParliamentVoteSummary, VoteSplit } from "@/lib/types";

type VoteScope = "energy" | "latest";

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

function SplitBar({ label, count, total, barClass }: { label: string; count: number; total: number; barClass: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-fg">{label}</span>
        <span className="tabular-nums text-muted">{count} MEPs ({pct(count, total)}%)</span>
      </div>
      <div className="h-2 bg-sunken overflow-hidden" aria-hidden="true">
        <div className={`h-full ${barClass}`} style={{ width: `${pct(count, total)}%` }} />
      </div>
    </div>
  );
}

const splitText = (s: VoteSplit) => `${s.yes} for · ${s.no} against · ${s.abstain} abstained`;

function Questions() {
  const [draft, setDraft] = useState("");
  const [questions, setQuestions] = useState<ParliamentQuestion[]>([]);
  const [partial, setPartial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [term, setTerm] = useState("");

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(false);
    setTerm(q);
    try {
      const res = await fetch(`/api/parliament?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setQuestions(data.questions || []);
      setPartial(Boolean(data.partial));
    } catch (err) {
      console.error("Failed to fetch EP questions:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  return (
    <Card title="Written questions" description="Energy-related questions by default. Search to look through all recent questions by topic or MEP name.">
      <div className="space-y-4">
        <SearchBox label="Search questions" hideLabel value={draft} onChange={setDraft} onSubmit={() => load(draft.trim())} placeholder="Topic or MEP name" busy={loading} />
        {partial && !loading && <Notice tone="warning">Older questions are still loading (the Parliament limits how fast they can be read). Search again in a minute for complete results.</Notice>}
        {error ? (
          <ErrorState onRetry={() => load(term)} />
        ) : loading ? (
          <Loading message="Fetching questions from the European Parliament…" />
        ) : questions.length === 0 ? (
          <EmptyState title="No questions found" message={term ? `Nothing matches “${term}”.` : "No energy-related questions in the recent window."} />
        ) : (
          <ul className="divide-y divide-line" aria-live="polite">
            {questions.map((q) => (
              <li key={q.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-subtle">
                  <span className="font-mono text-xs">{q.id}</span>
                  <Badge tone={q.status === "Answered" ? "success" : "warning"}>
                    {q.status === "Answered" ? `Answered ${q.answerDate ? formatDate(q.answerDate) : ""}` : "Awaiting answer"}
                  </Badge>
                </div>
                <p className="font-medium text-fg">{q.title}</p>
                <p className="text-sm text-muted">Asked by {q.askedBy} · to the {q.target} · {formatDate(q.date)}</p>
                <p className="flex flex-wrap gap-x-4 text-sm">
                  <ExternalLink href={q.url}>Read the question</ExternalLink>
                  {q.answerUrl && <ExternalLink href={q.answerUrl}>Read the answer</ExternalLink>}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function Votes() {
  const [scope, setScope] = useState<VoteScope>("energy");
  const [list, setList] = useState<ParliamentVoteSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [vote, setVote] = useState<ParliamentVote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadList = useCallback(async (s: VoteScope) => {
    setLoading(true);
    setError(false);
    setVote(null);
    try {
      const res = await fetch(`/api/parliament?type=votes&q=${s === "energy" ? "energy" : ""}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const votes: ParliamentVoteSummary[] = data.votes || [];
      setList(votes);
      setActiveId(votes[0]?.id ?? null);
      if (votes.length === 0) setLoading(false);
    } catch (err) {
      console.error("Failed to fetch vote list:", err);
      setError(true);
      setLoading(false);
    }
  }, []);

  const loadVote = useCallback(async (id: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/parliament?type=votes&id=${id}`);
      if (!res.ok) throw new Error(String(res.status));
      setVote((await res.json()).vote);
    } catch (err) {
      console.error("Failed to fetch vote:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList(scope);
  }, [scope, loadList]);
  useEffect(() => {
    if (activeId) loadVote(activeId);
  }, [activeId, loadVote]);

  return (
    <Card title="Plenary votes" description="Roll-call results with political-group and Italian splits.">
      <div className="space-y-4">
        <Segmented label="Votes to show" options={[{ value: "energy", label: "Energy votes" }, { value: "latest", label: "Latest votes" }]} value={scope} onChange={setScope} />
        {list.length > 0 && (
          <Field label="Vote">
            {(p) => (
              <select {...p} value={activeId ?? ""} onChange={(e) => setActiveId(e.target.value)} className={inputClass}>
                {list.map((v) => (
                  <option key={v.id} value={v.id}>{formatDate(v.date)} — {v.title}</option>
                ))}
              </select>
            )}
          </Field>
        )}
        {error ? (
          <ErrorState onRetry={() => (activeId ? loadVote(activeId) : loadList(scope))} />
        ) : loading ? (
          <Loading message="Loading vote results…" rows={2} />
        ) : vote ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="font-semibold text-fg">{vote.title}</p>
              {vote.description && <p className="text-sm text-muted">{vote.description}</p>}
              <p className="text-sm text-subtle">
                {formatDate(vote.date)}
                {vote.reference && ` · ${vote.reference}`}
                {vote.committees.length > 0 && ` · Committees: ${vote.committees.join(", ")}`}
              </p>
              {vote.result && <Badge tone={/adopt/i.test(vote.result) ? "success" : "neutral"}>Result: {vote.result.toLowerCase()}</Badge>}
            </div>
            <div className="space-y-3 rounded-md border border-line p-4">
              <p className="text-sm font-semibold text-fg">All MEPs ({vote.totalVotes} votes cast)</p>
              <SplitBar label="For" count={vote.total.yes} total={vote.totalVotes} barClass="bg-success" />
              <SplitBar label="Against" count={vote.total.no} total={vote.totalVotes} barClass="bg-danger" />
              <SplitBar label="Abstained" count={vote.total.abstain} total={vote.totalVotes} barClass="bg-line-strong" />
            </div>
            {vote.italy && (
              <p className="text-sm"><span className="font-semibold text-fg">Italian MEPs: </span><span className="text-muted">{splitText(vote.italy)}</span></p>
            )}
            <div>
              <p className="text-sm font-semibold text-fg mb-2">By political group</p>
              <table className="w-full text-sm">
                <caption className="sr-only">Votes by political group</caption>
                <thead>
                  <tr className="text-subtle text-left border-b border-line">
                    <th scope="col" className="py-1.5 font-medium">Group</th>
                    <th scope="col" className="py-1.5 font-medium text-right">For</th>
                    <th scope="col" className="py-1.5 font-medium text-right">Against</th>
                    <th scope="col" className="py-1.5 font-medium text-right">Abstained</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {vote.byGroup.map((g) => (
                    <tr key={g.group} className="border-b border-line">
                      <th scope="row" className="py-1.5 text-left font-normal text-fg">{g.group}</th>
                      <td className="py-1.5 text-right">{g.yes}</td>
                      <td className="py-1.5 text-right">{g.no}</td>
                      <td className="py-1.5 text-right">{g.abstain}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ExternalLink href={vote.url} className="text-sm">Full vote on HowTheyVote.eu</ExternalLink>
          </div>
        ) : (
          <EmptyState title="No votes found" />
        )}
      </div>
    </Card>
  );
}

export default function ParliamentPage() {
  return (
    <Page>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <Questions />
        <Votes />
      </div>
      <SourceNote>
        Sources: European Parliament Open Data Portal (questions) and HowTheyVote.eu, which republishes the Parliament&apos;s official roll-call records
        (votes). The text of questions is only published as documents, so follow the links to read it.
      </SourceNote>
    </Page>
  );
}
