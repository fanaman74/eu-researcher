// Live data: Commission initiatives pipeline (Have Your Say). See lib/radar.ts.
import { NextResponse } from "next/server";
import { listRadar, radarFetchedAt, upcomingRadar } from "@/lib/radar";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const all = new URL(req.url).searchParams.get("all") === "1";
    const items = await listRadar();
    return NextResponse.json({
      items: all ? items : upcomingRadar(items),
      total: items.length,
      source: "European Commission — Have Your Say (energy-tagged initiatives)",
      fetchedAt: radarFetchedAt(),
    });
  } catch (error) {
    console.error("Radar Route Error:", error);
    return NextResponse.json({ error: "Failed to retrieve the Commission pipeline." }, { status: 502 });
  }
}
