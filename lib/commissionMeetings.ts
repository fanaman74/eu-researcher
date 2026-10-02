/**
 * Commission meeting transparency: meetings of Commissioners, cabinet members and
 * Directors-General / management staff with interest representatives.
 *
 * Source: the Commission's daily XML exports, ~17 MB in total, cut to the 2024–2029 term.
 * Coverage is the Commission only — MEP and Council meetings are not in this data —
 * and subjects are free text typed by the Commission.
 */
import { cached, cachedAt } from "./cache";
import { PEERS, matchPeer } from "./peers";
import type { CommissionMeeting, PeerMeetingStats } from "./types";

const BASE = "https://ec.europa.eu/transparency-initiative/meetings/data/meetings/dataxml?name=";
const FILES: { name: string; level: CommissionMeeting["level"] }[] = [
  { name: "meetingscommissionrepresentatives2429", level: "Cabinet" },
  { name: "meetingsdirectorgenerals", level: "DG" },
];
const TTL_MS = 12 * 60 * 60 * 1000;
const CACHE_KEY = "commission-meetings";
const MAX_RESULTS = 200;
/**
 * Start of the 2024–2029 Commission. The management-staff export reaches back to
 * 2014 while the cabinet export covers this term only, so both are cut to the same
 * period — otherwise cabinet and DG counts would not be comparable.
 */
export const TERM_START = "2024-12-01";

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function decodeOnce(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] !== "#") return NAMED[code.toLowerCase()] ?? whole;
    const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole;
  });
}
/** The export double-encodes entities ("&amp;#246;"), so decode twice. */
const text = (s: string | undefined) => decodeOnce(decodeOnce(s ?? "")).replace(/\s+/g, " ").trim();
const tag = (xml: string, name: string) => new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(xml)?.[1];

/** Parse one export file. Exported for tests. */
export function parseMeetings(xml: string, level: CommissionMeeting["level"]): CommissionMeeting[] {
  const out: CommissionMeeting[] = [];
  for (const m of xml.matchAll(/<meeting>([\s\S]*?)<\/meeting>/g)) {
    const body = m[1];
    const host = level === "Cabinet" ? text(tag(body, "cabinet")) : `DG ${text(tag(body, "dgacronym"))} — ${text(tag(body, "dgname"))}`;
    out.push({
      date: text(tag(body, "date")),
      level,
      host,
      subject: text(tag(body, "subject")),
      location: text(tag(body, "location")),
      organisations: [...body.matchAll(/<entity>([\s\S]*?)<\/entity>/g)].map((e) => ({
        name: text(tag(e[1], "name")),
        id: text(tag(e[1], "id")),
      })),
      officials: [...body.matchAll(/<representative>([\s\S]*?)<\/representative>/g)].map((r) => {
        const title = text(tag(r[1], "title"));
        return title ? `${text(tag(r[1], "name"))} (${title})` : text(tag(r[1], "name"));
      }),
    });
  }
  return out;
}

async function allMeetings(): Promise<CommissionMeeting[]> {
  return cached(CACHE_KEY, TTL_MS, async () => {
    const sets = await Promise.all(
      FILES.map(async ({ name, level }) => {
        const res = await fetch(BASE + name, { signal: AbortSignal.timeout(120000) });
        if (!res.ok) throw new Error(`Commission meetings export failed with HTTP ${res.status}.`);
        return parseMeetings(await res.text(), level);
      })
    );
    return sets.flat().filter((m) => m.date >= TERM_START).sort((a, b) => b.date.localeCompare(a.date));
  });
}

export const meetingsFetchedAt = () => cachedAt(CACHE_KEY);

const peersOf = (m: CommissionMeeting) => [...new Set(m.organisations.map((o) => matchPeer(o.name)).filter(Boolean))] as string[];

/** Meeting counts per peer since TERM_START. */
export async function peerBenchmark(): Promise<PeerMeetingStats[]> {
  const meetings = await allMeetings();
  const yearAgo = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
  const stats = new Map<string, PeerMeetingStats>(
    PEERS.map((p) => [p.name, { peer: p.name, cabinet: 0, dg: 0, last12Months: 0, lastMeeting: null }])
  );
  for (const m of meetings) {
    for (const peer of peersOf(m)) {
      const s = stats.get(peer)!;
      if (m.level === "Cabinet") s.cabinet++;
      else s.dg++;
      if (m.date >= yearAgo) s.last12Months++;
      if (!s.lastMeeting || m.date > s.lastMeeting) s.lastMeeting = m.date;
    }
  }
  return [...stats.values()].sort((a, b) => b.cabinet + b.dg - (a.cabinet + a.dg));
}

/** Meetings for one peer (by name) and/or matching free text in subject, host or organisation. Newest first. */
export async function findMeetings({ peer, q }: { peer?: string; q?: string }): Promise<{ meetings: CommissionMeeting[]; total: number }> {
  const meetings = await allMeetings();
  const needle = (q ?? "").trim().toLowerCase();
  const hits = meetings.filter((m) => {
    if (peer && !peersOf(m).includes(peer)) return false;
    if (!needle) return true;
    return (
      m.subject.toLowerCase().includes(needle) ||
      m.host.toLowerCase().includes(needle) ||
      m.organisations.some((o) => o.name.toLowerCase().includes(needle))
    );
  });
  return { meetings: hits.slice(0, MAX_RESULTS), total: hits.length };
}

/** Meetings involving any peer since `sinceDate` (YYYY-MM-DD). Used by the change feed and digest. */
export async function recentPeerMeetings(sinceDate: string): Promise<(CommissionMeeting & { peers: string[] })[]> {
  const meetings = await allMeetings();
  return meetings
    .filter((m) => m.date >= sinceDate)
    .map((m) => ({ ...m, peers: peersOf(m) }))
    .filter((m) => m.peers.length > 0);
}

/** Stable id for a meeting (the export has none). */
export function meetingId(m: CommissionMeeting): string {
  return `${m.date}|${m.host}|${m.organisations.map((o) => o.id || o.name).join(",")}|${m.subject}`.slice(0, 400);
}
