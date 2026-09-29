"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Sparkles,
  FileText,
  Globe,
  Download,
  Cpu
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ErrorBanner from "@/components/ErrorBanner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { type Consultation, type ConsultationSubmission } from "@/lib/types";

function HaveYourSayContent() {
  const searchParams = useSearchParams();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [activePid, setActivePid] = useState<string | null>(null);
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);
  const [loadingConsultation, setLoadingConsultation] = useState(false);
  const [consultationsError, setConsultationsError] = useState(false);
  const [consultationsLoading, setConsultationsLoading] = useState(true);
  const [consultationError, setConsultationError] = useState(false);

  // PDF parsing simulation states
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [parsingSub, setParsingSub] = useState(false);
  const [parsedBriefing, setParsedBriefing] = useState<string | null>(null);

  // Deep link: /have-your-say?pid=PID-... preselects a consultation
  useEffect(() => {
    const pid = searchParams.get("pid");
    if (pid) setActivePid(pid);
  }, [searchParams]);

  const fetchConsultations = useCallback(async () => {
    setConsultationsError(false);
    setConsultationsLoading(true);
    try {
      const res = await fetch("/api/have-your-say");
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = await res.json();
      const list: Consultation[] = data.consultations || [];
      setConsultations(list);
      // Auto-select the first consultation when no deep-linked pid is present
      setActivePid((prev) => prev ?? (list.length > 0 ? list[0].pid : null));
    } catch (err) {
      console.error("Failed to fetch consultations:", err);
      setConsultationsError(true);
    } finally {
      setConsultationsLoading(false);
    }
  }, []);

  const fetchActiveConsultation = async (pid: string) => {
    setLoadingConsultation(true);
    setConsultationError(false);
    setParsedBriefing(null);
    setSelectedSubId(null);
    try {
      const res = await fetch(`/api/have-your-say?pid=${pid}`);
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = await res.json();
      setActiveConsultation(data.consultation);
    } catch (err) {
      console.error("Failed to fetch active consultation:", err);
      setConsultationError(true);
    } finally {
      setLoadingConsultation(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  useEffect(() => {
    if (activePid) fetchActiveConsultation(activePid);
  }, [activePid]);

  const handleParseSub = async (sub: ConsultationSubmission) => {
    setSelectedSubId(sub.id);
    setParsingSub(true);
    setParsedBriefing(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Analyze this stakeholder consultation response (only the excerpt below is available; do not assume anything beyond it) and draft a short brief for a corporate public affairs team:
              Stakeholder: "${sub.stakeholder}" (${sub.userType}, ${sub.country || "country not stated"})
              Excerpt: "${sub.snippet}"
              Cover: 1) The position taken, quoting only what the excerpt says. 2) Possible policy threat or benefit for a grid operator / utility. 3) Suggested follow-up. Label this as AI analysis of an excerpt.`
            }
          ]
        })
      });
      if (res.ok) {
        const data = await res.json();
        setParsedBriefing(data.content);
      } else {
        throw new Error("Failed to parse paper.");
      }
    } catch (err: any) {
      setParsedBriefing(`⚠️ Error: ${err.message || "Failed to parse stakeholder position."}`);
    } finally {
      setParsingSub(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 space-y-8">

        {/* Navigation Header */}
        <PageHeader
          backHref="/enel"
          backLabel="Back to Public Affairs Hub"
          badge="EC Consultation Watch"
          accent="blue"
        />

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 flex-wrap">
            <Users className="w-6 h-6 text-blue-400" /> Have Your Say Consultation Monitor
          </h1>
          <p className="text-xs text-slate-400">Live Commission consultations on energy: response counts, who is responding, and published position papers</p>
        </div>

        {consultationsError && (
          <ErrorBanner onRetry={fetchConsultations} />
        )}

        {/* Selector Header Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Energy Consultations (open first, then recently closed)</span>
            {consultationsLoading && (
              <LoadingSpinner message="Loading consultations from the Commission (first load can take ~30s)..." accent="blue" size="sm" />
            )}
            {!consultationsLoading && !consultationsError && consultations.length === 0 && (
              <div className="text-xs text-slate-400 italic">No energy consultations found.</div>
            )}
            <div className="flex flex-wrap gap-2">
              {consultations.map((item) => (
                <button
                  key={item.pid}
                  onClick={() => setActivePid(item.pid)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                    activePid === item.pid
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          {activeConsultation && (
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-md shrink-0 flex items-center gap-4">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 font-mono font-semibold uppercase">Submissions</div>
                <div className="text-base font-bold text-white font-mono">{activeConsultation.totalSubmissions}</div>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="text-center">
                <div className="text-[10px] text-slate-500 font-mono font-semibold uppercase">Closing Date</div>
                <div className="text-xs font-semibold text-blue-400 font-mono">{activeConsultation.closingDate ?? "—"}</div>
              </div>
            </div>
          )}
        </div>

        {/* Division Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Demographics Metrics (5/12 columns) */}
          <div className="lg:col-span-5 space-y-5">

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-1.5"><Globe className="w-4 h-4 text-blue-400" /> Stakeholder Demographics</h2>
                <p className="text-xs text-slate-400 mt-0.5">Country and respondent-type splits from published responses</p>
              </div>

              {loadingConsultation ? (
                <LoadingSpinner message="Extracting demographic parameters..." accent="blue" size="md" />
              ) : consultationError ? (
                <ErrorBanner onRetry={() => activePid && fetchActiveConsultation(activePid)} />
              ) : activeConsultation ? (
                <div className="space-y-4">

                  {/* Country breakdown */}
                  <div className="space-y-2 bg-slate-950 p-4 rounded-md border border-slate-800">
                    <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Country Submissions Breakdown</h3>
                    <div className="space-y-2">
                      {activeConsultation.demographics.countries.map((c) => (
                        <div key={c.country} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-300">{c.country}</span>
                            <span className="text-slate-400">{c.submissions} ({c.percentage}%)</span>
                          </div>
                          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sectors breakdown */}
                  <div className="space-y-2 bg-slate-950 p-4 rounded-md border border-slate-800">
                    <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Stakeholder Sectors Breakdown</h3>
                    <div className="space-y-2">
                      {activeConsultation.demographics.sectors.map((s) => (
                        <div key={s.name} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-300">{s.name}</span>
                            <span className="text-slate-400">{s.count} ({s.percentage}%)</span>
                          </div>
                          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-500 rounded-full" style={{ width: `${s.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {activeConsultation.summary && (
                    <div className="space-y-2 bg-slate-950 p-4 rounded-md border border-slate-800">
                      <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Commission Summary</h3>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{activeConsultation.summary}</p>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                    Source: European Commission Have Your Say. Breakdowns are computed from the{" "}
                    {activeConsultation.demographics.sampleSize} most recent published responses
                    {activeConsultation.totalSubmissions > activeConsultation.demographics.sampleSize
                      ? ` (of ${activeConsultation.totalSubmissions})`
                      : ""}
                    .{" "}
                    <a href={activeConsultation.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      Open on Have Your Say
                    </a>
                  </p>

                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs italic">No metrics loaded.</div>
              )}
            </div>

          </div>

          {/* Submissions Stream & Ingestion Parser (7/12 columns) */}
          <div className="lg:col-span-7 space-y-5">

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-5 flex flex-col justify-between min-h-[500px]">

              <div className="space-y-4 flex-1">
                <div>
                  <h2 className="text-sm font-bold text-slate-200">Stakeholder Position Papers</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Review position snippets and parse detailed public affairs briefs</p>
                </div>

                {loadingConsultation ? (
                  <LoadingSpinner message="Loading consultations feed..." accent="blue" size="md" />
                ) : consultationError ? (
                  <ErrorBanner onRetry={() => activePid && fetchActiveConsultation(activePid)} />
                ) : activeConsultation ? (
                  <div className="space-y-3">

                    {/* Positions Stream List */}
                    <div className="space-y-3">
                      {activeConsultation.submissions.length === 0 && (
                        <div className="p-6 text-center text-slate-400 text-xs italic">No published responses yet.</div>
                      )}
                      {activeConsultation.submissions.map((sub) => {
                        const tagColor = "bg-slate-900 border-slate-700 text-slate-300";
                        const borderStyle = selectedSubId === sub.id ? "border-blue-500/60 bg-slate-900" : "border-slate-800 bg-slate-950/60 hover:border-slate-700";
                        return (
                          <div
                            key={sub.id}
                            className={`p-4 border rounded-md flex flex-col gap-3 transition-colors ${borderStyle}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-bold text-slate-100">{sub.stakeholder}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${tagColor}`}>
                                  {sub.userType}{sub.country ? ` · ${sub.country}` : ""}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 font-semibold">{sub.id}</span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed font-sans">{sub.snippet}</p>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-800">
                              <span className="flex items-center gap-1">
                                {sub.attachment
                                  ? <><Download className="w-3.5 h-3.5" /> File: <strong className="text-slate-300">{sub.attachment}</strong></>
                                  : <span>{sub.date ?? ""}</span>}
                              </span>
                              <button
                                onClick={() => handleParseSub(sub)}
                                disabled={parsingSub}
                                className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <span>Analyze Paper</span> <Sparkles className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Parser Result Frame */}
                    {(parsingSub || parsedBriefing) && (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-md space-y-2">

                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-mono font-bold uppercase text-blue-400">Position Analysis Briefing</h3>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Cpu className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[9px] font-mono font-semibold uppercase">Lobby AI Parser</span>
                          </div>
                        </div>

                        {parsingSub ? (
                          <div className="flex flex-col items-center justify-center gap-2 py-6">
                            <Cpu className="w-5 h-5 text-blue-400 animate-spin" />
                            <span className="text-[10px] text-slate-400 font-mono">Parsing attached position paper...</span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                            {parsedBriefing}
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs italic">No submissions loaded. Select consultation PID above.</div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default function HaveYourSayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <LoadingSpinner message="Loading consultation monitor..." accent="blue" size="lg" />
      </div>
    }>
      <HaveYourSayContent />
    </Suspense>
  );
}
