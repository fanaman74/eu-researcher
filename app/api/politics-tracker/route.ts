import { NextResponse } from "next/server";
import { type PoliticalEvent } from "@/lib/types";
import { getPrisma } from "@/lib/db";
import { findEvents, createEventWithRelations, toPoliticalEvent } from "@/lib/eventStore";
import { validateEventPayload, MAX_BODY_BYTES } from "@/lib/validateEvent";

// Re-export for any remaining legacy imports â€” prefer importing from @/lib/types directly
export type { PoliticalEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

console.log(
  `[PoliticsTracker API] Storage mode: ${
    process.env.DATABASE_URL ? "PostgreSQL via Prisma" : "in-memory fallback (DATABASE_URL not set)"
  }`
);

// In-memory fallback store, used only when DATABASE_URL is not configured.
// It starts empty (no fabricated seed events) and resets on every cold start.
let POLITICAL_EVENTS_DB: PoliticalEvent[] = [];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const sourceType = searchParams.get("sourceType") || "";
    const category = searchParams.get("category") || "";
    const daysStr = searchParams.get("days") || "60";
    const party = searchParams.get("party") || "";

    const daysLimit = parseInt(daysStr, 10) || 60;

    const prisma = getPrisma();
    if (prisma) {
      const events = await findEvents(prisma, { q, sourceType, category, party, daysLimit });
      return NextResponse.json({ events });
    }

    // In-memory fallback (DATABASE_URL not configured)
    const timeLimitMs = Date.now() - daysLimit * 24 * 60 * 60 * 1000;

    const results = POLITICAL_EVENTS_DB.filter(event => {
      // 60 days rolling age check
      const eventTime = new Date(event.date).getTime();
      if (eventTime < timeLimitMs) return false;

      // Keyword query text matching
      if (q) {
        const query = q.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesDesc = event.description.toLowerCase().includes(query);
        const matchesContent = event.content.toLowerCase().includes(query);
        const matchesEntities = event.entities.some(e => e.name.toLowerCase().includes(query));
        const matchesTags = event.tags.some(t => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesContent && !matchesEntities && !matchesTags) {
          return false;
        }
      }

      // Source type filter
      if (sourceType && event.sourceType !== sourceType) {
        return false;
      }

      // Category filter
      if (category && event.category !== category) {
        return false;
      }

      // Party filter
      if (party && !event.entities.some(e => e.party === party)) {
        return false;
      }

      return true;
    });

    // Chronological order: Latest first
    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ events: results });
  } catch (error: any) {
    console.error("[PoliticsTracker API] GET failed:", error);
    return NextResponse.json({ error: "Failed to retrieve events." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Ingestion auth: Bearer token when INGEST_API_KEY is configured.
    // Fail closed in production when it is not; open only for local development.
    const ingestApiKey = process.env.INGEST_API_KEY;
    if (ingestApiKey) {
      if (req.headers.get("authorization") !== `Bearer ${ingestApiKey}`) {
        return NextResponse.json({ error: "Unauthorized ingestion request." }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production") {
      console.error("[PoliticsTracker API] POST rejected: INGEST_API_KEY is not configured.");
      return NextResponse.json(
        { error: "Event ingestion is not configured on this deployment." },
        { status: 500 }
      );
    }

    // Body size cap (100KB) â€” reject early via Content-Length when present
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body too large." }, { status: 413 });
    }
    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body too large." }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const validation = validateEventPayload(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const data = validation.data;

    const prisma = getPrisma();
    if (prisma) {
      const created = await createEventWithRelations(prisma, data);
      return NextResponse.json({ success: true, event: toPoliticalEvent(created) });
    }

    // In-memory fallback (DATABASE_URL not configured)
    const newEvent: PoliticalEvent = {
      id: `it-evt-${Date.now()}`,
      date: data.date || new Date().toISOString(),
      ...data,
    };

    // Prepend to database
    POLITICAL_EVENTS_DB.unshift(newEvent);

    // Auto-prune items older than 60 days
    const timeLimitMs = Date.now() - 60 * 24 * 60 * 60 * 1000;
    POLITICAL_EVENTS_DB = POLITICAL_EVENTS_DB.filter(event => new Date(event.date).getTime() >= timeLimitMs);

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error: any) {
    console.error("[PoliticsTracker API] POST failed:", error);
    return NextResponse.json({ error: "Failed to ingest event." }, { status: 500 });
  }
}
