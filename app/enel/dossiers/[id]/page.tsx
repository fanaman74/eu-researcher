"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge, Card, ExternalLink, Facts, Loadable, Notice, Page, SourceNote, formatDate, linkClass, plural, tableClass, tdClass, thClass, useApi } from "@/components/ui";
import type { Dossier, DossierLinks } from "@/lib/types";

interface DossierResponse {
  dossier: Dossier;
  links: DossierLinks;
  gaps: string[];
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-muted">{children}</p>;

export default function DossierPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useApi<DossierResponse>(`/api/dossiers?id=${encodeURIComponent(id)}`);
  const d = data?.dossier;
  const links = data?.links;

  return (
    <Page
      title={d?.name ?? "Legislative file"}
      description={d ? <>{d.reference} · Commission proposal {d.proposal}</> : " "}
      breadcrumbs={[{ label: "Legislative files", href: "/enel/dossiers" }, { label: d?.name ?? "File" }]}
      actions={d && <Badge tone={d.stage.startsWith("Adopted") ? "success" : "info"}>{d.stage}</Badge>}
    >
      <Loadable loading={loading} error={error} onRetry={reload} message="Loading the file…">
        {d && links && (
          <div className="space-y-4">
            <Card>
              <p className="text-base text-fg">{d.title}</p>
              <p className="text-sm text-muted mt-2">{d.why}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
                <ExternalLink href={d.proposalUrl}>Read the Commission proposal</ExternalLink>
                <ExternalLink href={d.oeilUrl}>Legislative Observatory file</ExternalLink>
              </div>
            </Card>
            {!d.available && (
              <Notice tone="warning">
                The Parliament&apos;s data service has no record of this file yet. It may not have been referred to a committee, or the service was busy.
              </Notice>
            )}
            {data.gaps.map((g) => <Notice key={g} tone="warning">{g}</Notice>)}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 space-y-4">
                <Card title="Who decides in Parliament">
                  <Facts
                    items={[
                      { label: "Lead committee", value: d.leadCommittee || "Not assigned yet" },
                      { label: "Giving opinions", value: d.opinionCommittees.join("; ") || "None" },
                    ]}
                  />
                  {d.actors.length === 0 ? (
                    <div className="mt-4"><Empty>No rapporteur or shadow rapporteurs recorded yet.</Empty></div>
                  ) : (
                    <div className="mt-4 overflow-x-auto -mx-4 sm:-mx-5">
                      <table className={tableClass}>
                        <caption className="sr-only">Rapporteurs and shadow rapporteurs</caption>
                        <thead>
                          <tr>
                            <th scope="col" className={thClass}>Role</th>
                            <th scope="col" className={thClass}>MEP</th>
                            <th scope="col" className={thClass}>Group</th>
                            <th scope="col" className={thClass}>Country</th>
                            <th scope="col" className={thClass}>Committee</th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.actors.map((a, n) => (
                            <tr key={`${a.mepId}-${a.role}-${n}`}>
                              <td className={`${tdClass} text-muted`}>{a.role}</td>
                              <td className={tdClass}>
                                {a.mepId && a.country ? (
                                  <Link href={`/enel/mep-briefing?id=${a.mepId}`} className={`font-medium ${linkClass}`}>{a.name}</Link>
                                ) : (
                                  <span>{a.name}</span>
                                )}
                              </td>
                              <td className={tdClass}>{a.group || "—"}</td>
                              <td className={tdClass}>{a.country || "—"}</td>
                              <td className={`${tdClass} text-muted`}>{a.committee || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="text-sm text-subtle mt-3">Select a name to open that MEP&apos;s briefing.</p>
                </Card>

                <Card title="Related Commission initiatives" description="Matched by keyword, so check that each one is relevant.">
                  {links.initiatives.length === 0 ? (
                    <Empty>No energy-tagged initiative matches this file.</Empty>
                  ) : (
                    <ul className="divide-y divide-line">
                      {links.initiatives.map((i) => (
                        <li key={i.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                          <a href={i.url} target="_blank" rel="noopener noreferrer" className="font-medium text-fg hover:text-link hover:underline">{i.title}</a>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
                            <span>{i.actType || "Act type not given"}</span>
                            <span>{i.status === "Adopted" ? `Adopted ${formatDate(i.adoptionDate)}` : i.plannedPeriod ? `Planned ${i.plannedPeriod}` : "No quarter given"}</span>
                            {i.feedback === "Open" && <Badge tone="success">Open until {formatDate(i.feedbackEnd)}</Badge>}
                            {i.totalFeedback > 0 && <Link href={`/enel/peers?pid=${i.id}`} className={linkClass}>{plural(i.totalFeedback, "response")}</Link>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card title="MEP questions">
                    {links.questions.length === 0 ? (
                      <Empty>None of the recent written questions match this file.</Empty>
                    ) : (
                      <ul className="space-y-3">
                        {links.questions.map((q) => (
                          <li key={q.id} className="text-sm">
                            <a href={q.url} target="_blank" rel="noopener noreferrer" className="text-fg hover:text-link hover:underline">{q.title}</a>
                            <span className="block text-subtle">{q.askedBy} · {formatDate(q.date)} · {q.status}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                  <Card title="Plenary votes">
                    {links.votes.length === 0 ? (
                      <Empty>No main plenary vote on this file yet.</Empty>
                    ) : (
                      <ul className="space-y-3">
                        {links.votes.map((v) => (
                          <li key={v.id} className="text-sm">
                            <ExternalLink href={`https://howtheyvote.eu/votes/${v.id}`}>{v.title}</ExternalLink>
                            <span className="block text-subtle">{formatDate(v.date)}{v.reference && ` · ${v.reference}`}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </div>
              </div>

              <div className="space-y-4">
                <Card title="Timeline in Parliament">
                  {d.timeline.length === 0 ? (
                    <Empty>No activity recorded.</Empty>
                  ) : (
                    <ol className="space-y-4">
                      {d.timeline.map((t) => (
                        <li key={`${t.date}-${t.label}`} className="border-l-2 border-line-strong pl-3">
                          <p className="text-sm text-subtle tabular-nums">{formatDate(t.date)}</p>
                          <p className="text-sm font-medium text-fg">{t.label}</p>
                          {t.documents.length > 0 && (
                            <p className="flex flex-wrap gap-x-3 mt-0.5 text-sm">
                              {t.documents.map((doc) => (
                                <ExternalLink key={doc.id} href={doc.url} className="font-mono text-xs">{doc.id}</ExternalLink>
                              ))}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </Card>
                <Card title="Council">
                  <p className="text-sm text-muted">
                    Not tracked here: the Council&apos;s website refuses automated access. The Legislative Observatory file (link above) lists Council steps
                    once they are recorded.
                  </p>
                </Card>
              </div>
            </div>

            <SourceNote>
              Sources: European Parliament Open Data Portal (stage, committees, rapporteurs, activities); Have Your Say (initiatives); HowTheyVote.eu
              (plenary votes, matched by procedure reference).
            </SourceNote>
          </div>
        )}
      </Loadable>
    </Page>
  );
}
