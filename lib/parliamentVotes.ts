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

interface VoteRecord extends ParliamentVoteSummary {
  procedure: string | null;
  /** EP person id -> "FOR" | "AGAINST" | "ABSTENTION" | "DID_NOT_VOTE". */
  positions: Map<string, string>;
}

/** Main votes matching `q`, each with its procedure reference and every member's position. */
async function voteRecords(q: string, max: number): Promise<VoteRecord[]> {
  return cached(`records:${q}:${max}`, async () => {
    const data = await getJson(`${HTV}/votes?q=${encodeURIComponent(q)}&page_size=40&sort_by=timestamp&sort_order=desc`);
    const main = (data.results as any[]).filter((v) => v.is_main).slice(0, max);
    const records = await Promise.all(
      main.map(async (v) => {
        const detail = await getJson(`${HTV}/votes/${v.id}`);
        return {
          id: String(v.id),
          date: String(v.timestamp).slice(0, 10),
          title: v.display_title,
          reference: v.reference ?? null,
          procedure: detail.procedure?.reference ?? null,
          positions: new Map<string, string>(
            (detail.member_votes ?? []).map((m: any) => [String(m.member?.id), String(m.position)])
          ),
        };
      })
    );
    return records;
  });
}

/** Main plenary votes held on one legislative file, e.g. "2025/0180(COD)". */
export async function listVotesForProcedure(reference: string, q: string): Promise<ParliamentVoteSummary[]> {
  const records = await voteRecords(q, 8);
  return records
    .filter((r) => r.procedure === reference)
    .map(({ id, date, title, reference: ref }) => ({ id, date, title, reference: ref }));
}

/** How one MEP voted in the most recent main energy votes. */
export async function memberEnergyVotes(
  mepId: string
): Promise<{ id: string; date: string; title: string; position: string; url: string }[]> {
  const records = await voteRecords("energy", 10);
  return records.map((r) => ({
    id: r.id,
    date: r.date,
    title: r.title,
    position: r.positions.get(mepId) ?? "NOT_A_MEMBER",
    url: `https://howtheyvote.eu/votes/${r.id}`,
  }));
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
