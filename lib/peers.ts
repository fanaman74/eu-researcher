/**
 * Peer watch: which utilities and associations responded to a consultation, and what they said.
 *
 * Organisations are matched by name against PEERS (whole words, so "Enel" never
 * matches "panel" or "Chanel"). Edit PEERS to change who counts as a peer.
 * Respondents who asked to stay anonymous are never matched.
 */
import { cached, getJson } from "./cache";
import type { PeerPosition } from "./types";

const BRP = "https://ec.europa.eu/info/law/better-regulation/brpapi";
const API = "https://ec.europa.eu/info/law/better-regulation/api";
const TTL_MS = 6 * 60 * 60 * 1000;
const PAGE_SIZE = 100;
const MAX_PAGES = 20; // up to 2,000 responses per publication

export const PEERS: { name: string; match: RegExp }[] = [
  { name: "Enel", match: /\b(enel|endesa)\b/i },
  { name: "Eurelectric", match: /\beurelectric\b/i },
  { name: "ENTSO-E", match: /\bentso-?e\b|european network of transmission system operators for electricity/i },
  { name: "E.DSO / DSO Entity", match: /\be\.?dso\b|\bdso entity\b|european distribution system operators/i },
  { name: "Terna", match: /\bterna\b/i },
  { name: "Edison", match: /\bedison\b/i },
  { name: "Snam", match: /\bsnam\b/i },
  { name: "Eni", match: /\beni\b(?! *-)/i },
  { name: "A2A", match: /\ba2a\b/i },
  { name: "Elettricità Futura", match: /elettricit[aà] futura/i },
  { name: "Utilitalia", match: /\butilitalia\b/i },
  { name: "Iberdrola", match: /\biberdrola\b/i },
  { name: "EDF", match: /\bedf\b|[eé]lectricit[eé] de france/i },
  { name: "ENGIE", match: /\bengie\b/i },
  { name: "RWE", match: /\brwe\b/i },
  { name: "E.ON", match: /\be\.on\b/i },
  { name: "EnBW", match: /\benbw\b/i },
  { name: "EDP", match: /\bedp\b/i },
  { name: "Vattenfall", match: /\bvattenfall\b/i },
  { name: "Ørsted", match: /[øo]rsted\b/i },
  { name: "Fortum", match: /\bfortum\b/i },
  { name: "Statkraft", match: /\bstatkraft\b/i },
  { name: "Verbund", match: /\bverbund\b/i },
  { name: "WindEurope", match: /\bwind ?europe\b/i },
  { name: "SolarPower Europe", match: /\bsolarpower europe\b/i },
  { name: "Eurogas", match: /\beurogas\b/i },
];

/** The peer an organisation name belongs to, or null. */
export function matchPeer(organisation: string | null | undefined): string | null {
  if (!organisation) return null;
  return PEERS.find((p) => p.match.test(organisation))?.name ?? null;
}

const hysDate = (raw: string | null | undefined): string | null => {
  const m = /^(\d{4})\/(\d{2})\/(\d{2})/.exec(raw ?? "");
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};

const PUBLICATION_TYPES: Record<string, string> = {
  OPC_LAUNCHED: "Public consultation",
  CFE_IMPACT_ASSESS: "Call for evidence",
  CFE_EVALUATION: "Call for evidence (evaluation)",
  IMPACT_ASSESS_INCEP: "Inception impact assessment",
  ISC_WORKFLOW: "Draft act",
};
const publicationLabel = (type: string) =>
  PUBLICATION_TYPES[type] ?? (type.startsWith("PROP_") ? "Adopted Commission proposal" : "Feedback period");

/** Peer responses to one initiative, across all its feedback periods. */
export async function getPeerPositions(
  pid: string
): Promise<{
  title: string;
  url: string;
  /** Responses read, out of `published`. Questionnaire-only responses are not published as feedback and cannot be read. */
  scanned: number;
  published: number;
  positions: PeerPosition[];
} | null> {
  if (!/^\d{1,9}$/.test(pid)) return null;
  return cached(`peers:${pid}`, TTL_MS, async () => {
    const group = await getJson(`${BRP}/groupInitiatives/${pid}`);
    if (!group?.publications) return null;
    const pubs: any[] = group.publications.filter((p: any) => (p.totalFeedback ?? 0) > 0);

    let scanned = 0;
    let published = 0;
    const positions: PeerPosition[] = [];
    for (const pub of pubs) {
      for (let page = 0; page < MAX_PAGES; page++) {
        const data = await getJson(`${API}/allFeedback?publicationId=${pub.id}&page=${page}&size=${PAGE_SIZE}&sort=dateFeedback,desc`);
        const rows: any[] = data.content ?? [];
        scanned += rows.length;
        if (page === 0) published += data.totalElements ?? rows.length;
        for (const f of rows) {
          // Respect the respondent's anonymity choice.
          if (f.publication !== "WITHINFO") continue;
          const peer = matchPeer(f.organization);
          if (!peer) continue;
          positions.push({
            peer,
            organization: f.organization,
            country: f.country ?? "",
            userType: String(f.userType ?? "").replace(/_/g, " ").toLowerCase(),
            date: hysDate(f.dateFeedback),
            text: String(f.feedback ?? "").trim(),
            transparencyId: f.trNumber ?? "",
            attachments: (f.attachments ?? []).map((a: any) => ({
              fileName: a.fileName ?? "attachment",
              url: `${API}/download/${a.documentId}`,
              pages: a.pages ?? null,
            })),
            publication: publicationLabel(String(pub.type ?? "")),
          });
        }
        if (data.last || rows.length === 0) break;
      }
    }

    const en = (group.initiativeTranslations ?? []).find((t: any) => t.language === "EN" && t.field === "SHORT_TITLE");
    return {
      title: en?.value || group.shortTitle || `Initiative ${pid}`,
      url: `https://ec.europa.eu/info/law/better-regulation/have-your-say/initiatives/${pid}`,
      scanned,
      published,
      positions: positions.sort((a, b) => a.peer.localeCompare(b.peer) || (b.date ?? "").localeCompare(a.date ?? "")),
    };
  });
}
