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

    const safeKeywords = keywords.flatMap(kw => sanitizeForSparql(kw).split(/[^a-zA-Z0-9]+/)).filter(Boolean);

    // 1. Try high-precision AND search first
    let hits = await executeQuery(safeKeywords, "AND", top_k, SECTOR_FILTER);

    // 2. If no hits, fallback to OR search
    if (hits.length === 0 && safeKeywords.length > 1) {
      hits = await executeQuery(safeKeywords, "OR", top_k, SECTOR_FILTER);
    }

    return NextResponse.json({ hits });
  } catch (error: any) {
    console.error("SPARQL search error:", error);
    return NextResponse.json({ error: "Failed to search EUR-Lex SPARQL Cellar database." }, { status: 500 });
  }
}
