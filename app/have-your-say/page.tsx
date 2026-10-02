"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Sparkles } from "lucide-react";
import { AiLabel, Badge, Button, Card, EmptyState, ExternalLink, Facts, Field, Loadable, Page, SourceNote, formatDate, inputClass, linkClass, plural, useApi } from "@/components/ui";
import type { Consultation, ConsultationSubmission } from "@/lib/types";

function Breakdown({ title, rows }: { title: string; rows: { name: string; count: number; percentage: number }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-fg mb-2">{title}</h3>
      <ul className="space-y-2">
        {rows.slice(0, 10).map((r) => (
          <li key={r.name} className="text-sm">
            <div className="flex justify-between gap-3"><span className="text-fg">{r.name}</span><span className="tabular-nums text-muted">{r.count} ({r.percentage}%)</span></div>
            <div className="h-1.5 mt-1 bg-sunken rounded overflow-hidden" aria-hidden="true"><div className="h-full bg-primary rounded" style={{ width: `${r.percentage}%` }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Response({ sub }: { sub: ConsultationSubmission }) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const analyse = async () => {
    setBusy(true);
    setFailed(false);
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
              Cover: 1) The position taken, quoting only what the excerpt says. 2) Possible policy threat or benefit for a grid operator / utility. 3) Suggested follow-up. Label this as AI analysis of an excerpt.`,
            },
          ],
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setAnalysis((await res.json()).content);
    } catch (err) {
      console.error(err);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="py-4 first:pt-0 last:pb-0 space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold text-fg">{sub.stakeholder}</span>
        <span className="text-subtle">{sub.userType}{sub.country ? ` · ${sub.country}` : ""} · {formatDate(sub.date)}</span>
      </div>
      <p className="text-base text-fg max-w-prose">{sub.snippet || <span className="text-muted">No written text published.</span>}</p>
      {sub.attachment && (
        <p className="text-sm text-muted flex items-center gap-1.5"><FileText className="w-4 h-4" aria-hidden="true" /> Attachment: {sub.attachment}</p>
      )}
      {!analysis && (
        <Button size="sm" variant="ghost" onClick={analyse} loading={busy} disabled={!sub.snippet}>
          <Sparkles className="w-4 h-4" aria-hidden="true" /> Draft an AI analysis of this response
        </Button>
      )}
      {failed && <p className="text-sm text-danger" role="alert">The analysis could not be drafted. Try again in a moment.</p>}
      {analysis && (
        <div className="rounded-md border border-line bg-sunken p-4 space-y-2">
          <AiLabel />
          <p className="text-sm text-fg whitespace-pre-wrap">{analysis}</p>
        </div>
      )}
    </li>
  );
}

function HaveYourSayContent() {
  const router = useRouter();
  const requested = useSearchParams().get("pid");
  const list = useApi<{ consultations: Consultation[] }>("/api/have-your-say");
  const consultations = list.data?.consultations ?? [];
  const pid = requested ?? consultations[0]?.pid ?? null;
  const detail = useApi<{ consultation: Consultation | null }>(pid ? `/api/have-your-say?pid=${pid}` : null);
  const c = detail.data?.consultation;

  // Keep the URL in step with the selection so it can be shared or bookmarked.
  useEffect(() => {
    if (!requested && pid) router.replace(`/have-your-say?pid=${pid}`, { scroll: false });
  }, [requested, pid, router]);

  return (
    <Page>
      <Card>
        <Loadable loading={list.loading} error={list.error} onRetry={list.reload} message="Loading consultations from the Commission…">
          <Field label="Consultation" hint="Open consultations first (soonest deadline), then recently closed ones.">
            {(p) => (
              <select {...p} className={inputClass} value={pid ?? ""} onChange={(e) => router.replace(`/have-your-say?pid=${e.target.value}`, { scroll: false })}>
                {consultations.map((x) => (
                  <option key={x.pid} value={x.pid}>
                    {x.status.startsWith("Open") ? "Open: " : "Closed: "}
                    {x.title}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </Loadable>
      </Card>

      {pid && (
        <Loadable loading={detail.loading} error={detail.error} onRetry={detail.reload} message="Loading the consultation and its responses…">
          {!c ? (
            <EmptyState title="Consultation not found" />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
              <div className="space-y-4">
                <Card title={c.title}>
                  <Facts
                    items={[
                      { label: "Status", value: <Badge tone={c.status.startsWith("Open") ? "success" : "neutral"}>{c.status.replace(" (Receiving Feedback)", "")}</Badge> },
                      { label: "Closes", value: formatDate(c.closingDate) },
                      { label: "Responses", value: c.totalSubmissions.toLocaleString("en-GB") },
                      { label: "Act type", value: c.actType || "—" },
                    ]}
                  />
                  {c.summary && <p className="text-sm text-muted mt-4">{c.summary}</p>}
                  <div className="flex flex-col gap-2 mt-4 text-sm">
                    <ExternalLink href={c.url}>Open on Have Your Say</ExternalLink>
                    <Link href={`/enel/peers?pid=${c.pid}`} className={linkClass}>Compare peer utilities&apos; responses</Link>
                  </div>
                </Card>
                <Card title="Who responded" description={`Based on the ${plural(c.demographics.sampleSize, "most recent published response")}.`}>
                  <div className="space-y-6">
                    <Breakdown title="By type of respondent" rows={c.demographics.sectors} />
                    <Breakdown title="By country" rows={c.demographics.countries.map((x) => ({ name: x.country, count: x.submissions, percentage: x.percentage }))} />
                  </div>
                </Card>
              </div>
              <Card title="Published responses" description="Responses with a position paper are listed first." className="xl:col-span-2">
                {c.submissions.length === 0 ? (
                  <EmptyState title="No published responses yet" />
                ) : (
                  <ul className="divide-y divide-line">
                    {c.submissions.map((s) => <Response key={s.id} sub={s} />)}
                  </ul>
                )}
              </Card>
            </div>
          )}
        </Loadable>
      )}

      <SourceNote>
        Source: European Commission, Have Your Say. Individuals are never named; organisations are named only when they chose to be identified. AI
        analyses use only the excerpt shown and can be wrong.
      </SourceNote>
    </Page>
  );
}

export default function HaveYourSayPage() {
  return (
    <Suspense>
      <HaveYourSayContent />
    </Suspense>
  );
}
