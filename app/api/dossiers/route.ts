// Watched legislative files (EP Open Data) with linked consultations, questions and votes. See lib/dossiers.ts.
import { NextResponse } from "next/server";
import { getDossier, listDossiers } from "@/lib/dossiers";
import { listRadar } from "@/lib/radar";
import { withTimeout } from "@/lib/cache";
import { trackedQuestions } from "@/lib/epQuestions";
import { listVotesForProcedure } from "@/lib/parliamentVotes";
import type { DossierLinks } from "@/lib/types";

export const dynamic = "force-dynamic";

const SOURCE = "European Parliament Open Data Portal";

export async function GET(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ dossiers: await listDossiers(), source: SOURCE });
    }

    const found = await getDossier(id);
    if (!found) return NextResponse.json({ error: "Unknown dossier." }, { status: 404 });
    const { dossier, file } = found;

    // Linked items are best effort: a slow or failing source leaves its section empty and is reported.
    // The pipeline scan takes ~30s on a cold cache; don't hold the whole page for it.
    const [radar, votes] = await Promise.allSettled([
      withTimeout(listRadar(), 6000, "The Commission pipeline"),
      listVotesForProcedure(file.reference, file.voteQuery),
    ]);
    const gaps: string[] = [];
    if (radar.status === "rejected") gaps.push("Linked Commission initiatives are still loading or unavailable. Reload in a minute.");
    if (votes.status === "rejected") gaps.push("Plenary votes could not be loaded.");

    const links: DossierLinks = {
      initiatives: radar.status === "fulfilled" ? radar.value.filter((i) => file.match.test(i.title)).slice(0, 12) : [],
      questions: trackedQuestions().filter((q) => file.match.test(q.title)).slice(0, 12),
      votes: votes.status === "fulfilled" ? votes.value : [],
    };
    return NextResponse.json({ dossier, links, gaps, source: SOURCE });
  } catch (error) {
    console.error("Dossiers Route Error:", error);
    return NextResponse.json({ error: "Failed to retrieve dossier data." }, { status: 502 });
  }
}
