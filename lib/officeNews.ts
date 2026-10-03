/**
 * A small, deterministic briefing made from the European Commission Press
 * Corner. It deliberately contains no generated claims or paid news calls.
 */
import { fetchPressFromCommission } from "./pressCorner";
import type { PressItem } from "./types";

export const OFFICE_NEWS_TIME_ZONE = "Europe/Brussels";
export const OFFICE_NEWS_SCHEDULE = ["07:00", "12:00", "17:00"] as const;
export const OFFICE_NEWS_MAX_AGE_DAYS = 30;

export type OfficeNewsCategory =
  | "grids"
  | "renewables"
  | "funding"
  | "regulation"
  | "consultations"
  | "state-aid"
  | "energy-policy";

export interface OfficeNewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: "European Commission Press Corner";
  category: OfficeNewsCategory;
  whyItMatters: string;
  action: string;
}

export type OfficeNewsStatus = "live" | "stale" | "unavailable";

export interface OfficeNewsSnapshot {
  items: OfficeNewsItem[];
  checkedAt: string | null;
  attemptedAt: string | null;
  status: OfficeNewsStatus;
  error?: string;
}

export interface OfficeNewsResponse extends OfficeNewsSnapshot {
  nextUpdateAt: string;
  schedule: readonly string[];
  timeZone: typeof OFFICE_NEWS_TIME_ZONE;
}

const CATEGORY_RULES: readonly [OfficeNewsCategory, RegExp, string, string][] = [
  ["state-aid", /\bstate aid\b|\baid scheme\b|\baid measure\b/i, "state-aid decisions and schemes", "Check the aid amount, beneficiaries, approval conditions and implementation date."],
  ["consultations", /consultation|call for evidence|feedback period|have your say|public input|questionnaire/i, "consultations and stakeholder input", "Check the closing date, scope and submission route before deciding whether to respond."],
  ["funding", /\bfund\w*\b|financ\w*|investment|grant\w*|loan\w*|budget|subsid\w*|support scheme|recovery and resilience/i, "energy funding and finance", "Check eligibility, funding windows, amounts and the responsible implementing body."],
  ["grids", /\bgrids?\b|interconnect\w*|transmission|distribution network|electricity network|power network|network infrastructure/i, "grid and network policy", "Check the source for infrastructure scope, delivery dates and any implementation obligations."],
  ["renewables", /renewable\w*|solar|photovoltaic|offshore wind|wind (power|energy|farm)|hydrogen|biomethane|biogas|geothermal|clean energy/i, "renewables and clean-energy policy", "Check the source for technology scope, targets, timelines and support conditions."],
  ["regulation", /regulat\w*|directive|legislation|legislative|legal framework|market design|emissions? trading|\bETS\b|\bCBAM\b|decarboni[sz]\w*|climate law|net[- ]zero/i, "energy regulation and implementation", "Check the legal instrument, scope, effective date and any follow-up measures."],
  ["energy-policy", /energy|electric\w*|power|climate|security|market/i, "energy policy and market context", "Open the official release and check its stated scope, dates and next steps."],
];

function parsePublishedAt(value: string): number | null {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function classify(item: PressItem): OfficeNewsCategory | null {
  const text = `${item.title} ${item.lead}`;
  for (const [category, pattern] of CATEGORY_RULES) {
    if (pattern.test(text)) return category;
  }
  return null;
}

function compact(text: string, fallback: string): string {
  const value = text.replace(/\s+/g, " ").trim();
  return value || fallback;
}

/** Convert one official Press Corner record into the stable office contract. */
export function toOfficeNewsItem(item: PressItem): OfficeNewsItem | null {
  const category = classify(item);
  const publishedMs = parsePublishedAt(item.date);
  if (!category || publishedMs === null || !item.ref || !item.url) return null;
  const summary = compact(item.lead, item.title);
  const descriptor = CATEGORY_RULES.find(([name]) => name === category)!;
  return {
    id: item.ref,
    title: compact(item.title, "Untitled Commission announcement"),
    summary,
    url: item.url,
    publishedAt: new Date(publishedMs).toISOString(),
    source: "European Commission Press Corner",
    category,
    whyItMatters: `Official Commission announcement on ${descriptor[2]}, a stated Enel EU-affairs priority. Review the source details for scope and timing.`,
    action: descriptor[3],
  };
}

/**
 * Fetch and normalize the official feed. The 30-day bound is applied against
 * the supplied clock so callers and tests have deterministic freshness.
 */
export async function fetchOfficeNews(now: Date = new Date()): Promise<OfficeNewsItem[]> {
  const nowMs = now.getTime();
  const oldestMs = nowMs - OFFICE_NEWS_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const seen = new Set<string>();
  const sourceItems = await fetchPressFromCommission();
  return sourceItems
    .map(toOfficeNewsItem)
    .filter((item): item is OfficeNewsItem => {
      if (!item) return false;
      const publishedMs = Date.parse(item.publishedAt);
      if (publishedMs < oldestMs || publishedMs > nowMs || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}
