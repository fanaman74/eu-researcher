/**
 * European Parliament written questions from the EP Open Data Portal API v2
 * (https://data.europarl.europa.eu/api/v2, no key).
 *
 * The API exposes title, authors, addressee, dates and whether a reply exists.
 * It does NOT expose the question text as data (only .docx/.pdf files), so none
 * is shown, and no risk rating or committee is invented.
 */
import type { ParliamentQuestion } from "./types";

const EP = "https://data.europarl.europa.eu/api/v2";
const DOCEO = "https://www.europarl.europa.eu/doceo/document";

const LIST_TTL_MS = 6 * 60 * 60 * 1000;
const UNANSWERED_RECHECK_MS = 12 * 60 * 60 * 1000;
const WINDOW = 300; // newest questions tracked (~3 weeks); fills over successive refreshes
const LIST_PAGE = 1000;
const CONCURRENCY = 4;
const REQUEST_BUDGET = 130; // the API allows ~150 requests before answering HTTP 429 (Retry-After: 60)
const REQUEST_WAIT_MS = 20000; // never make a page load wait longer than this for a refresh
const MAX_RESULTS = 60;
/** Title keywords that make a question relevant to an electricity / grid / energy-policy team. */
const ENERGY_RE =
  /\b(energy|electric\w*|grid\w*|renewable\w*|solar|photovoltaic\w*|wind|hydrogen|nuclear|gas|power|tariff\w*|state aid|climate|emission\w*|decarbon\w*|battery|batteries|storage|interconnect\w*|permitting|pylon\w*|transmission|smart meter\w*|heat pump\w*|data cent\w*|ACER|REMIT|RED III|net[- ]zero|hydropower|biomass|biogas|LNG)\b/i;

class RateLimitedError extends Error {}

async function getJson(url: string): Promise<any> {
  // Retry transient failures (5xx / in-body "error" object); never retry 404 or 429.
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * attempt));
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/ld+json" },
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 429) throw new RateLimitedError("EP Open Data rate limit reached (HTTP 429).");
      if (res.status === 404) throw Object.assign(new Error("EP record not found."), { permanent: true });
      if (!res.ok) throw new Error(`EP Open Data request failed with HTTP ${res.status}.`);
      const json = await res.json();
      if (json?.error) throw new Error(`EP Open Data error: ${String(json.error).slice(0, 80)}`);
      return json;
    } catch (err) {
      lastError = err;
      if ((err as any)?.permanent || err instanceof RateLimitedError) break;
    }
  }
  throw lastError;
}
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

/** "E-10-2026-003604" -> { display: "E-003604/2026" } */
function displayId(identifier: string): string {
  const m = /^([A-Z])-\d+-(\d{4})-(\d+)$/.exec(identifier);
  return m ? `${m[1]}-${m[3]}/${m[2]}` : identifier;
}

function firstText(obj: Record<string, string> | undefined, preferred = "en"): string {
  if (!obj) return "";
  return obj[preferred] ?? Object.values(obj)[0] ?? "";
}

const ADDRESSEES: Record<string, string> = {
  COM: "European Commission",
  CONSIL: "Council of the EU",
  EEAS: "High Representative / EEAS",
};

