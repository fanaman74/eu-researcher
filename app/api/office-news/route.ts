import { NextResponse } from "next/server";
import { getOfficeNewsResponse, nextOfficeNewsSlot } from "@/lib/officeNewsSchedule";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    return NextResponse.json(await getOfficeNewsResponse(), { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("[Office news API] Snapshot read failed:", error);
    const now = new Date();
    return NextResponse.json(
      {
        items: [],
        checkedAt: null,
        attemptedAt: now.toISOString(),
        nextUpdateAt: nextOfficeNewsSlot(now).toISOString(),
        schedule: ["07:00", "12:00", "17:00"],
        timeZone: "Europe/Brussels",
        status: "unavailable",
        error: "Commission news source could not be refreshed.",
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  }
}
