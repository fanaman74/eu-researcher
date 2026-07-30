/**
 * Payload validation for political-event ingestion (POST /api/politics-tracker).
 * Kept framework-free so it can be unit-tested with vitest.
 */
import type { PoliticalEvent } from "./types";

export const SOURCE_TYPES = ["Official", "News"] as const;
export const SOURCE_NAMES = [
  "Dati Camera",
  "Dati Senato",
  "Openpolis",
  "NewsData.io",
  "Event Registry",
] as const;
export const CATEGORIES = [
  "Legislative Act",
  "Committee Meeting",
  "Floor Vote",
  "Political Statement",
  "Corporate Regulation",
] as const;
export const IMPACT_LEVELS = ["High", "Medium", "Low"] as const;
export const PARTIES = ["FdI", "PD", "M5S", "Lega", "FI", "Other"] as const;

/** Only http(s) URLs may be stored — blocks javascript:/data: stored-XSS vectors. */
export const SOURCE_URL_PATTERN = /^https?:\/\//i;

/** Hard cap on POST body size (100 KB). */
export const MAX_BODY_BYTES = 100 * 1024;

const DEFAULT_SOURCE_URL = "https://dati.camera.it";

/** A validated event ready for persistence (id/date assigned by the caller or DB). */
export type EventPayload = Omit<PoliticalEvent, "id" | "date"> & { date?: string };

export type ValidationResult =
  | { ok: true; data: EventPayload }
  | { ok: false; error: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function enumError(field: string, value: unknown, allowed: readonly string[]): string {
  return `Invalid "${field}": ${JSON.stringify(value)}. Allowed values: ${allowed.join(", ")}.`;
}

export function validateEventPayload(body: unknown): ValidationResult {
  if (!isPlainObject(body)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  // Required non-empty string fields
  const requiredFields = [
    "title",
    "description",
    "content",
    "sourceType",
    "sourceName",
    "category",
    "impactLevel",
  ] as const;
  for (const field of requiredFields) {
    if (!isNonEmptyString(body[field])) {
      return { ok: false, error: `Missing or empty required field: "${field}".` };
    }
  }

  // Enum checks (per allowed values documented in prisma/schema.prisma)
  if (!SOURCE_TYPES.includes(body.sourceType as (typeof SOURCE_TYPES)[number])) {
    return { ok: false, error: enumError("sourceType", body.sourceType, SOURCE_TYPES) };
  }
  if (!SOURCE_NAMES.includes(body.sourceName as (typeof SOURCE_NAMES)[number])) {
    return { ok: false, error: enumError("sourceName", body.sourceName, SOURCE_NAMES) };
  }
  if (!CATEGORIES.includes(body.category as (typeof CATEGORIES)[number])) {
    return { ok: false, error: enumError("category", body.category, CATEGORIES) };
  }
  if (!IMPACT_LEVELS.includes(body.impactLevel as (typeof IMPACT_LEVELS)[number])) {
    return { ok: false, error: enumError("impactLevel", body.impactLevel, IMPACT_LEVELS) };
  }

  // sourceUrl: optional, defaults to Dati Camera root; must be http(s) when present
  let sourceUrl = DEFAULT_SOURCE_URL;
  if (body.sourceUrl !== undefined && body.sourceUrl !== null && body.sourceUrl !== "") {
    if (typeof body.sourceUrl !== "string" || !SOURCE_URL_PATTERN.test(body.sourceUrl)) {
      return { ok: false, error: 'Invalid "sourceUrl": only http(s) URLs are allowed.' };
    }
    sourceUrl = body.sourceUrl;
  }

  // date: optional ISO 8601 string; defaults to "now" at persistence time
  let date: string | undefined;
  if (body.date !== undefined && body.date !== null && body.date !== "") {
    if (typeof body.date !== "string" || Number.isNaN(new Date(body.date).getTime())) {
      return { ok: false, error: 'Invalid "date": must be an ISO 8601 date string.' };
    }
    date = new Date(body.date).toISOString();
  }

  // entities: optional array of { name, role?, party? }
  const entities: EventPayload["entities"] = [];
  if (body.entities !== undefined) {
    if (!Array.isArray(body.entities)) {
      return { ok: false, error: 'Invalid "entities": must be an array.' };
    }
    for (const raw of body.entities) {
      if (!isPlainObject(raw) || !isNonEmptyString(raw.name)) {
        return { ok: false, error: 'Invalid "entities": each entry needs a non-empty "name".' };
      }
      const party = raw.party === undefined ? "Other" : raw.party;
      if (!PARTIES.includes(party as (typeof PARTIES)[number])) {
        return { ok: false, error: enumError("entities[].party", party, PARTIES) };
      }
      entities.push({
        name: raw.name,
        role: isNonEmptyString(raw.role) ? raw.role : "Unknown",
        party: party as PoliticalEvent["entities"][number]["party"],
      });
    }
  }

  // tags: optional array of strings
  let tags: string[] = [];
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== "string")) {
      return { ok: false, error: 'Invalid "tags": must be an array of strings.' };
    }
    tags = body.tags as string[];
  }

  return {
    ok: true,
    data: {
      title: (body.title as string).trim(),
      description: body.description as string,
      content: body.content as string,
      sourceType: body.sourceType as EventPayload["sourceType"],
      sourceName: body.sourceName as EventPayload["sourceName"],
      sourceUrl,
      category: body.category as EventPayload["category"],
      impactLevel: body.impactLevel as EventPayload["impactLevel"],
      entities,
      tags,
      ...(date ? { date } : {}),
    },
  };
}
