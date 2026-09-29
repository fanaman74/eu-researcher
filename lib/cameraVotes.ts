/**
 * Real Chamber of Deputies (Camera dei Deputati) roll-call data from the
 * official open-data SPARQL endpoint (https://dati.camera.it/sparql, no key).
 *
 * The dataset exposes bill identifiers ("DDL 2628-A E ABB") rather than titles,
 * so events built from it state only what the record contains: bill id, date,
 * counts and outcome. No topic or impact is inferred.
 *
 * Note: the endpoint's firewall rejects "&&" inside FILTER (HTTP "Request Rejected"),
 * so conditions are written as separate FILTER clauses.
 */
import type { EventPayload } from "./validateEvent";

const ENDPOINT = "https://dati.camera.it/sparql";
const OCD = "http://dati.camera.it/ocd/";
const DC = "http://purl.org/dc/elements/1.1/";

export interface CameraFinalVote {
  uri: string;
  description: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  favorevoli: number;
  contrari: number;
  astenuti: number;
  approvato: boolean;
}

/** YYYYMMDD -> YYYY-MM-DD */
function isoDay(raw: string): string {
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

/** Fetch final votes from the last `days` days (deduplicated by vote URI). */
export async function fetchCameraFinalVotes(days = 14): Promise<CameraFinalVote[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const query = `SELECT DISTINCT ?v ?desc ?date ?fav ?contr ?ast ?app WHERE {
    ?v a <${OCD}votazione> ;
       <${OCD}votazioneFinale> ?f ;
       <${DC}date> ?date ;
       <${DC}description> ?desc ;
       <${OCD}favorevoli> ?fav ;
       <${OCD}contrari> ?contr ;
       <${OCD}astenuti> ?ast ;
       <${OCD}approvato> ?app .
    FILTER(?f = 1)
    FILTER(?date >= "${since}")
  } ORDER BY DESC(?date) LIMIT 50`;

  const url = `${ENDPOINT}?query=${encodeURIComponent(query)}&format=${encodeURIComponent("application/sparql-results+json")}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Dati Camera request failed with HTTP ${res.status}.`);
  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new Error("Dati Camera returned a non-JSON response (request rejected).");
  }

  const seen = new Set<string>();
  const votes: CameraFinalVote[] = [];
  for (const b of json.results.bindings as any[]) {
    const uri = b.v.value as string;
    if (seen.has(uri)) continue;
    seen.add(uri);
    votes.push({
      uri,
      description: String(b.desc.value).trim(),
      date: isoDay(b.date.value),
      favorevoli: Number(b.fav.value),
      contrari: Number(b.contr.value),
      astenuti: Number(b.ast.value),
      approvato: Number(b.app.value) === 1,
    });
  }
  return votes;
}

/** Public vote-detail page on documenti.camera.it, derived from the vote URI (…/vs19_714_031). */
export function cameraVoteUrl(uri: string): string {
  const m = /vs(\d+)_(\d+)_(\d+)$/.exec(uri);
  if (!m) return "https://dati.camera.it";
  const roman = m[1] === "19" ? "XIX" : m[1] === "18" ? "XVIII" : m[1];
  return `http://documenti.camera.it/apps/votazioni/votazionitutte/schedavotazione.asp?Legislatura=${roman}&RifVotazione=${m[2]}_${parseInt(m[3], 10)}&tipo=dettaglio`;
}

export function cameraVoteToEvent(v: CameraFinalVote): EventPayload {
  const outcome = v.approvato ? "approved" : "not approved";
  const title = `Chamber final vote: ${v.description.replace(/\s*-\s*VOTO FINALE$/i, "")}`;
  return {
    title,
    description: `Final vote ${outcome} — ${v.favorevoli} in favour, ${v.contrari} against, ${v.astenuti} abstentions.`,
    content:
      `Roll-call record from the Italian Chamber of Deputies open-data service. ` +
      `Item: ${v.description}. Date: ${v.date}. Result: ${v.favorevoli} favourable, ${v.contrari} contrary, ` +
      `${v.astenuti} abstained; the measure was ${outcome}. The open dataset lists the bill by number only; ` +
      `see the source link for the full vote sheet.`,
    sourceType: "Official",
    sourceName: "Dati Camera",
    sourceUrl: cameraVoteUrl(v.uri),
    category: "Floor Vote",
    impactLevel: "Low",
    date: `${v.date}T00:00:00.000Z`,
    entities: [],
    tags: ["Camera", "Voto finale"],
  };
}
