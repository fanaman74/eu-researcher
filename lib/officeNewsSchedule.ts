import { getPrisma } from "./db";
import { Prisma } from "@prisma/client";
import {
  fetchOfficeNews,
  OFFICE_NEWS_SCHEDULE,
  OFFICE_NEWS_TIME_ZONE,
  type OfficeNewsItem,
  type OfficeNewsSnapshot,
  type OfficeNewsResponse,
} from "./officeNews";

const SOURCE = "office-news";
const EXTERNAL_ID = "latest";
const SNAPSHOT_VERSION = 1;

type StoredSnapshot = OfficeNewsSnapshot & { version: number };
type OfficeNewsState = {
  snapshot: OfficeNewsSnapshot | null;
  loaded: boolean;
  loadPromise: Promise<void> | null;
  refreshPromise: Promise<void> | null;
  attemptedSlot: string | null;
  timer: ReturnType<typeof setTimeout> | null;
};

const globalState = globalThis as unknown as { __officeNewsState?: OfficeNewsState };
const state: OfficeNewsState = (globalState.__officeNewsState ??= {
  snapshot: null,
  loaded: false,
  loadPromise: null,
  refreshPromise: null,
  attemptedSlot: null,
  timer: null,
});

const localFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: OFFICE_NEWS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

type LocalParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function localParts(date: Date): LocalParts {
  const parts = Object.fromEntries(localFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function localDateKey(parts: Pick<LocalParts, "year" | "month" | "day">): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function localDateAtOffset(parts: Pick<LocalParts, "year" | "month" | "day">, days: number) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

/** Return the Brussels offset at an instant, including DST. */
function offsetAt(date: Date): number {
  const p = localParts(date);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - date.getTime();
}

/** Convert a Brussels wall-clock slot to its UTC instant, accounting for DST. */
function fromLocal(parts: Pick<LocalParts, "year" | "month" | "day"> & { hour: number }): Date {
  const wall = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, 0, 0);
  let candidate = new Date(wall - offsetAt(new Date(wall)));
  // The offset can change at the candidate during a DST transition.
  candidate = new Date(wall - offsetAt(candidate));
  return candidate;
}

function currentSlotKey(now: Date): string {
  const p = localParts(now);
  const date = p.hour >= 7 ? { year: p.year, month: p.month, day: p.day } : localDateAtOffset(p, -1);
  const hour = p.hour >= 17 ? 17 : p.hour >= 12 ? 12 : p.hour >= 7 ? 7 : 17;
  return `${localDateKey(date)}T${String(hour).padStart(2, "0")}:00`;
}

/** Return the next scheduled Brussels slot strictly after `now`. */
export function nextOfficeNewsSlot(now: Date = new Date()): Date {
  const p = localParts(now);
  const today = { year: p.year, month: p.month, day: p.day };
  const currentMinutes = p.hour * 60 + p.minute;
  const slots = OFFICE_NEWS_SCHEDULE.map((value) => Number(value.slice(0, 2)) * 60);
  const nextMinutes = slots.find((minutes) => minutes > currentMinutes);
  if (nextMinutes !== undefined) {
    return fromLocal({ ...today, hour: Math.floor(nextMinutes / 60) });
  }
  return fromLocal({ ...localDateAtOffset(p, 1), hour: 7 });
}

export function msUntilNextOfficeNewsSlot(now: Date = new Date()): number {
  return Math.max(0, nextOfficeNewsSlot(now).getTime() - now.getTime());
}

function asSnapshot(value: unknown): OfficeNewsSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<StoredSnapshot>;
  if (raw.version !== SNAPSHOT_VERSION || !Array.isArray(raw.items)) return null;
  if (raw.status !== "live" && raw.status !== "stale" && raw.status !== "unavailable") return null;
  const checkedAt = raw.checkedAt === null ? null : typeof raw.checkedAt === "string" && Number.isFinite(Date.parse(raw.checkedAt)) ? raw.checkedAt : null;
  const attemptedAt = raw.attemptedAt === null ? null : typeof raw.attemptedAt === "string" && Number.isFinite(Date.parse(raw.attemptedAt)) ? raw.attemptedAt : null;
  if ((raw.status === "live" || raw.status === "stale") && (!checkedAt || !attemptedAt)) return null;
  if (raw.status === "unavailable" && checkedAt !== null) return null;
  const validItems = raw.items.every((item) => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Partial<OfficeNewsItem>;
    return typeof candidate.id === "string" &&
      typeof candidate.title === "string" &&
      typeof candidate.summary === "string" &&
      typeof candidate.publishedAt === "string" && Number.isFinite(Date.parse(candidate.publishedAt)) &&
      typeof candidate.url === "string" && candidate.url.startsWith("https://ec.europa.eu/commission/presscorner/") &&
      candidate.source === "European Commission Press Corner" &&
      ["grids", "renewables", "funding", "regulation", "consultations", "state-aid", "energy-policy"].includes(candidate.category ?? "") &&
      typeof candidate.whyItMatters === "string" &&
      typeof candidate.action === "string";
  });
  if (!validItems) return null;
  return {
    items: raw.items as OfficeNewsItem[],
    checkedAt,
    attemptedAt,
    status: raw.status,
    ...(typeof raw.error === "string" ? { error: raw.error } : {}),
  };
}

