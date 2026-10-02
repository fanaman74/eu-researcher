/**
 * Directory of sitting MEPs and Parliament bodies (EP Open Data Portal API v2, no key).
 * Two list requests cover every name, country, group and committee code, so resolving
 * people never spends the API's small request budget one MEP at a time.
 */
import { cached, getJson } from "./cache";
import type { MepSummary } from "./types";

export const EP_API = "https://data.europarl.europa.eu/api/v2";
const LD = "application/ld+json";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Keyed by the group code with punctuation removed: the API writes "S-D", "S&D", "VERTS-ALE" and "Verts/ALE" in different places. */
const GROUPS: Record<string, string> = {
  PPE: "EPP",
  SD: "S&D",
  RENEW: "Renew",
  VERTSALE: "Greens/EFA",
  ECR: "ECR",
  THELEFT: "The Left",
  PFE: "PfE",
  ESN: "ESN",
  NI: "Non-attached",
};

const COMMITTEES: Record<string, string> = {
  ITRE: "Industry, Research and Energy",
  ENVI: "Environment, Climate and Food Safety",
  ECON: "Economic and Monetary Affairs",
  IMCO: "Internal Market and Consumer Protection",
  TRAN: "Transport and Tourism",
  BUDG: "Budgets",
  INTA: "International Trade",
  AGRI: "Agriculture and Rural Development",
  REGI: "Regional Development",
  JURI: "Legal Affairs",
  EMPL: "Employment and Social Affairs",
  AFET: "Foreign Affairs",
  LIBE: "Civil Liberties, Justice and Home Affairs",
  CONT: "Budgetary Control",
};

/** "org/S-D" or "S-D" -> "S&D". */
export function groupLabel(code: string | undefined): string {
  const c = String(code ?? "").replace(/^org\//, "");
  return GROUPS[c.toUpperCase().replace(/[^A-Z]/g, "")] ?? c;
}

/** "org/ITRE" -> "ITRE — Industry, Research and Energy". */
export function committeeLabel(code: string | undefined): string {
  const c = String(code ?? "").replace(/^org\//, "");
  return COMMITTEES[c] ? `${c} — ${COMMITTEES[c]}` : c;
}

/** GET from the EP API. Retries once on a server error; never on 404 or 429 (rate limit). */
export async function epGet(path: string): Promise<any> {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${EP_API}${path}${sep}format=application%2Fld%2Bjson`;
  try {
    return await getJson(url, LD);
  } catch (err) {
    const status = (err as any)?.status;
    if (status === 404 || status === 429) throw err;
    await new Promise((r) => setTimeout(r, 1500));
    return getJson(url, LD);
  }
}

/** Every sitting MEP, keyed by EP person id. */
export async function mepDirectory(): Promise<Map<string, MepSummary>> {
  return cached("ep:meps", DAY_MS, async () => {
    const data = await epGet("/meps/show-current?offset=0&limit=1000");
    const rows: any[] = data.data ?? [];
    return new Map(
      rows.map((m) => [
        String(m.identifier),
        {
          id: String(m.identifier),
          name: m.label ?? `${m.givenName ?? ""} ${m.familyName ?? ""}`.trim(),
          country: m["api:country-of-representation"] ?? "",
          group: groupLabel(m["api:political-group"]),
        },
      ])
    );
  });
}

/** Parliament bodies (committees, delegations, groups) by internal id -> { label, kind }. */
export async function bodyDirectory(): Promise<Map<string, { label: string; kind: string }>> {
  return cached("ep:bodies", 7 * DAY_MS, async () => {
    const data = await epGet("/corporate-bodies/show-current?offset=0&limit=1000");
    const rows: any[] = data.data ?? [];
    return new Map(
      rows.map((b) => [
        String(b.identifier),
        { label: String(b.label ?? b.identifier), kind: String(b.classification ?? "").split("/").pop() ?? "" },
      ])
    );
  });
}
