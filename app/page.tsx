"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Badge, ButtonLink, ErrorState, Notice, formatDate, linkClass, useApi } from "@/components/ui";
import { OfficeNews, useOfficeNews } from "@/components/OfficeNews";
import { NAV } from "@/lib/navigation";
import type { Digest } from "@/lib/digest";
import type { CalendarEvent, Dossier } from "@/lib/types";

function WindFarm() {
  return (
    <div className="poster-art" aria-hidden="true">
      <div className="poster-plate">
        <span className="wind-sun" />
        <span className="wind-gust" />
        <span className="wind-gust wind-gust--low" />
        <span className="wind-field" />
        {["far", "middle", "near"].map((position) => (
          <div key={position} className={`wind-turbine wind-turbine--${position}`}>
            <span className="wind-rotor">
              <span className="wind-blade" />
              <span className="wind-blade" />
              <span className="wind-blade" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Figure({ value, label, href }: { value: number | "…" | "—"; label: string; href: string }) {
  const status = value === "…" ? "Loading" : value === "—" ? "Unavailable" : null;
  return (
    <li>
      <Link href={href} className="flex h-full items-center gap-4 px-4 py-3.5 lg:px-5 lg:py-4">
        <span className="figure-number text-xl" aria-hidden={status ? true : undefined}><span>{value}</span></span>
        <span className="text-[0.9375rem] leading-tight font-bold">
          {label}
          {status && <span className={status === "Loading" ? "sr-only" : "mt-1 block text-xs font-medium"}>{status}</span>}
        </span>
      </Link>
    </li>
  );
}

function SectionHeading({ id, title, href, linkLabel }: { id: string; title: string; href: string; linkLabel: string }) {
  return (
    <div className="home-band-title flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 py-5 sm:px-7 sm:py-6 lg:px-9">
      <h2 id={id} className="text-2xl leading-none font-black tracking-tight uppercase sm:text-4xl">{title}</h2>
      <ButtonLink href={href} size="sm">
        {linkLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </ButtonLink>
    </div>
  );
}

const cardClass = "home-data-card flex h-full flex-col gap-3 p-5 pr-8";
const skeleton = (n: number) => Array.from({ length: n }, (_, i) => <li key={i} className="loading-skeleton h-32 border-2 border-line-strong" aria-hidden="true" />);

export default function HomePage() {
  const digest = useApi<{ digest: Digest }>("/api/changes?view=digest&hours=24");
  const files = useApi<{ dossiers: Dossier[] }>("/api/dossiers");
  const calendar = useApi<{ events: CalendarEvent[]; gaps: string[] }>("/api/calendar");
  const officeNews = useOfficeNews();
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Brussels" }));
  }, []);

  const d = digest.data?.digest;
  const changes = d?.sections.reduce((n, s) => n + s.changes.length, 0);
  const dossiers = files.data?.dossiers ?? [];
  const inNegotiation = dossiers.filter((x) => /negotiation|trilogue/i.test(x.lastActivity?.label ?? "")).length;
  const pending = (v: number | undefined, loading: boolean, error: boolean): number | "…" | "—" => (loading ? "…" : error || v === undefined ? "—" : v);

  // Dated events only: a planned adoption is a quarter, not a deadline.
  const dates = (calendar.data?.events ?? []).filter((e) => e.kind !== "Planned adoption").slice(0, 6);
  const calendarGaps = calendar.data?.gaps ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-14 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10 lg:pb-20">
      <section aria-labelledby="hero-title">
        <div className="home-poster">
          <div className="poster-copy">
            <p className="mb-5 flex min-h-5 items-center gap-2 text-xs font-bold tracking-[0.12em] uppercase sm:text-sm">
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-danger" />
              {today}
            </p>
            <h1 id="hero-title" className="poster-title">EU energy <span>policy</span></h1>
            <p className="mt-5 max-w-[44ch] text-base leading-relaxed text-pretty sm:text-lg">
              Track what changed in Brussels since yesterday, what is due, and where each watched file stands, straight from the official sources.
            </p>
            <div className="mt-6 flex flex-wrap gap-3.5">
              <ButtonLink href="/enel/digest" variant="primary">See what changed <ArrowRight className="h-5 w-5" aria-hidden="true" /></ButtonLink>
              <ButtonLink href="/enel/calendar"><CalendarDays className="h-4 w-4" aria-hidden="true" /> Open the calendar</ButtonLink>
            </div>
          </div>
          <WindFarm />
        </div>

        <ul className="home-figures mt-6 sm:mt-8" aria-label="Today in numbers">
          <Figure value={pending(changes, digest.loading, digest.error)} label="Changes since yesterday" href="/enel/digest" />
          <Figure value={pending(d?.deadlines.length, digest.loading, digest.error)} label="Consultations closing within 14 days" href="/enel/calendar" />
          <Figure value={pending(files.data ? inNegotiation : undefined, files.loading, files.error)} label="Watched files in negotiation" href="/enel/dossiers" />
          <Figure value={pending(files.data ? dossiers.length : undefined, files.loading, files.error)} label="Watched legislative files" href="/enel/dossiers" />
        </ul>
      </section>

      <div className="mt-8 space-y-10 sm:mt-10 lg:space-y-12">
        {/* Office news */}
        <section aria-labelledby="office-news" className="home-band home-band--news">
          <SectionHeading id="office-news" title="Office news" href="/enel/office-news" linkLabel="All office news" />
          <div className="home-band-body space-y-4">
            <OfficeNews data={officeNews.data} loading={officeNews.loading} error={officeNews.error} onRetry={officeNews.reload} limit={4} compact showSchedule />
          </div>
        </section>

        {/* Deadlines */}
        <section aria-labelledby="deadlines" className="home-band home-band--dates">
          <SectionHeading id="deadlines" title="Deadlines and key dates" href="/enel/calendar" linkLabel="Full calendar" />
          <div className="home-band-body space-y-4">
            {!calendar.loading && !calendar.error && calendarGaps.length > 0 && (
              <Notice tone="warning">
                <strong>Some calendar sources are unavailable.</strong>
                <ul className="mt-1 list-disc pl-5">
                  {calendarGaps.map((gap) => <li key={gap}>{gap}</li>)}
                </ul>
              </Notice>
            )}
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
            {!calendar.loading && !calendar.error && dates.length === 0 && calendarGaps.length === 0 && <p>Nothing is scheduled.</p>}
          </div>
        </section>

        {/* Legislative files */}
        <section aria-labelledby="files" className="home-band">
          <SectionHeading id="files" title="Legislative files" href="/enel/dossiers" linkLabel="All files" />
          <div className="home-band-body">
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
                          <Link href={`/enel/dossiers/${x.id}`} className={`${cardClass} group`}>
                            <span className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm text-subtle">{x.reference}</span>
                              <Badge tone={!x.available ? "neutral" : x.stage.startsWith("Adopted") ? "success" : "info"}>{x.stage}</Badge>
                            </span>
                            <h3 className="text-xl font-bold text-fg group-hover:underline">{x.name}</h3>
                            <span className="text-sm text-muted">
                              {x.lastActivity ? `${x.lastActivity.label}, ${formatDate(x.lastActivity.date)}` : "No activity yet"}
                            </span>
                            <span className="mt-auto pt-3 border-t border-line text-sm text-muted flex items-center justify-between gap-3">
                              <span>Rapporteur: {rapporteur ? `${rapporteur.name} (${[rapporteur.group, rapporteur.country].filter(Boolean).join(", ")})` : "not appointed yet"}</span>
                              <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                            </span>
                          </Link>
                        </li>
                      );
                    })}
              </ul>
            )}
          </div>
        </section>

        {/* Index */}
        <section aria-labelledby="index" className="home-band home-band--directory">
          <div className="home-band-title directory-heading px-4 py-6 sm:px-7 lg:px-9">
            <h2 id="index" className="text-2xl leading-none font-black tracking-tight uppercase sm:text-4xl">Everything on this site</h2>
          </div>
          <div className="grid grid-cols-1 gap-7 px-4 py-6 sm:grid-cols-2 sm:px-7 lg:px-9 xl:grid-cols-4">
            {NAV.map((group) => (
              <div key={group.label}>
                <h3 className="mb-1 border-b-2 border-line-strong pb-2 text-xs font-bold tracking-widest uppercase">{group.label}</h3>
                <ul className="divide-y divide-line-strong">
                  {group.items.map((item) => (
                    <li key={item.href} className="py-2.5">
                      <Link href={item.href} className="font-bold hover:underline">{item.label}</Link>
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
    </div>
  );
}
