/**
 * Radar: the Commission's energy initiatives pipeline (Have Your Say / Better
 * Regulation API, no key) — what is planned, as which act type, for which quarter.
 *
 * Only energy-tagged initiatives (topic ENER) are covered; grid-relevant files
 * tagged under other topics are not. Planned quarters are the Commission's own
 * indicative planning and slip often.
 */
import { cached, cachedAt, getJson, mapLimit } from "./cache";
import type { RadarItem } from "./types";

const BRP = "https://ec.europa.eu/info/law/better-regulation/brpapi";
const PAGE_URL = "https://ec.europa.eu/info/law/better-regulation/have-your-say/initiatives";
const TTL_MS = 12 * 60 * 60 * 1000;
const CACHE_KEY = "radar";

const ACT_TYPES: Record<string, string> = {
  PROP_REG: "Proposal for a regulation",
  PROP_DIR: "Proposal for a directive",
  PROP_DEC: "Proposal for a decision",
  PROP_RECO: "Proposal for a recommendation",
  REG: "Regulation",
  REG_DEL: "Delegated regulation",
  REG_IMPL: "Implementing regulation",
  DIR_DEL: "Delegated directive",
  DIR_IMPL: "Implementing directive",
  DEC: "Decision",
  DEC_IMPL: "Implementing decision",
  COMMUNIC: "Communication",
  JOINT_COMMUNIC: "Joint communication",
  REPORT: "Report",
  RECO: "Recommendation",
  EVL: "Evaluation",
  SWD: "Staff working document",
  CORRIGENDUM: "Corrigendum",
  ACT: "Act",
};

const STAGES: Record<string, string> = {
  INIT_PLANNED: "Planned",
  PLANNING_WORKFLOW: "Call for evidence",
  OPC_LAUNCHED: "Public consultation",
  ISC_WORKFLOW: "Draft act",
  ADOPTION_WORKFLOW: "Commission adoption",
  ABANDONED: "Abandoned",
};

const hysDate = (raw: string | null | undefined): string | null => {
  const m = /^(\d{4})\/(\d{2})\/(\d{2})/.exec(raw ?? "");
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};

/** "Q-2027-2" -> { label: "Q2 2027", sort: "2027-2" }. Exported for tests. */
export function parsePlannedPeriod(raw: string | null | undefined): { label: string; sort: string } | null {
  const m = /^Q-(\d{4})-([1-4])$/.exec(raw ?? "");
  return m ? { label: `Q${m[2]} ${m[1]}`, sort: `${m[1]}-${m[2]}` } : null;
}

export function currentQuarter(now = new Date()): string {
  return `${now.getUTCFullYear()}-${Math.floor(now.getUTCMonth() / 3) + 1}`;
}

/** Build a radar item from an initiative's detail record. Exported for tests. */
export function toRadarItem(group: any, now = new Date()): RadarItem {
  const pubs: any[] = group.publications ?? [];
  const en = (group.initiativeTranslations ?? []).find((t: any) => t.language === "EN" && t.field === "SHORT_TITLE");

  // The act the initiative leads to is the publication at the adoption stage.
  const adoption = pubs.filter((p) => p.frontEndStage === "ADOPTION_WORKFLOW");
  const adopted = adoption.find((p) => p.adoptionDate);
  const planned = pubs.map((p) => parsePlannedPeriod(p.plannedPeriod)).filter(Boolean).sort((a, b) => b!.sort.localeCompare(a!.sort))[0] ?? null;

  const open = pubs.filter((p) => p.receivingFeedbackStatus === "OPEN");
  const feedbackEnd = open.map((p) => hysDate(p.endDate)).filter(Boolean).sort()[0] ?? null;
  const upcoming = pubs.some((p) => p.receivingFeedbackStatus === "UPCOMING");

  const stage = String(group.stage ?? "");
  const status: RadarItem["status"] = adopted
    ? "Adopted"
    : stage === "ABANDONED"
      ? "Abandoned"
      : planned && planned.sort < currentQuarter(now)
        ? "Overdue"
        : "Upcoming";

  return {
    id: String(group.id),
    title: en?.value || group.shortTitle || `Initiative ${group.id}`,
    summary: group.dossierSummary ?? "",
    actType: ACT_TYPES[group.foreseenActType] ?? group.foreseenActType ?? "",
    stage: STAGES[stage] ?? stage,
    plannedPeriod: planned?.label ?? null,
    plannedSort: planned?.sort ?? null,
    adoptionDate: hysDate(adopted?.adoptionDate),
    status,
    feedback: open.length > 0 ? "Open" : upcoming ? "Upcoming" : "None",
    feedbackEnd,
    totalFeedback: pubs.reduce((n, p) => n + (p.totalFeedback ?? 0), 0),
    dg: group.dg ?? "",
    major: Boolean(group.isMajor),
    reference: group.reference ?? "",
    url: `${PAGE_URL}/${group.id}`,
  };
}

/** Every energy-tagged initiative with its pipeline position. Slow on a cold cache (one request per initiative). */
export async function listRadar(): Promise<RadarItem[]> {
  return cached(CACHE_KEY, TTL_MS, async () => {
    const page = (n: number) =>
      getJson(`${BRP}/searchInitiatives?page=${n}&size=100&language=EN&topic=ENER`).then((r) => r.initiativeResultDtoPage);
    const first = await page(0);
    const rest = await Promise.all(Array.from({ length: Math.min((first?.totalPages ?? 1) - 1, 9) }, (_, i) => page(i + 1)));
    const ids: number[] = [first, ...rest].flatMap((p) => p?.content ?? []).map((i: any) => i.id);

    // One retry per initiative: an item that drops out of a scan would later look "new" to the change feed.
    const detail = (id: number) =>
      getJson(`${BRP}/groupInitiatives/${id}`).catch(async () => {
        await new Promise((r) => setTimeout(r, 1500));
        return getJson(`${BRP}/groupInitiatives/${id}`);
      });
    const items = await mapLimit(ids, 6, async (id) => {
      try {
        return toRadarItem(await detail(id));
      } catch (err) {
        console.warn(`[Radar] initiative ${id} skipped:`, (err as Error).message);
        return null;
      }
    });
    const found = items.filter((i): i is RadarItem => i !== null);
    // A mostly-failed scan must not replace a good cache (and must not look like mass removals).
    if (found.length < ids.length * 0.8) throw new Error(`Radar scan incomplete (${found.length}/${ids.length}).`);
    return found;
  });
}

export const radarFetchedAt = () => cachedAt(CACHE_KEY);

/**
 * What is still coming: upcoming items by planned quarter (those without one last),
 * then items whose planned quarter has passed, most recent first — the older ones
 * are mostly stale planning records.
 */
export function upcomingRadar(items: RadarItem[]): RadarItem[] {
  const upcoming = items
    .filter((i) => i.status === "Upcoming")
    .sort((a, b) => (a.plannedSort ?? "9999").localeCompare(b.plannedSort ?? "9999") || a.title.localeCompare(b.title));
  const overdue = items
    .filter((i) => i.status === "Overdue")
    .sort((a, b) => (b.plannedSort ?? "").localeCompare(a.plannedSort ?? "") || a.title.localeCompare(b.title));
  return [...upcoming, ...overdue];
}
