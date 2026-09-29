/**
 * European Commission "Have Your Say" data (public Better Regulation API, no key).
 *
 *  - initiatives:  brpapi/searchInitiatives, brpapi/groupInitiatives/{id}
 *  - feedback:     api/allFeedback?publicationId=…
 *
 * Only facts present in the API are returned. Nothing here infers sentiment or
 * "alignment" with any company; those fields do not exist in the source.
 */
import type { Consultation, ConsultationSubmission } from "./types";

const BRP = "https://ec.europa.eu/info/law/better-regulation/brpapi";
const API = "https://ec.europa.eu/info/law/better-regulation/api";
const PAGE_URL = "https://ec.europa.eu/info/law/better-regulation/have-your-say/initiatives";

const LIST_TTL_MS = 6 * 60 * 60 * 1000;
const DETAIL_TTL_MS = 60 * 60 * 1000;
const FEEDBACK_PAGE_SIZE = 100;
const MAX_FEEDBACK_PAGES = 5; // demographics are computed from at most 500 published responses
const MAX_LISTED = 20;
const MAX_RECENTLY_CLOSED = 10;
const MAX_SUBMISSIONS_SHOWN = 30;

const USER_TYPE_LABELS: Record<string, string> = {
  BUSINESS_ASSOCIATION: "Business associations",
  COMPANY: "Companies",
  PUBLIC_AUTHORITY: "Public authorities",
  EU_CITIZEN: "EU citizens",
  NON_EU_CITIZEN: "Non-EU citizens",
  NGO: "NGOs",
  CONSUMER_ORGANISATION: "Consumer organisations",
  ACADEMIC_RESEARCH_INSTITUTION: "Academic / research institutions",
  TRADE_UNION: "Trade unions",
  ENVIRONMENTAL_ORGANISATION: "Environmental organisations",
  OTHER: "Other",
};

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Have Your Say request failed with HTTP ${res.status}.`);
  return res.json();
}

function parseHysDate(raw: string | null | undefined): string | null {
  // "2026/12/14 23:59:59" -> "2026-12-14"
  if (!raw) return null;
  const m = /^(\d{4})\/(\d{2})\/(\d{2})/.exec(raw);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function labelUserType(t: string | undefined): string {
  if (!t) return "Unspecified";
  return USER_TYPE_LABELS[t] ?? t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, " ");
}

const cache = new Map<string, { at: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value as T;
  // Concurrent callers share one upstream load instead of each hammering the API.
  let pending = inflight.get(key) as Promise<T> | undefined;
  if (!pending) {
    pending = load()
      .then((value) => {
        cache.set(key, { at: Date.now(), value });
        return value;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  try {
    return await pending;
  } catch (err) {
    if (hit) return hit.value as T; // serve stale rather than failing
    throw err;
  }
}

/** Run `fn` over `items` with bounded concurrency. */
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

/** The publication that carries the consultation's feedback: prefer open, then most responses. */
function pickPublication(publications: any[]): any | null {
  const withFeedback = publications.filter((p) => p.receivingFeedbackStatus && p.receivingFeedbackStatus !== "DISABLED");
  const pool = withFeedback.length > 0 ? withFeedback : publications;
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => {
    const openA = a.receivingFeedbackStatus === "OPEN" ? 1 : 0;
    const openB = b.receivingFeedbackStatus === "OPEN" ? 1 : 0;
    return openB - openA || (b.totalFeedback ?? 0) - (a.totalFeedback ?? 0);
  })[0];
}

function statusLabel(receiving: string | undefined): string {
  switch (receiving) {
    case "OPEN": return "Open (Receiving Feedback)";
    case "CLOSED": return "Closed";
    case "UPCOMING": return "Upcoming";
    default: return "No feedback period";
  }
}

function toConsultation(
  init: { id: number; shortTitle: string; foreseenActType?: string; initiativeTranslations?: any[] },
  group: any
): Consultation {
  const pub = pickPublication(group.publications ?? []);
  const en = init.initiativeTranslations?.find((t) => t.language === "EN" && t.field === "SHORT_TITLE");
  return {
    pid: String(init.id),
    title: en?.value || init.shortTitle,
    status: statusLabel(pub?.receivingFeedbackStatus),
    totalSubmissions: pub?.totalFeedback ?? 0,
    closingDate: parseHysDate(pub?.endDate) ?? parseHysDate(pub?.feedbackEndDate),
    summary: group.dossierSummary ?? "",
    url: `${PAGE_URL}/${init.id}`,
    actType: init.foreseenActType ?? "",
    publicationId: pub?.id ?? null,
    demographics: { countries: [], sectors: [], sampleSize: 0 },
    submissions: [],
  };
}

/** Energy consultations: those receiving feedback now (soonest deadline first), then recently closed ones. */
export async function listConsultations(): Promise<Consultation[]> {
  return cached("list", LIST_TTL_MS, async () => {
    const searchPage = (page: number) =>
      getJson(`${BRP}/searchInitiatives?page=${page}&size=100&language=EN&topic=ENER&status=OPEN`)
        .then((r) => r.initiativeResultDtoPage);
    const first = await searchPage(0);
    const rest = await Promise.all(
      Array.from({ length: Math.min((first?.totalPages ?? 1) - 1, 4) }, (_, i) => searchPage(i + 1))
    );
    const initiatives: any[] = [first, ...rest].flatMap((p) => p?.content ?? []);

    const feedbackStatus = (i: any) =>
      (i.currentStatuses ?? []).find((s: any) => s.receivingFeedbackStatus === "OPEN" || s.receivingFeedbackStatus === "CLOSED");
    const byStatus = (wanted: string) =>
      initiatives.filter((i) => feedbackStatus(i)?.receivingFeedbackStatus === wanted);
    const endOf = (i: any): string => feedbackStatus(i)?.feedbackEndDate ?? "";

    // Open consultations first (soonest deadline), then the most recently closed ones.
    const open = byStatus("OPEN").sort((a, b) => endOf(a).localeCompare(endOf(b)));
    const closed = byStatus("CLOSED").sort((a, b) => endOf(b).localeCompare(endOf(a))).slice(0, MAX_RECENTLY_CLOSED);
    const selected = [...open, ...closed].slice(0, MAX_LISTED);

    const results = await mapLimit(selected, 12, async (init) => {
      try {
        return toConsultation(init, await getJson(`${BRP}/groupInitiatives/${init.id}`));
      } catch (err) {
        console.warn(`[HaveYourSay] detail failed for ${init.id}:`, err);
        return null;
      }
    });
    return results.filter((c): c is Consultation => c !== null);
  });
}

function toSubmission(f: any): ConsultationSubmission {
  const named = f.publication === "WITHINFO"; // respect the respondent's anonymity choice
  const isCitizen = f.userType === "EU_CITIZEN" || f.userType === "NON_EU_CITIZEN";
  // Individuals are never named; organisations only when they chose to be identified.
  const kind = labelUserType(f.userType).replace(/s$/, "");
  const stakeholder = isCitizen
    ? kind
    : named && f.organization
      ? f.organization
      : `${kind} (anonymous)`;
  const text = String(f.feedback ?? "").replace(/\s+/g, " ").trim();
  return {
    id: String(f.id),
    stakeholder,
    country: f.country ?? "",
    userType: labelUserType(f.userType),
    date: parseHysDate(f.dateFeedback),
    attachment: (f.attachments ?? []).map((a: any) => a.fileName).filter(Boolean).join(", "),
    snippet: text.length > 600 ? `${text.slice(0, 600)}…` : text,
  };
}

function tally(values: string[]): { name: string; count: number; percentage: number }[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const total = values.length || 1;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }));
}

/** One consultation with real feedback, demographics computed from the published responses. */
export async function getConsultation(pid: string): Promise<Consultation | null> {
  if (!/^\d{1,9}$/.test(pid)) return null;
  return cached(`detail:${pid}`, DETAIL_TTL_MS, async () => {
    const group = await getJson(`${BRP}/groupInitiatives/${pid}`);
    if (!group?.publications) return null;
    const consultation = toConsultation(
      { id: Number(pid), shortTitle: group.shortTitle ?? `Initiative ${pid}` },
      group
    );
    if (consultation.publicationId == null) return consultation;

    const feedback: any[] = [];
    for (let page = 0; page < MAX_FEEDBACK_PAGES; page++) {
      const data = await getJson(
        `${API}/allFeedback?publicationId=${consultation.publicationId}&page=${page}&size=${FEEDBACK_PAGE_SIZE}&sort=dateFeedback,desc`
      );
      feedback.push(...(data.content ?? []));
      if (data.last || (data.content ?? []).length === 0) break;
    }

    consultation.demographics = {
      sampleSize: feedback.length,
      countries: tally(feedback.map((f) => f.country || "Unspecified")).map((c) => ({
        country: c.name,
        submissions: c.count,
        percentage: c.percentage,
      })),
      sectors: tally(feedback.map((f) => labelUserType(f.userType))),
    };
    // Prefer responses that carry a position paper, then the most recent.
    const ranked = [...feedback].sort(
      (a, b) => (b.attachments?.length ? 1 : 0) - (a.attachments?.length ? 1 : 0)
    );
    consultation.submissions = ranked.slice(0, MAX_SUBMISSIONS_SHOWN).map(toSubmission);
    return consultation;
  });
}
