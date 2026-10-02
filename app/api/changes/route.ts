// Change feed and digest. See lib/changeFeed.ts and lib/digest.ts.
import { NextResponse } from "next/server";
import { listChanges } from "@/lib/changeFeed";
import { digestText, getDigest, SOURCE_LABELS } from "@/lib/digest";
import type { ChangeSource } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const view = url.searchParams.get("view");

    if (view === "digest" || view === "text") {
      const digest = await getDigest(Number(url.searchParams.get("hours")) || 24);
      if (view === "text") {
        return new NextResponse(digestText(digest, url.origin), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
      return NextResponse.json({ digest, text: digestText(digest, url.origin) });
    }

    const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 7, 1), 90);
    const requested = url.searchParams.get("source") ?? "";
    const source = requested in SOURCE_LABELS ? (requested as ChangeSource) : undefined;
    const { changes, persistent } = await listChanges({ days, source });
    return NextResponse.json({ changes, persistent, days, sources: SOURCE_LABELS });
  } catch (error) {
    console.error("Changes Route Error:", error);
    return NextResponse.json({ error: "Failed to retrieve the change feed." }, { status: 502 });
  }
}
