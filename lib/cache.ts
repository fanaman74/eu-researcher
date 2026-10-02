/**
 * Small in-memory helpers shared by the upstream source modules:
 * a TTL cache that de-duplicates concurrent loads and serves stale data when
 * the upstream fails, and a bounded-concurrency map.
 */

// Kept on globalThis so every route bundle (and dev hot reloads) share one cache per process.
const g = globalThis as unknown as {
  __euCache?: Map<string, { at: number; value: unknown }>;
  __euInflight?: Map<string, Promise<unknown>>;
};
const store = (g.__euCache ??= new Map());
const inflight = (g.__euInflight ??= new Map());

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  // Concurrent callers share one upstream load instead of each hammering the API.
  let pending = inflight.get(key) as Promise<T> | undefined;
  if (!pending) {
    pending = load()
      .then((value) => {
        store.set(key, { at: Date.now(), value });
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

/** When `key` was last loaded successfully (ISO), or null if never. */
export function cachedAt(key: string): string | null {
  const hit = store.get(key);
  return hit ? new Date(hit.at).toISOString() : null;
}

/** Reject if `promise` has not settled within `ms`. The underlying work keeps running (and filling its cache). */
export function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${what} is still loading.`)), ms)),
  ]);
}

/** Run `fn` over `items` with bounded concurrency. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
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

export async function getJson(url: string, accept = "application/json", timeoutMs = 30000): Promise<any> {
  const res = await fetch(url, { headers: { Accept: accept }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw Object.assign(new Error(`Request to ${new URL(url).host} failed with HTTP ${res.status}.`), { status: res.status });
  return res.json();
}