/** Parse one question detail record into the API-facing shape. Exported for tests. */
export function parseQuestion(identifier: string, work: any): ParliamentQuestion {
  const expressions: any[] = work.is_realized_by ?? [];
  const en = expressions.find((e) => e.id?.endsWith("/en"));
  const alt = firstText((en ?? expressions.find((e) => e.title_alternative))?.title_alternative, "en");
  // "Question for written answer E-003603/2026 - to the Commission - Rule 144 - Name (Group), Name (Group)"
  const askedBy = alt.includes(" - ") ? alt.slice(alt.lastIndexOf(" - ") + 3).trim() : "";

  const addressee = (work.workHadParticipation ?? []).find((p: any) => p.participation_role?.endsWith("ADDRESSEE"));
  const orgCode = String(addressee?.had_participant_organization?.[0] ?? "").replace(/^org\//, "");
  const answer = (work.inverse_answers_to ?? [])[0];
  const answered = Boolean(answer);
  const docId = identifier;

  return {
    id: displayId(identifier),
    title: firstText(work.title_dcterms, "en") || displayId(identifier),
    askedBy: askedBy || "MEP (see source)",
    date: work.document_date ?? "",
    target: ADDRESSEES[orgCode] ?? (orgCode || "Not specified"),
    status: answered ? "Answered" : "Answer Pending",
    answerDate: answered ? answer.document_date ?? null : null,
    url: `${DOCEO}/${docId}_EN.html`,
    answerUrl: answered ? `${DOCEO}/${docId}-ASW_EN.html` : null,
  };
}

export function isEnergyRelevant(q: ParliamentQuestion): boolean {
  return ENERGY_RE.test(q.title);
}

/** Parsed questions keyed by display id, with when each was last fetched. */
const details = new Map<string, { q: ParliamentQuestion; at: number }>();
let idList: { at: number; newest: string[] } | null = null;
let refreshing: Promise<void> | null = null;

async function listIdentifiers(year: number): Promise<string[]> {
  const ids: string[] = [];
  for (let offset = 0; offset < 20000; offset += LIST_PAGE) {
    const page = await getJson(
      `${EP}/parliamentary-questions?year=${year}&format=application%2Fld%2Bjson&offset=${offset}&limit=${LIST_PAGE}`
    );
    const rows: any[] = page.data ?? [];
    ids.push(...rows.map((r) => String(r.identifier)));
    if (rows.length < LIST_PAGE) break;
  }
  return ids;
}

async function newestIdentifiers(): Promise<string[]> {
  if (idList && Date.now() - idList.at < LIST_TTL_MS) return idList.newest;
  const year = new Date().getFullYear();
  let ids = await listIdentifiers(year);
  if (ids.length < WINDOW) ids = ids.concat(await listIdentifiers(year - 1));
  // Identifiers are E-<term>-<year>-<number>; order by year then number, newest first.
  const key = (id: string) => {
    const m = /-(\d{4})-(\d+)$/.exec(id);
    return m ? Number(m[1]) * 1_000_000 + Number(m[2]) : 0;
  };
  const newest = ids.sort((a, b) => key(b) - key(a)).slice(0, WINDOW);
  idList = { at: Date.now(), newest };
  return newest;
}

/**
 * Fetch whatever is missing or stale, within the API's request budget.
 * Answered questions never change, so they are fetched once. Unanswered ones are
 * rechecked every 12h. A 429 stops the run; the next refresh picks up the rest.
 */
async function refresh(): Promise<void> {
  const newest = await newestIdentifiers();
  const now = Date.now();
  const todo = newest
    .filter((identifier) => {
      const have = details.get(displayId(identifier));
      return !have || (have.q.status !== "Answered" && now - have.at > UNANSWERED_RECHECK_MS);
    })
    .slice(0, REQUEST_BUDGET);

  let stop = false;
  await mapLimit(todo, CONCURRENCY, async (identifier) => {
    if (stop) return;
    try {
      const data = await getJson(`${EP}/parliamentary-questions/${identifier}?format=application%2Fld%2Bjson`);
      const q = parseQuestion(identifier, data.data[0]);
      details.set(q.id, { q, at: Date.now() });
    } catch (err) {
      if (err instanceof RateLimitedError) stop = true;
      else console.warn(`[EP] question ${identifier} skipped:`, (err as Error).message);
    }
  });
}

/** Start a refresh if none is running; resolves when it finishes (never rejects). */
function startRefresh(): Promise<void> {
  if (!refreshing) {
    refreshing = refresh()
      .catch((err) => console.warn("[EP] refresh failed:", (err as Error).message))
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

/** Populate the cache fully (used by the cron job, which may take as long as it needs). */
export async function warmQuestions(): Promise<void> {
  await startRefresh();
}

/**
 * Recent written questions. Without `q`, only energy-relevant ones (title keyword match);
 * with `q`, every tracked question whose title or authors match.
 * Never blocks on a full upstream scan: after REQUEST_WAIT_MS it returns what it has (`partial`).
 */
export async function findQuestions(
  q: string
): Promise<{ questions: ParliamentQuestion[]; tracked: number; partial: boolean; fetchedAt: string | null }> {
  const stale = !idList || Date.now() - idList.at >= LIST_TTL_MS;
  const work = details.size === 0 || stale ? startRefresh() : null;
  if (work) {
    await Promise.race([work, new Promise((r) => setTimeout(r, details.size === 0 ? REQUEST_WAIT_MS : 0))]);
  }

  const tracked = [...details.values()];
  const needle = q.trim().toLowerCase();
  const matches = tracked
    .map((d) => d.q)
    .filter((x) => (needle ? x.title.toLowerCase().includes(needle) || x.askedBy.toLowerCase().includes(needle) : isEnergyRelevant(x)))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  const newest = idList?.newest.length ?? 0;
  const latestFetch = tracked.reduce((m, d) => Math.max(m, d.at), 0);
  return {
    questions: matches.slice(0, MAX_RESULTS),
    tracked: tracked.length,
    partial: refreshing !== null || tracked.length < newest,
    fetchedAt: latestFetch ? new Date(latestFetch).toISOString() : null,
  };
}
