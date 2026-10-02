// MEP search and briefing pack. See lib/mepBriefing.ts.
import { NextResponse } from "next/server";
import { getMepBriefing, searchMeps } from "@/lib/mepBriefing";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      const briefing = await getMepBriefing(id);
      if (!briefing) return NextResponse.json({ error: "Unknown MEP." }, { status: 404 });
      return NextResponse.json({ briefing, source: "European Parliament Open Data Portal; HowTheyVote.eu" });
    }
    const meps = await searchMeps((searchParams.get("q") ?? "").slice(0, 60));
    return NextResponse.json({ meps });
  } catch (error) {
    console.error("MEP Route Error:", error);
    return NextResponse.json({ error: "Failed to retrieve MEP data." }, { status: 502 });
  }
}
