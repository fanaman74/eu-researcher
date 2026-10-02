/**
 * MEP briefing pack: group, country, committee seats, roles on watched files,
 * authored questions and voting record on recent energy votes.
 *
 * Every field comes from the Parliament's open data or HowTheyVote.eu; nothing
 * here characterises an MEP's views.
 */
import { cached } from "./cache";
import { listDossiers } from "./dossiers";
import { trackedQuestions } from "./epQuestions";
import { bodyDirectory, committeeLabel, epGet, mepDirectory } from "./meps";
import { memberEnergyVotes } from "./parliamentVotes";
import type { MepBriefing, MepSummary } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

const ROLES: Record<string, string> = {
  CHAIR: "Chair",
  CHAIR_VICE: "Vice-Chair",
  MEMBER: "Member",
  MEMBER_SUBSTITUTE: "Substitute",
  COORDINATOR: "Coordinator",
};
const COMMITTEE_KINDS = new Set(["COMMITTEE_PARLIAMENTARY_STANDING", "COMMITTEE_PARLIAMENTARY_SUB", "COMMITTEE_PARLIAMENTARY_TEMPORARY"]);
const tail = (s: unknown) => String(s ?? "").split("/").pop() ?? "";
const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Sitting MEPs whose name matches `q`; without `q`, the Italian delegation. */
export async function searchMeps(q: string): Promise<MepSummary[]> {
  const all = [...(await mepDirectory()).values()];
  const needle = plain(q.trim());
  const hits = needle ? all.filter((m) => plain(m.name).includes(needle)) : all.filter((m) => m.country === "IT");
  return hits.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 80);
}

export async function getMepBriefing(id: string): Promise<MepBriefing | null> {
  if (!/^\d{1,9}$/.test(id)) return null;
  const summary = (await mepDirectory()).get(id);
  if (!summary) return null;

  // Only the profile request is cached here (a failed one is retried next time);
  // the other sources keep their own caches.
  const [detail, bodies, dossiers, votes] = await Promise.allSettled([
    cached(`mep:${id}`, DAY_MS, () => epGet(`/meps/${id}`)),
    bodyDirectory(),
    listDossiers(),
    memberEnergyVotes(id),
  ]);

  const person = detail.status === "fulfilled" ? detail.value.data?.[0] : null;
  const bodyMap = bodies.status === "fulfilled" ? bodies.value : new Map();
  const committees = ((person?.hasMembership ?? []) as any[])
    .filter((m) => !m.memberDuring?.endDate && COMMITTEE_KINDS.has(tail(m.membershipClassification)))
    .map((m) => ({
      body: committeeLabel(bodyMap.get(tail(m.organization))?.label ?? tail(m.organization)),
      role: ROLES[tail(m.role)] ?? tail(m.role),
    }))
    .sort((a, b) => a.body.localeCompare(b.body));

  // Questions list every author as "Given FAMILY (Group)"; match on the full name.
  const name = plain(summary.name);
  const questions = trackedQuestions().filter((q) => plain(q.askedBy).includes(name)).slice(0, 20);

  return {
    ...summary,
    email: typeof person?.hasEmail === "string" ? person.hasEmail.replace(/^mailto:/, "") : null,
    profileUrl: `https://www.europarl.europa.eu/meps/en/${id}`,
    committees,
    dossierRoles:
      dossiers.status === "fulfilled"
        ? dossiers.value.flatMap((d) =>
            d.actors
              .filter((a) => a.mepId === id)
              .map((a) => ({ dossierId: d.id, dossier: d.name, role: a.committee ? `${a.role} (${a.committee})` : a.role }))
          )
        : [],
    questions,
    votes: votes.status === "fulfilled" ? votes.value.filter((v) => v.position !== "NOT_A_MEMBER") : [],
    gaps: [
      ...(detail.status === "rejected" ? ["Committee seats and contact details could not be loaded from the Parliament API."] : []),
      ...(votes.status === "rejected" ? ["Voting record could not be loaded from HowTheyVote.eu."] : []),
    ],
  };
}
