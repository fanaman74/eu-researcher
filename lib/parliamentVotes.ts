/**
 * European Parliament plenary roll-call votes via the HowTheyVote.eu API
 * (https://howtheyvote.eu/api, no key). HowTheyVote derives its data from the
 * Parliament's official roll-call records; attribute it when displaying.
 */
import type { ParliamentVote, ParliamentVoteSummary } from "./types";

const HTV = "https://howtheyvote.eu/api";
const TTL_MS = 60 * 60 * 1000;

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HowTheyVote request failed with HTTP ${res.status}.`);
  return res.json();
}

const cache = new Map<string, { at: number; value: unknown }>();
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
  try {
    const value = await load();
    cache.set(key, { at: Date.now(), value });
    return value;
  } catch (err) {
    if (hit) return hit.value as T;
    throw err;
  }
}

const split = (s: any) => ({
  yes: s?.FOR ?? 0,
  no: s?.AGAINST ?? 0,
  abstain: s?.ABSTENTION ?? 0,
  didNotVote: s?.DID_NOT_VOTE ?? 0,
});

/** Recent main plenary votes matching `q` (default: energy). */
export async function listPlenaryVotes(q = "energy"): Promise<ParliamentVoteSummary[]> {
  return cached(`list:${q}`, async () => {
    const data = await getJson(
      `${HTV}/votes?q=${encodeURIComponent(q)}&page_size=40&sort_by=timestamp&sort_order=desc`
    );
    return (data.results as any[])
      .filter((v) => v.is_main)
      .slice(0, 10)
      .map((v) => ({
        id: String(v.id),
        date: String(v.timestamp).slice(0, 10),
        title: v.display_title,
        reference: v.reference ?? null,
      }));
  });
}

export async function getPlenaryVote(id: string): Promise<ParliamentVote | null> {
  if (!/^\d{1,9}$/.test(id)) return null;
  return cached(`vote:${id}`, async () => {
    const v = await getJson(`${HTV}/votes/${id}`);
    const total = split(v.stats?.total);
    const italy = (v.stats?.by_country ?? []).find((c: any) => c.country?.code === "ITA");
    return {
      id: String(v.id),
      date: String(v.timestamp).slice(0, 10),
      title: v.display_title,
      description: v.description ?? "",
      reference: v.reference ?? null,
      result: v.result ?? null,
      committees: (v.responsible_committees ?? []).map((c: any) => c.code),
      total,
      totalVotes: total.yes + total.no + total.abstain,
      byGroup: (v.stats?.by_group ?? []).map((g: any) => ({ group: g.group?.short_label ?? g.group?.code, ...split(g.stats) })),
      italy: italy ? split(italy.stats) : null,
      url: `https://howtheyvote.eu/votes/${v.id}`,
    };
  });
}
