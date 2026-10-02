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
import { listRadar } from "./radar";
import type { CalendarEvent, RadarItem } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

async function plenaryDays(year: number): Promise<string[]> {
  return cached(`ep:plenary:${year}`, DAY_MS, async () => {
    const data = await epGet(`/meetings?year=${year}&offset=0&limit=400`);
    const days = (data.data as any[]).map((m) => String(m.activity_date ?? "").slice(0, 10)).filter(Boolean);
    return [...new Set(days)].sort();
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

  const [radar, thisYear, nextYear] = await Promise.allSettled([listRadar(), plenaryDays(year), plenaryDays(year + 1)]);
  const events: CalendarEvent[] = [];
  if (radar.status === "fulfilled") events.push(...radarEvents(radar.value, today));
  else gaps.push("Commission pipeline (consultation deadlines and planned quarters) could not be loaded.");

  const sittings = [thisYear, nextYear].flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (thisYear.status === "rejected") gaps.push("Parliament plenary dates could not be loaded.");
  for (const date of sittings.filter((d) => d >= today)) {
    events.push({ date, kind: "Plenary sitting", title: "European Parliament plenary sitting", url: "https://www.europarl.europa.eu/plenary/en/home.html" });
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
      "TRANSP:TRANSPARENT",
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
