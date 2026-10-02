/**
 * Dossiers: a curated watchlist of legislative files, each tracked through the
 * European Parliament's procedure record (stage, rapporteurs, shadows, activities).
 *
 * The watchlist and the keywords that link each file to consultations, MEP
 * questions and votes are a hand-made mapping — edit WATCHLIST to change them.
 * Each file costs one EP API request per refresh; the API allows roughly 150
 * requests per window, so keep the list to a few dozen at most.
 *
 * Council status is not covered: the Council's site refuses automated access.
 */
import { cached, mapLimit } from "./cache";
import { committeeLabel, epGet, groupLabel, mepDirectory } from "./meps";
import type { Dossier, DossierActor } from "./types";

const TTL_MS = 12 * 60 * 60 * 1000;
const DOCEO = "https://www.europarl.europa.eu/doceo/document";

export interface WatchedFile {
  /** EP procedure id: "2025/0399(COD)" -> "2025-0399". */
  id: string;
  reference: string;
  name: string;
  why: string;
  /** Commission proposal, e.g. "COM(2025) 1006". */
  proposal: string;
  celex: string;
  /** Matches titles of Have Your Say initiatives and MEP questions. */
  match: RegExp;
  /** Search term for plenary votes (results are then filtered by procedure reference). */
  voteQuery: string;
}

export const WATCHLIST: WatchedFile[] = [
  {
    id: "2025-0399",
    reference: "2025/0399(COD)",
    name: "Trans-European energy infrastructure (TEN-E)",
    why: "Grid planning, projects of common interest and cost allocation for cross-border infrastructure.",
    proposal: "COM(2025) 1006",
    celex: "52025PC1006",
    match: /\b(TEN-E|trans-european energy|energy infrastructure|grids? package|interconnect\w*|projects? of common interest)\b/i,
    voteQuery: "energy infrastructure",
  },
  {
    id: "2025-0400",
    reference: "2025/0400(COD)",
    name: "Faster permit-granting (grids, renewables, storage)",
    why: "Permitting deadlines for grid, renewable and storage projects.",
    proposal: "COM(2025) 1007",
    celex: "52025PC1007",
    match: /\b(permit\w*|authori[sz]ation procedures?)\b/i,
    voteQuery: "permit-granting",
  },
  {
    id: "2026-0203",
    reference: "2026/0203(COD)",
    name: "Electricity bills: network charges, taxation, grid connections",
    why: "Network tariffs, levies on bills, smart grids and connection rules.",
    proposal: "COM(2026) 600",
    celex: "52026PC0600",
    match: /\b(network charges?|network tariffs?|electricity bills?|grid connection\w*|smart grids?|electrification)\b/i,
    voteQuery: "electricity",
  },
  {
    id: "2026-0212",
    reference: "2026/0212(COD)",
    name: "EU ETS revision",
    why: "Carbon price exposure for thermal generation and the market stability reserve.",
    proposal: "COM(2026) 616",
    celex: "52026PC0616",
    match: /\b(ETS|emissions? trading|market stability reserve|carbon market)\b/i,
    voteQuery: "emissions trading",
  },
  {
    id: "2025-0418",
    reference: "2025/0418(COD)",
    name: "Temporary Decarbonisation Fund",
    why: "Funding for industrial decarbonisation and electrification demand.",
    proposal: "COM(2025) 990",
    celex: "52025PC0990",
    match: /\bdecarbonisation fund\b/i,
    voteQuery: "decarbonisation fund",
  },
  {
    id: "2026-0068",
    reference: "2026/0068(COD)",
    name: "Industrial capacity and decarbonisation (Industrial Accelerator)",
    why: "Lead markets, low-carbon product rules and permitting for strategic sectors.",
    proposal: "COM(2026) 100",
    celex: "52026PC0100",
    match: /\b(industrial accelerator|industrial decarboni[sz]ation|lead markets?|net[- ]zero industry)\b/i,
    voteQuery: "industrial decarbonisation",
  },
  {
    id: "2026-0169",
    reference: "2026/0169(COD)",
    name: "Energy labelling simplification",
    why: "Product rules affecting retail and energy-services offers.",
    proposal: "COM(2026) 565",
    celex: "52026PC0565",
    match: /\b(energy label\w*|ecodesign)\b/i,
    voteQuery: "energy labelling",
  },
  {
    id: "2025-0420",
    reference: "2025/0420(COD)",
    name: "CO2 standards for cars and vans",
    why: "Pace of vehicle electrification, which drives charging demand and e-mobility services.",
    proposal: "COM(2025) 995",
    celex: "52025PC0995",
    match: /\b(CO2 (emission )?(performance )?standards?|light[- ]duty vehicles?|zero-emission vehicles?|electric vehicles?|charging infrastructure)\b/i,
    voteQuery: "CO2 emission performance standards",
  },
  {
    id: "2026-0265",
    reference: "2026/0265(COD)",
    name: "Public Procurement Act",
    why: "Replaces the utilities procurement directive (2014/25/EU) that governs network operators' purchasing.",
    proposal: "COM(2026) 590",
    celex: "52026PC0590",
    match: /\b(public procurement|public contracts?|concessions?)\b/i,
    voteQuery: "public procurement",
  },
];

