// Peer watch: utilities' and associations' consultation responses and Commission meetings.
// See lib/peers.ts and lib/commissionMeetings.ts.
import { NextResponse } from "next/server";
import { getPeerPositions, PEERS } from "@/lib/peers";
import { findMeetings, meetingsFetchedAt, peerBenchmark } from "@/lib/commissionMeetings";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view");

    if (view === "meetings") {
      const requested = searchParams.get("peer") ?? "";
      const peer = PEERS.some((p) => p.name === requested) ? requested : undefined;
      const q = (searchParams.get("q") ?? "").slice(0, 100);
      const [benchmark, found] = await Promise.all([peerBenchmark(), peer || q ? findMeetings({ peer, q }) : null]);
      return NextResponse.json({
        benchmark,
        meetings: found?.meetings ?? [],
        total: found?.total ?? 0,
        source: "European Commission — meetings with interest representatives (2024–2029 term)",
        fetchedAt: meetingsFetchedAt(),
      });
    }

    const pid = searchParams.get("pid") ?? "";
    const result = await getPeerPositions(pid);
    if (!result) return NextResponse.json({ error: "Unknown consultation." }, { status: 404 });
    return NextResponse.json({ ...result, peers: PEERS.map((p) => p.name), source: "European Commission — Have Your Say" });
  } catch (error) {
    console.error("Peers Route Error:", error);
    return NextResponse.json({ error: "Failed to retrieve peer data." }, { status: 502 });
  }
}