async function loadPersisted(): Promise<void> {
  try {
    const prisma = getPrisma();
    if (!prisma) return;
    const row = await prisma.trackedItem.findUnique({ where: { source_externalId: { source: SOURCE, externalId: EXTERNAL_ID } } });
    const loaded = asSnapshot(row?.fields);
    if (loaded) {
      state.snapshot = loaded;
      if (loaded.attemptedAt) state.attemptedSlot = currentSlotKey(new Date(loaded.attemptedAt));
    }
  } catch (error) {
    console.warn("[Office news] Durable snapshot read failed:", error);
  }
}

async function ensureLoaded(): Promise<void> {
  if (state.loaded) return;
  if (!state.loadPromise) {
    state.loadPromise = loadPersisted().finally(() => {
      state.loaded = true;
      state.loadPromise = null;
    });
  }
  await state.loadPromise;
}

async function persist(snapshot: OfficeNewsSnapshot): Promise<void> {
  try {
    const prisma = getPrisma();
    if (!prisma) return;
    const fields: StoredSnapshot = { version: SNAPSHOT_VERSION, ...snapshot };
    await prisma.trackedItem.upsert({
      where: { source_externalId: { source: SOURCE, externalId: EXTERNAL_ID } },
      update: { title: "Office news latest", url: "https://ec.europa.eu/commission/presscorner", fields: fields as unknown as Prisma.InputJsonValue },
      create: { source: SOURCE, externalId: EXTERNAL_ID, title: "Office news latest", url: "https://ec.europa.eu/commission/presscorner", fields: fields as unknown as Prisma.InputJsonValue },
    });
  } catch (error) {
    console.warn("[Office news] Durable snapshot write failed:", error);
  }
}

async function doRefresh(now: Date, slot: string): Promise<void> {
  state.attemptedSlot = slot;
  const attemptedAt = now.toISOString();
  try {
    const items = await fetchOfficeNews(now);
    const snapshot: OfficeNewsSnapshot = { items, checkedAt: new Date().toISOString(), attemptedAt, status: "live" };
    state.snapshot = snapshot;
    await persist(snapshot);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const previous = state.snapshot;
    const snapshot: OfficeNewsSnapshot = {
      items: previous?.items ?? [],
      checkedAt: previous?.checkedAt ?? null,
      attemptedAt,
      status: previous?.checkedAt ? "stale" : "unavailable",
      error: "Commission news source could not be refreshed.",
    };
    state.snapshot = snapshot;
    await persist(snapshot);
    console.warn("[Office news] Refresh failed:", detail);
  }
}

/** Refresh at most once for the current scheduled slot, sharing concurrent work. */
export async function refreshOfficeNewsIfDue(now: Date = new Date(), initial = false): Promise<void> {
  await ensureLoaded();
  const slot = currentSlotKey(now);
  if (state.refreshPromise) return state.refreshPromise;
  if (!initial && state.attemptedSlot === slot) return;
  if (initial && state.snapshot && state.attemptedSlot === slot) return;
  state.refreshPromise = doRefresh(now, slot).finally(() => {
    state.refreshPromise = null;
  });
  return state.refreshPromise;
}

export async function getOfficeNewsResponse(now: Date = new Date()): Promise<OfficeNewsResponse> {
  await ensureLoaded();
  await refreshOfficeNewsIfDue(now, !state.snapshot);
  const snapshot = state.snapshot ?? { items: [], checkedAt: null, attemptedAt: null, status: "unavailable" as const };
  return {
    ...snapshot,
    nextUpdateAt: nextOfficeNewsSlot(now).toISOString(),
    schedule: [...OFFICE_NEWS_SCHEDULE],
    timeZone: OFFICE_NEWS_TIME_ZONE,
  };
}

function scheduleNextOfficeNewsRun(): void {
  if (state.timer) clearTimeout(state.timer);
  state.timer = setTimeout(async () => {
    try {
      await refreshOfficeNewsIfDue(new Date());
    } catch (error) {
      console.error("[Office news] Scheduled refresh failed:", error);
    } finally {
      scheduleNextOfficeNewsRun();
    }
  }, msUntilNextOfficeNewsSlot());
  state.timer.unref?.();
}

/** Start the independent 07:00/12:00/17:00 Europe/Brussels refresh timer. */
export function startOfficeNewsScheduler(): void {
  void refreshOfficeNewsIfDue(new Date(), true);
  scheduleNextOfficeNewsRun();
  console.log("[Office news] Refresh scheduled at 07:00, 12:00 and 17:00 Europe/Brussels.");
}
