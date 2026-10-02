// Regulatory calendar (JSON, or iCalendar with ?format=ics). See lib/calendar.ts.
import { NextResponse } from "next/server";
import { getSittingAgenda, listCalendar, toIcs } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const sitting = new URL(req.url).searchParams.get("sitting");
    if (sitting) {
      const agenda = await getSittingAgenda(sitting);
      if (!agenda) return NextResponse.json({ error: "Unknown sitting." }, { status: 404 });
      return NextResponse.json({ agenda });
    }
    const { events, gaps } = await listCalendar();
    if (new URL(req.url).searchParams.get("format") === "ics") {
      return new NextResponse(toIcs(events), {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": 'attachment; filename="eu-regulatory-calendar.ics"',
        },
      });
    }
    return NextResponse.json({ events, gaps });
  } catch (error) {
    console.error("Calendar Route Error:", error);
    return NextResponse.json({ error: "Failed to build the calendar." }, { status: 502 });
  }
}
