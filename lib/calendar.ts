/**
 * Regulatory calendar: consultation deadlines and planned adoption quarters (radar)
 * plus Parliament plenary sittings, with an iCalendar export for Outlook.
 *
 * Not covered: Parliament committee meetings (not in the EP API), the Council
 * calendar (blocks automated access) and transposition deadlines (the source
 * carries several conflicting dates per directive).
 */
import { cached } from "./cache";
import { epGet } from "./meps";
import { ENERGY_RE } from "./epQuestions";
import { listRadar } from "./radar";
import type { CalendarEvent, RadarItem } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

const PLACES: Record<string, string> = { FRA_SXB: "Strasbourg", BEL_BRU: "Brussels", LUX_LUX: "Luxembourg" };
const tail = (s: unknown) => String(s ?? "").split("/").pop() ?? "";
/** JSON-LD writes a single value as a bare object and several as an array. */
const list = (v: unknown): any[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
const AGENDA_URL = (date: string) => `https://www.europarl.europa.eu/doceo/document/OJQ-10-${date}_EN.html`;

interface Sitting {
  date: string;
  place: string;
  /** Local start time of the first scheduled part, "17:00", when published. */
  start: string | null;
}

/** One sitting from a meeting record. Exported for tests. */
export function toSitting(m: any): Sitting | null {
  const date = String(m.activity_date ?? "").slice(0, 10);
  if (!date) return null;
  // Scheduled parts are identified by their start time: "…-TF-1700".
  const starts = list(m.was_scheduled_in)
    .map((id) => /-TF-(\d{2})(\d{2})$/.exec(String(id)))
    .filter(Boolean)
    .map((x) => `${x![1]}:${x![2]}`)
    .sort();
  return { date, place: PLACES[tail(m.hasLocality)] ?? "", start: starts[0] ?? null };
}

async function plenarySittings(year: number): Promise<Sitting[]> {
  return cached(`ep:plenary:${year}`, DAY_MS, async () => {
    const data = await epGet(`/meetings?year=${year}&offset=0&limit=400`);
    const byDate = new Map<string, Sitting>();
    for (const m of data.data as any[]) {
      const s = toSitting(m);
      if (s && !byDate.has(s.date)) byDate.set(s.date, s);
    }
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  });
}

export interface AgendaPart {
  /** "17:00–19:30" */
  time: string;
  /** "Debates", "Votes", … */
  label: string;
  items: { title: string; kind: "Debate" | "Vote" | "Other"; energy: boolean }[];
}

/** The source writes some part labels in capitals ("KEY DEBATE", "VOTES"). */
const sentenceCase = (s: string) => (s === s.toUpperCase() ? s.charAt(0) + s.slice(1).toLowerCase() : s);

/** Group a sitting's draft agenda into its timed parts. Exported for tests. */
export function toAgenda(rows: any[]): AgendaPart[] {
  const hhmm = (iso: unknown) => /T(\d{2}:\d{2})/.exec(String(iso ?? ""))?.[1] ?? "";
  const kindOf = (type: string): AgendaPart["items"][number]["kind"] => (type === "PLENARY_DEBATE" ? "Debate" : type === "PLENARY_VOTE" ? "Vote" : "Other");
  const items = new Map(
    rows
      .filter((r) => tail(r.had_activity_type) !== "MEETING_PART")
      .map((r) => [String(r.id), { order: Number(r.activity_order ?? 9999), title: String(r.activity_label?.en ?? "").trim(), kind: kindOf(tail(r.had_activity_type)) }])
  );
  const used = new Set<string>();
  const build = (ids: string[]) =>
    ids
      .map((id) => items.get(id))
      .filter((i): i is NonNullable<typeof i> => Boolean(i && i.title))
      .sort((a, b) => a.order - b.order)
      .map(({ title, kind }) => ({ title, kind, energy: ENERGY_RE.test(title) }));

  const parts: (AgendaPart & { sort: string })[] = rows
    .filter((r) => tail(r.had_activity_type) === "MEETING_PART")
    .map((r) => {
      const ids = list(r.consists_of).map(String);
      ids.forEach((id) => used.add(id));
      const start = hhmm(r.activity_start_date);
      const end = hhmm(r.activity_end_date);
      return { sort: start, time: end && end !== start ? `${start}–${end}` : start, label: sentenceCase(String(r.agendaLabel?.en ?? r.activity_label?.en ?? "Session")), items: build(ids) };
    })
    .filter((p) => p.items.length > 0)
    .sort((a, b) => a.sort.localeCompare(b.sort));

  const loose = build([...items.keys()].filter((id) => !used.has(id)));
  if (loose.length > 0) parts.push({ sort: "99", time: "", label: "Other items", items: loose });
  return parts.map((p) => ({ time: p.time, label: p.label, items: p.items }));
}

/** The draft agenda of one plenary sitting. The Parliament fills it in during the weeks before. */
export async function getSittingAgenda(date: string): Promise<{ date: string; parts: AgendaPart[]; agendaUrl: string } | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return cached(`ep:agenda:${date}`, 6 * 60 * 60 * 1000, async () => {
    try {
      const data = await epGet(`/meetings/MTG-PL-${date}/foreseen-activities?offset=0&limit=300`);
      return { date, parts: toAgenda(data?.data ?? []), agendaUrl: AGENDA_URL(date) };
    } catch (err) {
      // 404 / empty body: nothing published for that day yet.
      if ((err as any)?.status === 404 || err instanceof SyntaxError) return { date, parts: [], agendaUrl: AGENDA_URL(date) };
      throw err;
    }
  });
}