const PHASES: Record<string, string> = {
  RDG1: "First reading",
  RDG2: "Second reading",
  RDG3: "Third reading (conciliation)",
};

const ACTIVITIES: Record<string, string> = {
  REFERRAL: "Referred to committee",
  COMMITTEE_TABLING_REPORT: "Draft report tabled in committee",
  COMMITTEE_TABLING_OPINION: "Draft opinion tabled in committee",
  COMMITTEE_TABLING_AMENDMENT: "Committee amendments tabled",
  COMMITTEE_ADOPTING_OPINION: "Opinion adopted in committee",
  COMMITTEE_ADOPTING_REPORT: "Report adopted in committee",
  TABLING_PLENARY: "Tabled for plenary",
  PLENARY_AMEND: "Plenary adopted amendments",
  PLENARY_ADOPT_POSITION: "Plenary adopted Parliament's position",
  PLENARY_REFER_COMMITTEE_INTERINSTITUTIONAL_NEGOTIATIONS: "Plenary referred the file back to committee for negotiations",
  COMMITTEE_APPROVE_PROVISIONAL_AGREEMENT: "Committee approved the provisional agreement",
  PLENARY_ENDORSE_COMMITTEE_INTERINSTITUTIONAL_NEGOTIATIONS: "Plenary endorsed the mandate for interinstitutional negotiations",
  INTERINSTITUTIONAL_NEGOTIATION: "Interinstitutional negotiations (trilogue)",
  PLENARY_DEBATE: "Plenary debate",
  PLENARY_VOTE: "Plenary vote",
  PLENARY_VOTE_RESULTS: "Plenary vote results",
  SIGNATURE: "Act signed",
  PUBLICATION_OFFICIAL_JOURNAL: "Published in the Official Journal",
};

const ROLES: Record<string, string> = {
  RAPPORTEUR: "Rapporteur",
  RAPPORTEUR_SHADOW: "Shadow rapporteur",
  RAPPORTEUR_OPINION: "Rapporteur for opinion",
  RAPPORTEUR_SHADOW_OPINION: "Shadow rapporteur for opinion",
};
const ROLE_ORDER = Object.keys(ROLES);

