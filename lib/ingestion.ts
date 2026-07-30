/**
 * Twice-daily ingestion pipeline (invoked by /api/cron).
 *
 * Ported from the legacy src/workers/ingestionWorker.js:
 *  - NewsData.io Italian politics feed (only when an API key is configured;
 *    reads NEWS_API_KEY, falling back to the legacy NEWSDATA_API_KEY name)
 *  - Mock Dati Camera floor-vote payload (placeholder kept from the old worker
 *    until a real open-data source is wired in)
 *  - 60-day rolling retention cleanup
 *
 * No self-scheduling, no top-level PrismaClient: the cron route triggers
 * `runIngestion()` explicitly, and the DB client comes from lib/db.ts.
 */
import { getPrisma } from "./db";
import { createEventIfNew, pruneOldEvents } from "./eventStore";
import { SOURCE_URL_PATTERN, type EventPayload } from "./validateEvent";

export type IngestionResult =
  | {
      skipped: false;
      ingested: number;
      dropped: number;
      pruned: number;
      sources: {
        newsData: { enabled: boolean; fetched: number };
        cameraMock: { fetched: number };
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
  return {
    title: article.title || "Untitled Article",
    description: article.description || "",
    content: article.content || article.description || "",
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

// Normalize a Dati Camera-style payload into an event payload
function transformCameraPayload(rdfItem: any): EventPayload {
  return {
    title: `Chamber Floor Vote: ${rdfItem.titolo || "Legislative Act"}`,
    description: rdfItem.descrizione || "No description provided.",
    content: rdfItem.testoCompleto || rdfItem.descrizione || "",
    sourceType: "Official",
    sourceName: "Dati Camera",
    sourceUrl: rdfItem.url || "https://dati.camera.it",
    category: "Floor Vote",
    impactLevel: computeImpactLevel(rdfItem.titolo || "", rdfItem.testoCompleto || ""),
    date: rdfItem.data ? new Date(rdfItem.data).toISOString() : new Date().toISOString(),
    entities: Array.isArray(rdfItem.politici)
      ? rdfItem.politici.map((p: any) => ({
          name: p.nome,
          party: p.partito || "Other",
          role: p.ruolo || "Deputato",
        }))
      : [],
    tags: Array.isArray(rdfItem.keywords) ? rdfItem.keywords : ["Camera"],
  };
}

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
      `https://newsdata.io/api/1/news?apikey=${apiKey}&country=it&category=politics`
    );
    if (!response.ok) {
      throw new Error(`NewsData.io request failed with HTTP ${response.status}.`);
    }
    const json: any = await response.json();
    const articles: any[] = Array.isArray(json?.results) ? json.results : [];
    newsFetched = articles.length;
    for (const article of articles) {
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

  // 2. Mock Chamber of Deputies floor vote (placeholder preserved from the legacy worker)
  const mockRdfResponse = [
    {
      titolo: "Voto Camera: Disegno di Legge Tariffario Smart Grid",
      descrizione: "Esenzione fiscale approvata per reti intelligenti e stoccaggi energetici.",
      testoCompleto:
        "La Camera ha approvato le modifiche sulle Smart Grid inserendo sgravi tariffari per le imprese energivore.",
      data: new Date().toISOString(),
      url: "https://dati.camera.it/votazione/sg-2026",
      politici: [{ nome: "Matteo Salvini", partito: "Lega", ruolo: "Minister of Infrastructure" }],
      keywords: ["Smart Grid", "Lega", "Tariffario"],
    },
  ];
  for (const rawItem of mockRdfResponse) {
    // Mock timestamps are always "now", so dedupe on title only
    const created = await createEventIfNew(prisma, transformCameraPayload(rawItem), {
      titleOnly: true,
    });
    if (created) ingested++;
  }

  // 3. Rolling 60-day retention cleanup
  const pruned = await pruneOldEvents(prisma);

  return {
    skipped: false,
    ingested,
    dropped,
    pruned,
    sources: {
      newsData: { enabled: newsEnabled, fetched: newsFetched },
      cameraMock: { fetched: mockRdfResponse.length },
    },
  };
}
