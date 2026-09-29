// Live data: EP Open Data Portal (questions) and HowTheyVote.eu (plenary votes).
// See lib/epQuestions.ts and lib/parliamentVotes.ts.
import { NextResponse } from "next/server";
import { findQuestions } from "@/lib/epQuestions";
import { listPlenaryVotes, getPlenaryVote } from "@/lib/parliamentVotes";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "questions";

    if (type === "votes") {
      const id = searchParams.get("id");
      if (id) {
        const vote = await getPlenaryVote(id);
        return NextResponse.json({ vote, source: "HowTheyVote.eu (European Parliament roll-call records)" });
      }
      const votes = await listPlenaryVotes(searchParams.get("q") || "energy");
      return NextResponse.json({ votes, source: "HowTheyVote.eu (European Parliament roll-call records)" });
    }

    const q = (searchParams.get("q") || "").slice(0, 100);
    const { questions, tracked, partial, fetchedAt } = await findQuestions(q);
    return NextResponse.json({
      questions,
      tracked,
      partial,
      fetchedAt,
      source: "European Parliament Open Data Portal",
    });
  } catch (error: any) {
    console.error("Parliament Route Error:", error);
    return NextResponse.json({ error: "Failed to retrieve EP watch feed." }, { status: 502 });
  }
}
