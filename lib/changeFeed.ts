/**
 * Change feed: stores the last seen state of each tracked item per source and
 * records an event whenever an item appears or one of its tracked fields changes.
 *
 * Persisted in PostgreSQL (TrackedItem / ChangeEvent). Without a database — or if
 * the tables are unreachable — it falls back to in-memory storage, which only
 * remembers changes for the lifetime of the server process.
 *
 * The first snapshot of a source is a baseline: it is stored without emitting
 * events, so the feed never opens with hundreds of "new" items.
 */
import { getPrisma } from "./db";
import type { ChangeEvent, ChangeSource } from "./types";

export interface SnapshotItem {
  externalId: string;
  title: string;
  url: string;
  /** Tracked fields. A change in any value produces a "changed" event. */
  fields: Record<string, string | null>;
}

export interface SnapshotOptions {
  /** Human labels for tracked fields, used in change summaries. */
  labels: Record<string, string>;
  /** One-line description of a newly seen item. */
  describeNew?: (item: SnapshotItem) => string;
}

type Fields = Record<string, string | null>;
type Detected = Omit<ChangeEvent, "id" | "detectedAt">;

const RETENTION_DAYS = 90;
const show = (v: string | null | undefined) => (v == null || v === "" ? "none" : v);

/** Compare a snapshot with the previously stored state. Pure; exported for tests. */
export function diffSnapshot(
  source: ChangeSource,
  previous: Map<string, Fields>,
  next: SnapshotItem[],
  { labels, describeNew }: SnapshotOptions
): Detected[] {
  const out: Detected[] = [];
  for (const item of next) {
    const before = previous.get(item.externalId);
    if (!before) {
      out.push({ source, externalId: item.externalId, kind: "new", title: item.title, url: item.url, summary: describeNew?.(item) ?? "New item." });
      continue;
    }
    const diffs = Object.keys(labels)
      .filter((k) => (before[k] ?? null) !== (item.fields[k] ?? null))
      .map((k) => `${labels[k]}: ${show(before[k])} → ${show(item.fields[k])}`);
    if (diffs.length > 0) {
      out.push({ source, externalId: item.externalId, kind: "changed", title: item.title, url: item.url, summary: diffs.join("; ") });
    }
  }
  return out;
}

// ── In-memory fallback ────────────────────────────────────────────────────
// On globalThis so the cron route that records changes and the routes that read them share it.
interface MemoryFeed {
  items: Map<ChangeSource, Map<string, Fields>>;
  events: ChangeEvent[];
  seq: number;
}
const g = globalThis as unknown as { __euChangeFeed?: MemoryFeed };
const mem: MemoryFeed = (g.__euChangeFeed ??= { items: new Map(), events: [], seq: 0 });
let warnedDb = false;

function memoryRecord(source: ChangeSource, items: SnapshotItem[], opts: SnapshotOptions) {
  const previous = mem.items.get(source);
  const baseline = !previous;
  const detected = baseline ? [] : diffSnapshot(source, previous, items, opts);
  const state = previous ?? new Map<string, Fields>();
  for (const item of items) state.set(item.externalId, item.fields);
  mem.items.set(source, state);
  const now = new Date().toISOString();
  mem.events.push(...detected.map((d) => ({ ...d, id: `mem-${++mem.seq}`, detectedAt: now })));
  const cutoff = Date.now() - RETENTION_DAYS * 86_400_000;
  mem.events = mem.events.filter((e) => Date.parse(e.detectedAt) >= cutoff);
  return { baseline, changes: detected.length };
}

function dbFailed(err: unknown) {
  if (!warnedDb) {
    console.warn("[ChangeFeed] database unavailable — using in-memory storage:", (err as Error).message);
    warnedDb = true;
  }
}

/** Store a source's current state and record what changed since the last snapshot. */
export async function recordSnapshot(
  source: ChangeSource,
  items: SnapshotItem[],
  opts: SnapshotOptions
): Promise<{ baseline: boolean; changes: number }> {
  const prisma = getPrisma();
  if (!prisma) return memoryRecord(source, items, opts);

  try {
    const rows = await prisma.trackedItem.findMany({ where: { source }, select: { externalId: true, fields: true } });
    const previous = new Map(rows.map((r) => [r.externalId, (r.fields ?? {}) as Fields]));
    const baseline = previous.size === 0;
    const detected = baseline ? [] : diffSnapshot(source, previous, items, opts);

    const fresh = items.filter((i) => !previous.has(i.externalId));
    if (fresh.length > 0) {
      await prisma.trackedItem.createMany({
        data: fresh.map((i) => ({ source, externalId: i.externalId, title: i.title, url: i.url, fields: i.fields })),
        skipDuplicates: true,
      });
    }
    const byId = new Map(items.map((i) => [i.externalId, i]));
    for (const d of detected.filter((x) => x.kind === "changed")) {
      const i = byId.get(d.externalId)!;
      await prisma.trackedItem.update({
        where: { source_externalId: { source, externalId: i.externalId } },
        data: { title: i.title, url: i.url, fields: i.fields },
      });
    }
    if (detected.length > 0) await prisma.changeEvent.createMany({ data: detected });
    await prisma.changeEvent.deleteMany({ where: { detectedAt: { lt: new Date(Date.now() - RETENTION_DAYS * 86_400_000) } } });
    return { baseline, changes: detected.length };
  } catch (err) {
    dbFailed(err);
    return memoryRecord(source, items, opts);
  }
}

/** Recorded changes, newest first. */
export async function listChanges({ days = 7, source }: { days?: number; source?: ChangeSource } = {}): Promise<{
  changes: ChangeEvent[];
  persistent: boolean;
}> {
  const since = new Date(Date.now() - days * 86_400_000);
  const prisma = getPrisma();
  if (prisma) {
    try {
      const rows = await prisma.changeEvent.findMany({
        where: { detectedAt: { gte: since }, ...(source ? { source } : {}) },
        orderBy: { detectedAt: "desc" },
        take: 500,
      });
      return {
        persistent: true,
        changes: rows.map((r) => ({ ...r, source: r.source as ChangeSource, kind: r.kind as ChangeEvent["kind"], detectedAt: r.detectedAt.toISOString() })),
      };
    } catch (err) {
      dbFailed(err);
    }
  }
  return {
    persistent: false,
    changes: mem.events
      .filter((e) => Date.parse(e.detectedAt) >= since.getTime() && (!source || e.source === source))
      .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)),
  };
}
