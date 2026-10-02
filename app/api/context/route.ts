// Context feeds: Commission press corner and Italian market data. See lib/pressCorner.ts and lib/market.ts.
import { NextResponse } from "next/server";
import { listPress, pressFetchedAt } from "@/lib/pressCorner";
import { getMarket, ZONES } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  try {
    if (searchParams.get("view") === "market") {
      const market = await getMarket(searchParams.get("zone") ?? undefined);
      return NextResponse.json({ market, zones: ZONES });
    }
    return NextResponse.json({
      items: await listPress(),
      source: "European Commission — Press corner",
      fetchedAt: pressFetchedAt(),
    });
  } catch (error) {
    console.error("Context Route Error:", error);
    return NextResponse.json({ error: "Failed to retrieve the feed." }, { status: 502 });
  }
}
