/**
 * Commission press corner (public JSON API, no key): recent announcements filtered
 * to energy-relevant items by keyword, with state-aid decisions flagged.
 *
 * There is no API for the competition-case register; state-aid items here are
 * press announcements only.
 */
import { cached, cachedAt, getJson } from "./cache";
import type { PressItem } from "./types";

const API = "https://ec.europa.eu/commission/presscorner/api";
const TTL_MS = 60 * 60 * 1000;
const CACHE_KEY = "press";
const PAGES = 3;
const STATE_AID_RE = /\bstate aid\b/i;
/** Tighter than the MEP-question filter: press items mention "aid", "power" or "climate" in many unrelated contexts. */
const ENERGY_RE =
  /\b(energy|electric\w*|grids?|renewable\w*|solar|photovoltaic\w*|offshore wind|wind (power|energy|farms?)|hydrogen|nuclear|natural gas|LNG|power (plants?|market|sector|grid)|decarboni[sz]\w*|emissions? trading|ETS|CBAM|net[- ]zero|interconnect\w*|heat pumps?|batter(y|ies)|data cent\w*|hydropower|biomethane|biogas|clean industrial|climate (law|target\w*|neutral\w*))\b/i;

/** Map one API record, or null when it is not energy-relevant. Exported for tests. */
export function toPressItem(doc: any): PressItem | null {
  const title = String(doc.title ?? "");
  const lead = String(doc.leadText ?? "").replace(/\s+/g, " ").trim();
  const ref = String(doc.refCode ?? "");
  // Daily news digests ("MEX") bundle unrelated items; their titles carry no topic.
  if (!ref || doc.docutype?.code === "MEX") return null;
  if (!ENERGY_RE.test(`${title} ${lead}`)) return null;
  return {
    ref,
    title,
    lead,
    date: String(doc.eventDate ?? ""),
    type: doc.docutype?.description ?? "",
    stateAid: STATE_AID_RE.test(`${title} ${lead}`),
    url: `https://ec.europa.eu/commission/presscorner/detail/en/${ref.replace(/\//g, "_").toLowerCase()}`,
  };
}

/** Fetch the current official Press Corner pages without the local cache. */
export async function fetchPressFromCommission(): Promise<PressItem[]> {
  const pages = await Promise.all(
    Array.from({ length: PAGES }, (_, i) =>
      getJson(`${API}/latestnews?language=en&pagesize=100&pagenumber=${i + 1}`)
    )
  );
  const seen = new Set<string>();
  return pages
    .flatMap((p) => p.docuLanguageListResources ?? [])
    .map(toPressItem)
    .filter((p): p is PressItem => p !== null && !seen.has(p.ref) && Boolean(seen.add(p.ref)))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function listPress(): Promise<PressItem[]> {
  return cached(CACHE_KEY, TTL_MS, async () => {
    return fetchPressFromCommission();
  });
}

export const pressFetchedAt = () => cachedAt(CACHE_KEY);
