/**
 * Morning digest: what changed in the monitored sources over a time window, plus
 * the consultation deadlines coming up. Rendered on /enel/digest and as plain
 * text for pasting into an email or chat message.
 */
import { listChanges } from "./changeFeed";
import { listRadar } from "./radar";
import type { ChangeEvent, ChangeSource, RadarItem } from "./types";

const DEADLINE_WINDOW_DAYS = 14;

export const SOURCE_LABELS: Record<ChangeSource, string> = {
  radar: "Commission pipeline",
  dossier: "Legislative files",
  press: "Commission announcements",
  meeting: "Commission meetings with peers",
};

export interface Digest {
  generatedAt: string;
  hours: number;
  /** False when history lives only in server memory (no database). */
  persistent: boolean;
  sections: { source: ChangeSource; label: string; changes: ChangeEvent[] }[];
  deadlines: Pick<RadarItem, "id" | "title" | "feedbackEnd" | "url" | "totalFeedback">[];
}

export async function getDigest(hours = 24): Promise<Digest> {
  const window = Math.min(Math.max(hours, 1), 24 * 14);
  const [{ changes, persistent }, radar] = await Promise.all([
    listChanges({ days: window / 24 }),
    listRadar().catch(() => [] as RadarItem[]),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const limit = new Date(Date.now() + DEADLINE_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);

  return {
    generatedAt: new Date().toISOString(),
    hours: window,
    persistent,
    sections: (Object.keys(SOURCE_LABELS) as ChangeSource[])
      .map((source) => ({ source, label: SOURCE_LABELS[source], changes: changes.filter((c) => c.source === source) }))
      .filter((s) => s.changes.length > 0),
    deadlines: radar
      .filter((i) => i.feedback === "Open" && i.feedbackEnd && i.feedbackEnd >= today && i.feedbackEnd <= limit)
      .sort((a, b) => a.feedbackEnd!.localeCompare(b.feedbackEnd!))
      .map(({ id, title, feedbackEnd, url, totalFeedback }) => ({ id, title, feedbackEnd, url, totalFeedback })),
  };
}

/** Plain-text rendering. `origin` turns in-app links (e.g. /enel/dossiers/…) into absolute URLs. */
export function digestText(d: Digest, origin = ""): string {
  const abs = (url: string) => (url.startsWith("/") ? `${origin}${url}` : url);
  const day = new Date(d.generatedAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Brussels" });
  const lines = [`EU regulatory digest — ${day}`, `Changes detected in the last ${d.hours} hours.`, ""];

  if (d.sections.length === 0) lines.push("No changes detected in the monitored sources.", "");
  for (const s of d.sections) {
    lines.push(`${s.label.toUpperCase()} (${s.changes.length})`);
    for (const c of s.changes) {
      lines.push(`- [${c.kind === "new" ? "New" : "Changed"}] ${c.title}`, `  ${c.summary}`, `  ${abs(c.url)}`);
    }
    lines.push("");
  }

  lines.push(`CONSULTATION DEADLINES IN THE NEXT ${DEADLINE_WINDOW_DAYS} DAYS (${d.deadlines.length})`);
  if (d.deadlines.length === 0) lines.push("- None.");
  for (const x of d.deadlines) lines.push(`- ${x.feedbackEnd}: ${x.title} (${x.totalFeedback} responses so far)`, `  ${x.url}`);

  lines.push("", "Sources: European Commission (Have Your Say, press corner, meeting transparency), European Parliament Open Data.");
  return lines.join("\n");
}