const tail = (s: unknown) => String(s ?? "").split("/").pop() ?? "";
/** JSON-LD writes a single value as a bare object and several as an array. */
const list = (v: unknown): any[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
const humanize = (code: string) => code.charAt(0) + code.slice(1).toLowerCase().replace(/_/g, " ");

function unavailable(file: WatchedFile): Dossier {
  return {
    id: file.id,
    reference: file.reference,
    name: file.name,
    title: file.name,
    why: file.why,
    proposal: file.proposal,
    proposalUrl: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${file.celex}`,
    stage: "No Parliament record available",
    leadCommittee: "",
    opinionCommittees: [],
    actors: [],
    timeline: [],
    lastActivity: null,
    oeilUrl: `https://oeil.europarl.europa.eu/oeil/en/procedure-file?reference=${encodeURIComponent(file.reference)}`,
    available: false,
  };
}

/** Build a dossier from an EP procedure record. Exported for tests. */
export function parseProcedure(
  file: WatchedFile,
  proc: any,
  meps: Map<string, { name: string; country: string; group: string }>
): Dossier {
  const parts = list(proc.had_participation);
  const orgsWith = (role: string) =>
    parts.filter((p) => tail(p.participation_role) === role).flatMap((p) => list(p.had_participant_organization)).map(committeeLabel);

  const actors: DossierActor[] = parts
    .filter((p) => ROLES[tail(p.participation_role)] && list(p.had_participant_person).length > 0)
    .map((p) => {
      const mepId = tail(list(p.had_participant_person)[0]);
      const mep = meps.get(mepId);
      return {
        mepId,
        // Former MEPs are not in the current directory; link by id instead of guessing a name.
        name: mep?.name ?? `MEP ${mepId}`,
        role: ROLES[tail(p.participation_role)],
        group: groupLabel(p.politicalGroup) || mep?.group || "",
        country: mep?.country ?? "",
        committee: tail(p.participation_in_name_of),
      };
    })
    .sort(
      (a, b) =>
        ROLE_ORDER.findIndex((r) => ROLES[r] === a.role) - ROLE_ORDER.findIndex((r) => ROLES[r] === b.role) || a.group.localeCompare(b.group)
    );

  // One timeline entry per date and activity type (amendment batches arrive as several records).
  const merged = new Map<string, Dossier["timeline"][number]>();
  for (const a of list(proc.consists_of)) {
    const type = tail(a.had_activity_type);
    const date = String(a.activity_date ?? "").slice(0, 10);
    if (!date || !type) continue;
    const key = `${date}|${type}`;
    const entry = merged.get(key) ?? { date, label: ACTIVITIES[type] ?? humanize(type), documents: [] };
    for (const doc of list(a.based_on_a_realization_of)) {
      const id = tail(doc);
      if (!entry.documents.some((d) => d.id === id)) entry.documents.push({ id, url: `${DOCEO}/${id}_EN.html` });
    }
    merged.set(key, entry);
  }
  const timeline = [...merged.values()].sort((a, b) => b.date.localeCompare(a.date));
  const last = timeline[0] ?? null;
  const phase = tail(proc.current_stage);
  const types = new Set(list(proc.consists_of).map((a) => tail(a.had_activity_type)));
  const concluded = types.has("PUBLICATION_OFFICIAL_JOURNAL")
    ? "Adopted — published in the Official Journal"
    : types.has("SIGNATURE")
      ? "Adopted — act signed"
      : null;

  return {
    ...unavailable(file),
    title: proc.process_title?.en ?? file.name,
    stage: concluded ?? PHASES[phase] ?? (phase || "Not started"),
    leadCommittee: orgsWith("COMMITTEE_LEAD")[0] ?? "",
    opinionCommittees: orgsWith("COMMITTEE_OPINION"),
    actors,
    timeline,
    lastActivity: last ? { date: last.date, label: last.label } : null,
    available: true,
  };
}

/** Every watched file with its current Parliament status. */
export async function listDossiers(): Promise<Dossier[]> {
  return cached("dossiers", TTL_MS, async () => {
    const meps = await mepDirectory().catch(() => new Map());
    let failures = 0;
    const out = await mapLimit(WATCHLIST, 3, async (file) => {
      try {
        const data = await epGet(`/procedures/${file.id}`);
        return parseProcedure(file, data.data[0], meps);
      } catch (err) {
        // 404: the Parliament has not opened the file yet. Anything else counts as a failure.
        if ((err as any)?.status !== 404) failures++;
        console.warn(`[Dossiers] ${file.reference} unavailable:`, (err as Error).message);
        return unavailable(file);
      }
    });
    // Rate-limited or down: keep the previous good copy rather than caching a page of gaps.
    if (failures > WATCHLIST.length / 2) throw new Error("European Parliament API unavailable for most watched files.");
    return out;
  });
}

export async function getDossier(id: string): Promise<{ dossier: Dossier; file: WatchedFile } | null> {
  const file = WATCHLIST.find((f) => f.id === id);
  if (!file) return null;
  const dossier = (await listDossiers()).find((d) => d.id === id) ?? unavailable(file);
  return { dossier, file };
}