/** Radar items as calendar events. Exported for tests. */
export function radarEvents(items: RadarItem[], today: string): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  for (const i of items) {
    if (i.feedback === "Open" && i.feedbackEnd && i.feedbackEnd >= today) {
      out.push({ date: i.feedbackEnd, kind: "Consultation deadline", title: i.title, url: i.url });
    }
    if (i.status === "Upcoming" && i.plannedSort) {
      const [year, q] = i.plannedSort.split("-").map(Number);
      // A quarter is a three-month window; pin the entry to its last day rather than
      // drawing a quarter-long banner across the calendar.
      out.push({
        date: isoDay(new Date(Date.UTC(year, q * 3, 0))),
        kind: "Planned adoption",
        title: `${i.title} — ${i.actType || "act"} planned by end of ${i.plannedPeriod}`,
        url: i.url,
      });
    }
  }
  return out;
}

export async function listCalendar(): Promise<{ events: CalendarEvent[]; gaps: string[] }> {
  const today = isoDay(new Date());
  const year = new Date().getUTCFullYear();
  const gaps: string[] = [];

  const [radar, thisYear, nextYear] = await Promise.allSettled([listRadar(), plenarySittings(year), plenarySittings(year + 1)]);
  const events: CalendarEvent[] = [];
  if (radar.status === "fulfilled") events.push(...radarEvents(radar.value, today));
  else gaps.push("Commission pipeline (consultation deadlines and planned quarters) could not be loaded.");

  const sittings = [thisYear, nextYear].flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (thisYear.status === "rejected") gaps.push("Parliament plenary dates could not be loaded.");
  for (const s of sittings.filter((x) => x.date >= today)) {
    events.push({
      date: s.date,
      kind: "Plenary sitting",
      title: `European Parliament plenary sitting${s.place ? `, ${s.place}` : ""}`,
      url: AGENDA_URL(s.date),
      place: s.place || undefined,
      start: s.start ?? undefined,
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));
  return { events, gaps };
}

const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\r?\n/g, "\\n");
const icsDay = (iso: string) => iso.replace(/-/g, "");
const nextDay = (iso: string) => isoDay(new Date(Date.parse(`${iso}T00:00:00Z`) + DAY_MS));

/** Fold a content line at 75 octets as RFC 5545 requires. */
function fold(line: string): string {
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = Buffer.byteLength(ch);
    if (bytes + size > (out.length === 0 ? 75 : 74)) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

/** iCalendar (RFC 5545) with all-day events; imports into Outlook, Google Calendar and Apple Calendar. */
export function toIcs(events: CalendarEvent[], stamp = new Date()): string {
  const dtstamp = stamp.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EU Researcher//Regulatory Calendar//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:EU regulatory calendar"];
  events.forEach((e, n) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${icsDay(e.date)}-${n}-${e.kind.replace(/\s+/g, "-").toLowerCase()}@eu-researcher`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${icsDay(e.date)}`,
      `DTEND;VALUE=DATE:${icsDay(nextDay(e.date))}`, // DTEND is exclusive
      `SUMMARY:${icsText(`${e.kind}: ${e.title}`)}`,
      `DESCRIPTION:${icsText(e.url)}`,
      `URL:${e.url}`,
      ...(e.place ? [`LOCATION:${icsText(e.place)}`] : []),
      "TRANSP:TRANSPARENT",
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
