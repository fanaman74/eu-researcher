"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink, FolderOpen } from "lucide-react";
import HubShell, { Card, Chip, Loadable, SourceNote, linkClass, useApi } from "@/components/HubShell";
import type { Dossier, DossierLinks } from "@/lib/types";

interface DossierResponse {
  dossier: Dossier;
  links: DossierLinks;
  gaps: string[];
}

function External({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${linkClass}`}>
      {children} <ExternalLink className="w-3 h-3" />
    </a>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-xs text-slate-400">{children}</p>;

export default function DossierPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useApi<DossierResponse>(`/api/dossiers?id=${encodeURIComponent(id)}`);
  const d = data?.dossier;
  const links = data?.links;

  return (
    <HubShell
      title={d?.name ?? "Dossier"}
      subtitle={d ? `${d.reference} · ${d.proposal}` : "Legislative file"}
      badge={d?.stage ?? "Loading"}
      icon={FolderOpen}
      backHref="/enel/dossiers"
      backLabel="Dossiers"
    >
      <Loadable loading={loading} error={error} onRetry={reload} message="Loading the file...">
        {d && links && (
          <div className="space-y-4">
            <Card>
              <p className="text-xs text-slate-300 leading-relaxed">{d.title}</p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{d.why}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs">
                <External href={d.proposalUrl}>Commission proposal {d.proposal}</External>
                <External href={d.oeilUrl}>Legislative Observatory file</External>
              </div>
              {!d.available && (
                <p className="text-xs text-amber-400 mt-3">
                  The Parliament&apos;s data service returned no record for this file. It may not have been referred yet, or the service was unavailable.
                </p>
              )}
              {data.gaps.map((g) => (
                <p key={g} className="text-xs text-amber-400 mt-2">{g}</p>
              ))}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 space-y-4">
                <Card title="Who decides in Parliament">
                  <dl className="text-xs text-slate-300 space-y-1 mb-3">
                    <div className="flex gap-2"><dt className="text-slate-500 w-32 shrink-0">Lead committee</dt><dd>{d.leadCommittee || "Not assigned"}</dd></div>
                    <div className="flex gap-2"><dt className="text-slate-500 w-32 shrink-0">Opinion committees</dt><dd>{d.opinionCommittees.join("; ") || "None"}</dd></div>
                  </dl>
                  {d.actors.length === 0 ? (
                    <Empty>No rapporteur or shadow rapporteurs recorded yet.</Empty>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="py-2 pr-3">Role</th>
                            <th className="py-2 pr-3">MEP</th>
                            <th className="py-2 pr-3">Group</th>
                            <th className="py-2 pr-3">Country</th>
                            <th className="py-2">Committee</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {d.actors.map((a, n) => (
                            <tr key={`${a.mepId}-${a.role}-${n}`}>
                              <td className="py-2 pr-3 text-slate-300">{a.role}</td>
                              <td className="py-2 pr-3">
                                {a.mepId && a.country ? (
                                  <Link href={`/enel/mep-briefing?id=${a.mepId}`} className={`font-medium ${linkClass}`}>{a.name}</Link>
                                ) : (
                                  <span className="text-slate-300">{a.name}</span>
                                )}
                              </td>
                              <td className="py-2 pr-3 text-slate-300">{a.group || "—"}</td>
                              <td className="py-2 pr-3 text-slate-300">{a.country || "—"}</td>
                              <td className="py-2 text-slate-400">{a.committee || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

                <Card title="Linked Commission initiatives and consultations">
                  {links.initiatives.length === 0 ? (
                    <Empty>No energy-tagged initiative matches this file&apos;s keywords.</Empty>
                  ) : (
                    <ul className="space-y-2">
                      {links.initiatives.map((i) => (
                        <li key={i.id} className="text-xs flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <a href={i.url} target="_blank" rel="noopener noreferrer" className="text-slate-200 hover:text-blue-400">{i.title}</a>
                          <span className="text-slate-500">{i.actType} · {i.status === "Adopted" ? `adopted ${i.adoptionDate}` : i.plannedPeriod ?? "no quarter"}</span>
                          {i.feedback === "Open" && <Chip tone="green">Open until {i.feedbackEnd}</Chip>}
                          {i.totalFeedback > 0 && <Link href={`/enel/peers?pid=${i.id}`} className={linkClass}>{i.totalFeedback} {i.totalFeedback === 1 ? "response" : "responses"}</Link>}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card title="MEP questions">
                  {links.questions.length === 0 ? (
                    <Empty>None of the recent written questions tracked by the hub match this file.</Empty>
                  ) : (
                    <ul className="space-y-2">
                      {links.questions.map((q) => (
                        <li key={q.id} className="text-xs">
                          <a href={q.url} target="_blank" rel="noopener noreferrer" className="text-slate-200 hover:text-blue-400">{q.title}</a>
                          <span className="text-slate-500"> · {q.id} · {q.askedBy} · {q.date} · {q.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card title="Plenary votes">
                  {links.votes.length === 0 ? (
                    <Empty>No main plenary vote on this file found yet.</Empty>
                  ) : (
                    <ul className="space-y-2">
                      {links.votes.map((v) => (
                        <li key={v.id} className="text-xs">
                          <span className="font-mono text-slate-400">{v.date}</span>{" "}
                          <External href={`https://howtheyvote.eu/votes/${v.id}`}>{v.title}</External>
                          {v.reference && <span className="text-slate-500"> · {v.reference}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <Card title="Timeline in Parliament">
                  {d.timeline.length === 0 ? (
                    <Empty>No activity recorded.</Empty>
                  ) : (
                    <ol className="space-y-3">
                      {d.timeline.map((t) => (
                        <li key={`${t.date}-${t.label}`} className="text-xs border-l-2 border-slate-800 pl-3">
                          <div className="font-mono text-[11px] text-slate-400">{t.date}</div>
                          <div className="text-slate-200">{t.label}</div>
                          {t.documents.length > 0 && (
                            <div className="flex flex-wrap gap-x-3 mt-0.5">
                              {t.documents.map((doc) => (
                                <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className={`text-[11px] font-mono ${linkClass}`}>{doc.id}</a>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </Card>
                <Card title="Council">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Not tracked. The Council&apos;s website refuses automated access, so its position and working-party calendar are not available here. The
                    Legislative Observatory file above lists Council steps once they are recorded.
                  </p>
                </Card>
              </div>
            </div>

            <SourceNote>
              Sources: European Parliament Open Data Portal (stage, committees, rapporteurs, activities); Have Your Say (initiatives); HowTheyVote.eu
              (plenary votes, matched by procedure reference). Initiatives and questions are linked by keyword, so check the match before relying on it.
            </SourceNote>
          </div>
        )}
      </Loadable>
    </HubShell>
  );
}
