/**
 * Market context: Italian day-ahead prices and generation mix from Energy-Charts
 * (Fraunhofer ISE, free, no key). Prices are per bidding zone — Energy-Charts does
 * not publish the national PUN.
 */
import { cached, getJson } from "./cache";
import type { MarketSnapshot } from "./types";

const API = "https://api.energy-charts.info";
const TTL_MS = 3 * 60 * 60 * 1000; // the API rate-limits bursts; day-ahead prices change once a day
const DAYS = 14;

export const ZONES = ["IT-North", "IT-Centre-North", "IT-Centre-South", "IT-South", "IT-Sicily", "IT-Sardinia", "IT-Calabria"];

/** Series that are not generation sources. */
const NOT_GENERATION = /^(load|residual load|renewable share|cross border|battery consumption|hydro pumped storage consumption)/i;

const romeDay = (unixSeconds: number) => new Date(unixSeconds * 1000).toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const round = (n: number, digits = 1) => Math.round(n * 10 ** digits) / 10 ** digits;

/** Daily average / min / max from a quarter-hourly or hourly price series. Exported for tests. */
export function dailyPrices(unixSeconds: number[], prices: (number | null)[]): MarketSnapshot["days"] {
  const byDay = new Map<string, number[]>();
  unixSeconds.forEach((t, i) => {
    const p = prices[i];
    if (typeof p !== "number") return;
    const day = romeDay(t);
    byDay.set(day, [...(byDay.get(day) ?? []), p]);
  });
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, avg: round(v.reduce((s, x) => s + x, 0) / v.length), min: round(Math.min(...v)), max: round(Math.max(...v)) }));
}

async function generationMix(day: string): Promise<MarketSnapshot["mix"]> {
  const data = await getJson(`${API}/public_power?country=it&start=${day}&end=${day}`);
  const times: number[] = data.unix_seconds ?? [];
  if (times.length < 2) return null;
  const hours = (times[1] - times[0]) / 3600;
  const energy = (series: (number | null)[]) => series.reduce<number>((s, v) => s + (typeof v === "number" && v > 0 ? v * hours : 0), 0) / 1000;

  const sources = (data.production_types as any[])
    .filter((t) => !NOT_GENERATION.test(t.name))
    .map((t) => ({ name: String(t.name), gwh: energy(t.data ?? []) }))
    .filter((s) => s.gwh > 0);
  const total = sources.reduce((s, x) => s + x.gwh, 0);
  if (total === 0) return null;

  const share = (data.production_types as any[]).find((t) => /^renewable share of generation/i.test(t.name));
  const shareValues = (share?.data ?? []).filter((v: unknown): v is number => typeof v === "number");
  return {
    date: day,
    sources: sources
      .map((s) => ({ name: s.name, gwh: round(s.gwh), share: round((s.gwh / total) * 100) }))
      .sort((a, b) => b.gwh - a.gwh),
    renewableShare: shareValues.length ? round(shareValues.reduce((s: number, v: number) => s + v, 0) / shareValues.length) : null,
  };
}

export async function getMarket(zone = "IT-North"): Promise<MarketSnapshot> {
  const bzn = ZONES.includes(zone) ? zone : "IT-North";
  return cached(`market:${bzn}`, TTL_MS, async () => {
    const now = new Date();
    const start = isoDay(new Date(now.getTime() - DAYS * 86_400_000));
    const price = await getJson(`${API}/price?bzn=${bzn}&start=${start}&end=${isoDay(now)}`);
    const yesterday = isoDay(new Date(now.getTime() - 86_400_000));
    const mix = await generationMix(yesterday).catch((err) => {
      console.warn("[Market] generation mix unavailable:", (err as Error).message);
      return null;
    });
    return {
      zone: bzn,
      unit: price.unit ?? "EUR / MWh",
      days: dailyPrices(price.unix_seconds ?? [], price.price ?? []),
      mix,
      source: "Energy-Charts (Fraunhofer ISE)",
      license: price.license_info ?? "",
    };
  });
}
