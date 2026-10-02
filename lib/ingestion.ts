/**
 * Twice-daily ingestion pipeline (invoked by /api/cron).
 *
 * Ported from the legacy src/workers/ingestionWorker.js:
 *  - NewsData.io Italian politics feed (only when an API key is configured;
 *    reads NEWS_API_KEY, falling back to the legacy NEWSDATA_API_KEY name)
 *  - Real Dati Camera final votes (lib/cameraVotes.ts)
 *  - 60-day rolling retention cleanup
 *
 * No self-scheduling, no top-level PrismaClient: the cron route triggers
 * `runIngestion()` explicitly, and the DB client comes from lib/db.ts.
 */
import { getPrisma } from "./db";
import { createEventIfNew, pruneOldEvents } from "./eventStore";
import { SOURCE_URL_PATTERN, type EventPayload } from "./validateEvent";
import { fetchCameraFinalVotes, cameraVoteToEvent } from "./cameraVotes";
import { isRelevantItalianPolitics } from "./newsFilter";

export type IngestionResult =
  | {
      skipped: false;
      ingested: number;
      dropped: number;
      pruned: number;
      sources: {
        newsData: { enabled: boolean; fetched: number };
        datiCamera: { fetched: number; error: string | null };
      };
    }
  | { skipped: true; reason: string };

// Helper to determine the priority/impact of an event based on key policy concepts
function computeImpactLevel(title: string, content: string): EventPayload["impactLevel"] {
  const text = `${title} ${content}`.toLowerCase();
  if (
    text.includes("tariff") ||
    text.includes("tassa") ||
    text.includes("state aid") ||
    text.includes("aiuti di stato")
  ) {
    return "High";
  }
  if (text.includes("commission") || text.includes("governo") || text.includes("decreto")) {
    return "Medium";
  }
  return "Low";
}

// Normalize NewsData.io API response into an event payload
function transformNewsDataPayload(article: any): EventPayload {
  // NewsData.io's free tier returns a "ONLY AVAILABLE IN PAID PLANS" placeholder as content.
  const realContent =
    typeof article.content === "string" && !/only available in/i.test(article.content)
      ? article.content
      : "";
  return {
    title: article.title || "Untitled Article",
    description: article.description || "",
    content: realContent || article.description || "",
    sourceType: "News",
    sourceName: "NewsData.io",
    sourceUrl: article.link || "",
    category: "Political Statement",
    impactLevel: computeImpactLevel(
      article.title || "",
      `${article.description || ""} ${article.content || ""}`
    ),
    date: article.pubDate ? new Date(article.pubDate).toISOString() : new Date().toISOString(),
    entities: [],
    tags: Array.isArray(article.keywords) ? article.keywords : ["News", "Politica"],
  };
}

/** Source URL of the fabricated vote the pre-fix ingestion wrote; removed on every run. */
const LEGACY_MOCK_SOURCE_URL = "https://dati.camera.it/votazione/sg-2026";

export async function runIngestion(): Promise<IngestionResult> {
  const prisma = getPrisma();
  if (!prisma) {
    return {
      skipped: true,
      reason: "DATABASE_URL is not configured; ingestion has nowhere to persist.",
    };
  }

  let ingested = 0;
  let dropped = 0;
  let newsFetched = 0;

  // 1. Live Italian political news from NewsData.io (skipped when no key is configured)
  const apiKey = process.env.NEWS_API_KEY || process.env.NEWSDATA_API_KEY;
  const newsEnabled = Boolean(apiKey) && !apiKey!.includes("[YOUR_");
  if (newsEnabled) {
    const response = await fetch(
      `https://newsdata.io/api/1/news?apikey=${apiKey}&country=it&language=it&category=politics`
    );
    if (!response.ok) {
      throw new Error(`NewsData.io request failed with HTTP ${response.status}.`);
    }
    const json: any = await response.json();
    const articles: any[] = Array.isArray(json?.results) ? json.results : [];
    newsFetched = articles.length;
    for (const article of articles) {
      if (!isRelevantItalianPolitics(article)) {
        dropped++; // off-topic, non-Italian or multi-country spam from NewsData's loose "politics" category
        continue;
      }
      const normalized = transformNewsDataPayload(article);
      if (!SOURCE_URL_PATTERN.test(normalized.sourceUrl)) {
        dropped++; // refuse to store empty / non-http(s) source URLs
        continue;
      }
      const created = await createEventIfNew(prisma, normalized);
      if (created) ingested++;
    }
  } else {
    console.log("[Ingestion] NEWS_API_KEY not set — skipping NewsData.io fetch.");
  }

  // 2. Real Chamber of Deputies final votes (official open-data SPARQL endpoint).
  //    A failure here must not abort the rest of the run; it is reported in the result.
  let cameraFetched = 0;
  let cameraError: string | null = null;
  try {
    const votes = await fetchCameraFinalVotes(14);
    cameraFetched = votes.length;
    for (const vote of votes) {
      const created = await createEventIfNew(prisma, cameraVoteToEvent(vote));
      if (created) ingested++;
    }
  } catch (error) {
    cameraError = error instanceof Error ? error.message : String(error);
    console.error("[Ingestion] Dati Camera fetch failed:", cameraError);
  }

  // 3. Purge the fabricated placeholder vote that earlier versions wrote as "Official".
  await prisma.event.deleteMany({ where: { sourceUrl: LEGACY_MOCK_SOURCE_URL } });

  // 4. Rolling 60-day retention cleanup
  const pruned = await pruneOldEvents(prisma);

  return {
    skipped: false,
    ingested,
    dropped,
    pruned,
    sources: {
      newsData: { enabled: newsEnabled, fetched: newsFetched },
      datiCamera: { fetched: cameraFetched, error: cameraError },
    },
  };
}
