"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, ButtonLink, ErrorState, formatDate, linkClass, useApi } from "@/components/ui";
import { NAV } from "@/lib/navigation";
import type { Digest } from "@/lib/digest";
import type { CalendarEvent, Dossier } from "@/lib/types";

const PHOTO_PAGE = "https://commons.wikimedia.org/wiki/File:Power_Lines_-_Sant%27Agata_Bolognese,_Bologna,_Italy_-_December_7,_2018.jpg";

function Figure({ value, label, href }: { value: React.ReactNode; label: string; href: string }) {
  return (
    <Link href={href} className="group block py-4 sm:px-5 first:pl-0 text-white">
      <span className="block font-serif text-4xl font-bold tabular-nums">{value}</span>
      <span className="block mt-1 text-sm text-white/85 group-hover:underline">{label}</span>
    </Link>
  );
}

function SectionHeading({ id, title, href, linkLabel }: { id: string; title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 rule-double pt-4 mb-6">
      <h2 id={id} className="text-2xl sm:text-3xl font-bold tracking-[-0.01em] text-fg">{title}</h2>
      <Link href={href} className={`inline-flex items-center gap-1 text-sm font-semibold ${linkClass}`}>
        {linkLabel} <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

const cardClass = "h-full border border-line-strong p-5 flex flex-col gap-3";
const skeleton = (n: number) => Array.from({ length: n }, (_, i) => <li key={i} className="h-44 border border-line" aria-hidden="true" />);

export default function HomePage() {
  const digest = useApi<{ digest: Digest }>("/api/changes?view=digest&hours=24");
  const files = useApi<{ dossiers: Dossier[] }>("/api/dossiers");
  const calendar = useApi<{ events: CalendarEvent[] }>("/api/calendar");
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }, []);

  const d = digest.data?.digest;
  const changes = d?.sections.reduce((n, s) => n + s.changes.length, 0);
  const dossiers = files.data?.dossiers ?? [];
  const inNegotiation = dossiers.filter((x) => /negotiation|trilogue/i.test(x.lastActivity?.label ?? "")).length;
  const pending = (v: number | undefined, loading: boolean, error: boolean) => (loading ? "…" : error || v === undefined ? "—" : v);

  // Dated events only: a planned adoption is a quarter, not a deadline.
  const dates = (calendar.data?.events ?? []).filter((e) => e.kind !== "Planned adoption").slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-[#10151c]">
        <Image
          src="/hero-grid.jpg"
          alt="Power lines crossing green fields near Bologna, Italy"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-[center_62%]"
        />
        {/* Scrim: darkens the lower half so white text holds at least 4.5:1 over sky and field. */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/50 to-black/10" aria-hidden="true" />
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 min-h-[30rem] lg:min-h-[36rem] flex flex-col justify-end pt-24 pb-6">
          <p className="text-sm sm:text-base text-white/90 min-h-6">{today}</p>
          <h1 id="hero-title" className="mt-2 max-w-4xl font-serif text-[2.5rem] sm:text-6xl lg:text-7xl leading-[1.04] font-bold tracking-[-0.02em] text-white">
            EU energy policy, tracked every day
          </h1>
          <p className="mt-4 max-w-2xl font-serif text-lg sm:text-xl text-white/90">
            What changed in Brussels since yesterday, what is due, and where each watched file stands, straight from the official sources.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/enel/digest" variant="primary">See what changed <ArrowRight className="w-4 h-4" aria-hidden="true" /></ButtonLink>
            <Link href="/enel/calendar" className="inline-flex items-center justify-center min-h-11 px-4 text-sm font-semibold text-white border border-white hover:bg-white hover:text-[#16181d] transition-colors">
              Open the calendar
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 border-t border-white/40 sm:divide-x sm:divide-white/25">
            <Figure value={pending(changes, digest.loading, digest.error)} label="changes since yesterday" href="/enel/digest" />
            <Figure value={pending(d?.deadlines.length, digest.loading, digest.error)} label="consultations closing within 14 days" href="/enel/calendar" />
            <Figure value={pending(files.data ? inNegotiation : undefined, files.loading, files.error)} label="watched files in negotiation" href="/enel/dossiers" />
            <Figure value={pending(files.data ? dossiers.length : undefined, files.loading, files.error)} label="watched legislative files" href="/enel/dossiers" />
          </div>
          <p className="mt-2 text-xs text-white/75 text-right">
            Photo: <a href={PHOTO_PAGE} target="_blank" rel="noopener noreferrer" className="underline">Giorgio Galeotti, CC BY 4.0, via Wikimedia Commons</a>
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 py-12 lg:py-16 space-y-14">
        {/* Deadlines */}
        <section aria-labelledby="deadlines">
          <SectionHeading id="deadlines" title="Deadlines and key dates" href="/enel/calendar" linkLabel="Full calendar" />
          {calendar.error ? (
            <ErrorState onRetry={calendar.reload} />
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy={calendar.loading}>
              {calendar.loading
                ? skeleton(3)
                : dates.map((e, n) => (
                    <li key={`${e.date}-${e.kind}-${n}`}>
                      <article className={cardClass}>
                        <p className="font-serif text-2xl font-bold text-fg">{formatDate(e.date)}</p>
                        <p><Badge tone={e.kind === "Consultation deadline" ? "success" : "neutral"}>{e.kind}</Badge></p>
                        <h3 className="font-sans text-base font-semibold text-fg">
                          {e.kind === "Plenary sitting" ? `Parliament plenary${e.place ? ` in ${e.place}` : ""}${e.start ? `, from ${e.start}` : ""}` : e.title}
                        </h3>
                        <p className="mt-auto text-sm">
                          {e.kind === "Plenary sitting" ? (
                            <Link href="/enel/calendar" className={linkClass}>See the agenda</Link>
                          ) : (
                            <a href={e.url} target="_blank" rel="noopener noreferrer" className={linkClass}>Open the consultation<span className="sr-only"> (opens in a new tab)</span></a>
                          )}
                        </p>
                      </article>
                    </li>
                  ))}
            </ul>
          )}
          {calendar.loading && <p className="mt-3 text-sm text-muted" role="status">Loading dates… The first load of the day can take up to 30 seconds.</p>}
          {!calendar.loading && !calendar.error && dates.length === 0 && <p className="text-muted">Nothing is scheduled.</p>}
        </section>

        {/* Legislative files */}
        <section aria-labelledby="files">
          <SectionHeading id="files" title="Legislative files" href="/enel/dossiers" linkLabel="All files" />
          {files.error ? (
            <ErrorState onRetry={files.reload} />
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy={files.loading}>
              {files.loading
                ? skeleton(6)
                : dossiers.map((x) => {
                    const rapporteur = x.actors.find((a) => a.role === "Rapporteur");
                    return (
                      <li key={x.id}>
                        <Link href={`/enel/dossiers/${x.id}`} className={`${cardClass} group hover:bg-sunken transition-colors`}>
                          <span className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm text-subtle">{x.reference}</span>
                            <Badge tone={!x.available ? "neutral" : x.stage.startsWith("Adopted") ? "success" : "info"}>{x.stage}</Badge>
                          </span>
                          <h3 className="text-xl font-bold text-fg group-hover:underline">{x.name}</h3>
                          <span className="text-sm text-muted">
                            {x.lastActivity ? `${x.lastActivity.label}, ${formatDate(x.lastActivity.date)}` : "No activity yet"}
                          </span>
                          <span className="mt-auto pt-3 border-t border-line text-sm text-muted">
                            Rapporteur: {rapporteur ? `${rapporteur.name} (${[rapporteur.group, rapporteur.country].filter(Boolean).join(", ")})` : "not appointed yet"}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
            </ul>
          )}
        </section>

        {/* Index */}
        <section aria-labelledby="index">
          <div className="rule-double pt-4 mb-6">
            <h2 id="index" className="text-2xl sm:text-3xl font-bold tracking-[-0.01em] text-fg">Everything on this site</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-10 gap-y-8">
            {NAV.map((group) => (
              <div key={group.label}>
                <h3 className="pb-1.5 mb-1 border-b border-line-strong font-sans text-xs font-semibold uppercase tracking-[0.08em] text-subtle">{group.label}</h3>
                <ul className="divide-y divide-line">
                  {group.items.map((item) => (
                    <li key={item.href} className="py-2.5">
                      <Link href={item.href} className="font-semibold text-link hover:underline">{item.label}</Link>
                      <span className="block text-sm text-muted">{item.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {d && !d.persistent && <p className="text-sm text-subtle">Change history is kept in server memory only, so it restarts when the server does.</p>}
      </div>
    </>
  );
}
