"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge, Card, EmptyState, Loadable, Page, SearchBox, Segmented, SourceNote, formatDate, formatStamp, linkClass, plural, useApi } from "@/components/ui";
import type { RadarItem } from "@/lib/types";

type View = "Upcoming" | "Overdue" | "Adopted";
const VIEWS: { value: View; label: string }[] = [
  { value: "Upcoming", label: "Coming up" },
  { value: "Overdue", label: "Past planned quarter" },
  { value: "Adopted", label: "Adopted" },
];

export default function RadarPage() {
  const { data, loading, error, reload } = useApi<{ items: RadarItem[]; fetchedAt: string | null }>("/api/radar?all=1");
  const [view, setView] = useState<View>("Upcoming");
  const [search, setSearch] = useState("");

  const needle = search.trim().toLowerCase();
  const all = data?.items ?? [];
  const items = all
    .filter((i) => i.status === view)
    .filter((i) => !needle || `${i.title} ${i.actType} ${i.stage}`.toLowerCase().includes(needle))
    .sort((a, b) =>
      view === "Upcoming"
        ? (a.plannedSort ?? "9999").localeCompare(b.plannedSort ?? "9999") || a.title.localeCompare(b.title)
        : (b.adoptionDate ?? b.plannedSort ?? "").localeCompare(a.adoptionDate ?? a.plannedSort ?? "")
    );
  const count = (v: View) => all.filter((i) => i.status === v).length;

  return (
    <Page>
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <Segmented label="Show" options={VIEWS.map((v) => ({ value: v.value, label: data ? `${v.label} (${count(v.value)})` : v.label }))} value={view} onChange={setView} />
        <div className="lg:w-96">
          <SearchBox label="Filter initiatives" hideLabel value={search} onChange={setSearch} placeholder="Filter by title, act type or stage" />
        </div>
      </div>

      <Loadable loading={loading} error={error} onRetry={reload} message="Reading the Commission's pipeline…">
        {items.length === 0 ? (
          <EmptyState title="No initiatives match" message={needle ? "Try a shorter or different word." : "Nothing in this group right now."} />
        ) : (
          <Card padded={false}>
            <div className="hidden md:grid grid-cols-[8rem_1fr_12rem_10rem_12rem] gap-4 px-5 py-2.5 border-b border-line bg-sunken text-xs font-semibold uppercase tracking-wide text-subtle rounded-t-lg">
              <span>{view === "Adopted" ? "Adopted" : "Planned"}</span>
              <span>Initiative</span>
              <span>Act type</span>
              <span>Stage</span>
              <span>Feedback</span>
            </div>
            <ul className="divide-y divide-line">
              {items.map((i) => (
                <li key={i.id} className="grid grid-cols-1 md:grid-cols-[8rem_1fr_12rem_10rem_12rem] gap-x-4 gap-y-1.5 px-4 sm:px-5 py-4">
                  <span className="text-sm font-semibold tabular-nums text-fg">
                    {view === "Adopted" ? formatDate(i.adoptionDate) : i.plannedPeriod ?? <span className="font-normal text-subtle">No quarter given</span>}
                  </span>
                  <div className="min-w-0">
                    <a href={i.url} target="_blank" rel="noopener noreferrer" className="font-medium text-fg hover:text-link hover:underline">
                      {i.title}
                    </a>
                    {i.major && <span className="ml-2 align-middle"><Badge tone="info">Major initiative</Badge></span>}
                    {i.summary && <p className="mt-1 text-sm text-muted line-clamp-2">{i.summary}</p>}
                  </div>
                  <span className="text-sm text-muted"><span className="md:hidden text-subtle">Act type: </span>{i.actType || "—"}</span>
                  <span className="text-sm text-muted"><span className="md:hidden text-subtle">Stage: </span>{i.stage}</span>
                  <span className="text-sm space-y-1">
                    {i.feedback === "Open" ? (
                      <Badge tone="success">Open until {formatDate(i.feedbackEnd)}</Badge>
                    ) : i.feedback === "Upcoming" ? (
                      <Badge tone="warning">Opens later</Badge>
                    ) : (
                      <span className="text-subtle">No open period</span>
                    )}
                    {i.totalFeedback > 0 && (
                      <Link href={`/enel/peers?pid=${i.id}`} className={`block ${linkClass}`}>
                        {plural(i.totalFeedback, "response")} · peers
                      </Link>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Loadable>

      <SourceNote>
        Source: European Commission, Have Your Say (energy-tagged initiatives only; grid-relevant files tagged under other topics are not listed).
        Planned quarters are the Commission&apos;s indicative planning and often slip. “Past planned quarter” means the quarter has passed with no
        adoption recorded; the older entries are mostly stale records.{data?.fetchedAt && <> Loaded {formatStamp(data.fetchedAt)}.</>}
      </SourceNote>
    </Page>
  );
}
