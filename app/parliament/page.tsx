"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Search,
  CheckCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  ExternalLink
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ErrorBanner from "@/components/ErrorBanner";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  type ParliamentQuestion,
  type ParliamentVote,
  type ParliamentVoteSummary,
  type VoteSplit
} from "@/lib/types";

type VoteScope = "energy" | "latest";

function pct(part: number, whole: number): string {
  return whole > 0 ? ((part / whole) * 100).toFixed(0) : "0";
}

function SplitBar({ label, count, total, color, icon }: { label: string; count: number; total: number; color: string; icon?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-slate-300 font-semibold flex items-center gap-1">{icon}{label}</span>
        <span className="text-slate-300">{count} MEPs ({pct(count, total)}%)</span>
      </div>
      <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct(count, total)}%` }} />
      </div>
    </div>
  );
}

function splitText(s: VoteSplit): string {
  return `${s.yes} for · ${s.no} against · ${s.abstain} abstain`;
}

export default function ParliamentWatcherPage() {
  const [questions, setQuestions] = useState<ParliamentQuestion[]>([]);
  const [partial, setPartial] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState(false);

  // Plenary vote states
  const [scope, setScope] = useState<VoteScope>("energy");
  const [voteList, setVoteList] = useState<ParliamentVoteSummary[]>([]);
  const [activeVoteId, setActiveVoteId] = useState<string | null>(null);
  const [voteData, setVoteData] = useState<ParliamentVote | null>(null);
  const [loadingVote, setLoadingVote] = useState(false);
  const [voteError, setVoteError] = useState(false);

  const fetchQuestions = async (queryTerm = "") => {
    setLoading(true);
    setQuestionsError(false);
    try {
      const res = await fetch(`/api/parliament?q=${encodeURIComponent(queryTerm)}`);
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setPartial(Boolean(data.partial));
    } catch (err) {
      console.error("Failed to fetch EP questions:", err);
      setQuestionsError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoteList = async (s: VoteScope) => {
    setLoadingVote(true);
    setVoteError(false);
    setVoteData(null);
    try {
      const res = await fetch(`/api/parliament?type=votes&q=${s === "energy" ? "energy" : ""}`);
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = await res.json();
      const list: ParliamentVoteSummary[] = data.votes || [];
      setVoteList(list);
      setActiveVoteId(list.length > 0 ? list[0].id : null);
      if (list.length === 0) setLoadingVote(false);
    } catch (err) {
      console.error("Failed to fetch vote list:", err);
      setVoteError(true);
      setLoadingVote(false);
    }
  };

  const fetchVoteData = async (voteId: string) => {
    setLoadingVote(true);
    setVoteError(false);
    try {
      const res = await fetch(`/api/parliament?type=votes&id=${voteId}`);
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = await res.json();
      setVoteData(data.vote);
    } catch (err) {
      console.error("Failed to fetch vote data:", err);
      setVoteError(true);
    } finally {
      setLoadingVote(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    fetchVoteList(scope);
  }, [scope]);

  useEffect(() => {
    if (activeVoteId) fetchVoteData(activeVoteId);
  }, [activeVoteId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 space-y-8">

        {/* Navigation Header */}
        <PageHeader
          backHref="/enel"
          backLabel="Back to Public Affairs Hub"
          badge="EP Open Data Watch"
          accent="blue"
        />

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 flex-wrap">
            <BarChart3 className="w-6 h-6 text-blue-400" /> European Parliament Watcher
          </h1>
          <p className="text-xs text-slate-400">Live MEP written questions to the Commission and plenary roll-call votes</p>
        </div>

        {/* Division into two panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Parliamentary Questions Watcher (7/12 columns) */}
          <div className="lg:col-span-7 space-y-5">

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-200">Recent Written Questions</h2>
                <p className="text-xs text-slate-400">
                  Energy-related questions by default; type a term to search titles and MEP names across all recent questions.
                  Source: European Parliament Open Data Portal.
                </p>
              </div>

              {/* Search Row */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchQuestions(search)}
                    placeholder="Search MEP name or topic..."
                    className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <button
                  onClick={() => fetchQuestions(search)}
                  className="py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center transition-colors cursor-pointer"
                >
                  Filter
                </button>
              </div>
              {partial && !loading && (
                <p className="text-[10px] text-amber-400 font-mono">
                  Still loading older questions from the Parliament (its API is rate-limited). Results may be incomplete; refresh in a minute.
                </p>
              )}
            </div>

            {/* Questions Feed */}
            <div className="space-y-3">
              {questionsError ? (
                <ErrorBanner onRetry={() => fetchQuestions(search)} />
              ) : loading ? (
                <div className="border border-slate-800 rounded-lg bg-slate-900/60">
                  <LoadingSpinner message="Fetching questions from the EP portal..." accent="blue" size="sm" />
                </div>
              ) : questions.length === 0 ? (
                <div className="p-12 text-center border border-slate-800 rounded-lg bg-slate-900/60 text-slate-400 text-xs italic">
                  No parliamentary questions match yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="p-5 border border-slate-800 bg-slate-900/60 rounded-lg flex flex-col gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-400">{q.id}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${q.status === "Answered" ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
                            {q.status === "Answered" ? <CheckCircle className="inline w-3 h-3 mr-1 text-emerald-400" /> : <Clock className="inline w-3 h-3 mr-1 text-amber-400" />}
                            {q.status}{q.answerDate ? ` · ${q.answerDate}` : ""}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-100 leading-snug">{q.title}</h3>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                        <span>Asked by: <strong className="text-slate-200">{q.askedBy}</strong></span>
                        <span className="flex items-center gap-3">
                          <span>To: {q.target} | {q.date}</span>
                          <a href={q.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                            Question <ExternalLink className="w-3 h-3" />
                          </a>
                          {q.answerUrl && (
                            <a href={q.answerUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-1">
                              Answer <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Plenary Vote Tracker (5/12 columns) */}
          <div className="lg:col-span-5 space-y-5">

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-5 flex flex-col justify-between min-h-[500px]">

              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-200">Plenary Vote Tracker</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Roll-call outcomes with political-group and Italian splits. Data: HowTheyVote.eu, from official European Parliament records.
                  </p>
                </div>

                {/* Scope selector */}
                <div className="flex gap-2 p-1 bg-slate-950 rounded-md border border-slate-800">
                  {(["energy", "latest"] as VoteScope[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setScope(s)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${scope === s ? "bg-slate-800 text-blue-400" : "text-slate-400 hover:text-slate-200"}`}
                    >
                      {s === "energy" ? "Energy votes" : "Latest votes"}
                    </button>
                  ))}
                </div>

                {voteList.length > 0 && (
                  <select
                    value={activeVoteId ?? ""}
                    onChange={(e) => setActiveVoteId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 p-2 focus:outline-none focus:border-blue-500"
                  >
                    {voteList.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.date} — {v.title.length > 70 ? `${v.title.slice(0, 70)}…` : v.title}
                      </option>
                    ))}
                  </select>
                )}

                {/* Vote detail box */}
                {voteError ? (
                  <ErrorBanner onRetry={() => (activeVoteId ? fetchVoteData(activeVoteId) : fetchVoteList(scope))} />
                ) : loadingVote ? (
                  <LoadingSpinner message="Loading vote results..." accent="blue" size="md" />
                ) : voteData ? (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Vote{voteData.reference ? ` · ${voteData.reference}` : ""}</span>
                      <h3 className="text-xs font-bold text-slate-100 leading-snug">{voteData.title}</h3>
                      {voteData.description && <div className="text-[10px] text-slate-500">{voteData.description}</div>}
                      <div className="text-[10px] font-mono text-slate-400">
                        Date: {voteData.date}
                        {voteData.result && <> | Outcome: <span className="text-blue-400 font-bold uppercase">{voteData.result}</span></>}
                        {voteData.committees.length > 0 && <> | Committees: {voteData.committees.join(", ")}</>}
                      </div>
                    </div>

                    {/* Chart splits */}
                    <div className="space-y-3 bg-slate-950 p-4 rounded-md border border-slate-800">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">MEP Vote Splits (Cast: {voteData.totalVotes})</div>
                      <SplitBar label="YES" count={voteData.total.yes} total={voteData.totalVotes} color="bg-emerald-500" icon={<ThumbsUp className="w-3 h-3 text-emerald-400" />} />
                      <SplitBar label="NO" count={voteData.total.no} total={voteData.totalVotes} color="bg-red-500" icon={<ThumbsDown className="w-3 h-3 text-red-400" />} />
                      <SplitBar label="ABSTAIN" count={voteData.total.abstain} total={voteData.totalVotes} color="bg-slate-600" />
                    </div>

                    {voteData.italy && (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-md space-y-1">
                        <h4 className="text-[10px] font-mono font-bold uppercase text-blue-400">Italian MEPs</h4>
                        <p className="text-xs text-slate-300 font-mono">{splitText(voteData.italy)}</p>
                      </div>
                    )}

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-md space-y-2">
                      <h4 className="text-[10px] font-mono font-bold uppercase text-blue-400">By Political Group</h4>
                      <div className="space-y-1">
                        {voteData.byGroup.map((g) => (
                          <div key={g.group} className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-300">{g.group}</span>
                            <span className="text-slate-400">{splitText(g)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <a href={voteData.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline inline-flex items-center gap-1 font-mono">
                      Full vote on HowTheyVote.eu <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs italic">No vote results loaded.</div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
