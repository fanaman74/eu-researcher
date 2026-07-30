import { NextResponse } from "next/server";
import { sanitizeForSparql, STOP_WORDS, clampTopK, executeQuery } from "@/lib/eurlex";

export const dynamic = "force-dynamic";

// Restrict results to secondary legislation, case law, and preparatory documents.
const SECTOR_FILTER = 'FILTER(STRSTARTS(?celex, "3") || STRSTARTS(?celex, "6") || STRSTARTS(?celex, "5"))';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "energy";
    const top_k = clampTopK(searchParams.get("top_k"));

    const keywords = q.toLowerCase()
      .split(/[\s,.\-\/]+/)
      .filter(word => word.length > 2 && !STOP_WORDS.has(word));

    if (keywords.length === 0) {
      keywords.push(q.toLowerCase());
    }

    const safeKeywords = keywords.map(sanitizeForSparql);

    // 1. Try high-precision AND search first
    const andFilters = safeKeywords.map(kw => `CONTAINS(LCASE(?title), "${kw}")`).join(" && ");
    let hits = await executeQuery(andFilters, top_k, SECTOR_FILTER);
    
    // 2. If no hits, fallback to OR search
    if (hits.length === 0 && safeKeywords.length > 1) {
      const orFilters = safeKeywords.map(kw => `CONTAINS(LCASE(?title), "${kw}")`).join(" || ");
      hits = await executeQuery(orFilters, top_k, SECTOR_FILTER);
    }

    return NextResponse.json({ hits });
  } catch (error: any) {
    console.error("SPARQL search error:", error);
    return NextResponse.json({ error: "Failed to search EUR-Lex SPARQL Cellar database." }, { status: 500 });
  }
}
