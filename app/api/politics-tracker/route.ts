import { NextResponse } from "next/server";
import { type PoliticalEvent } from "@/lib/types";

// Re-export for any remaining legacy imports — prefer importing from @/lib/types directly
export type { PoliticalEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

// Seed the mock database with events spanning the last 60 days
// TODO: Migrate to Prisma/PostgreSQL persistence — this in-memory array resets on
// every serverless cold start and is not shared across function instances.
let POLITICAL_EVENTS_DB: PoliticalEvent[] = [
  {
    id: "it-evt-001",
    title: "Chamber of Deputies Floor Vote on Renewable Subsidy Streamlining",
    description: "The Chamber passes Decree-Law 45/2026, fast-tracking environmental clearances for utility-scale PV assets.",
    content: "The Italian Chamber of Deputies (Camera dei Deputati) has voted in favor of Decree-Law 45/2026. The new measure introduces a fast-track licensing mechanism for photovoltaic installations exceeding 50MW in Southern Italy and islands. This represents a significant regulatory push to meet the updated RED III targets. The bill passed with 201 'Yes' votes and 125 'No' votes. Key supporters included FdI and Lega, while PD and M5S strongly opposed the bill over concerns regarding soil consumption rules.",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    sourceType: "Official",
    sourceName: "Dati Camera",
    sourceUrl: "https://dati.camera.it/ocd/votazione.rdf/v20260530",
    category: "Floor Vote",
    impactLevel: "High",
    entities: [
      { name: "Giorgia Meloni", role: "Prime Minister", party: "FdI" },
      { name: "Matteo Salvini", role: "Minister of Infrastructure", party: "Lega" }
    ],
    tags: ["Renewables", "Licensing", "Chamber of Deputies", "Solar Grid"]
  },
  {
    id: "it-evt-002",
    title: "Senate Committee Hearing on Grid Infrastructure Funding Audits",
    description: "Senate ITRE committee opens inquiry into Terna's multi-year transmission system operator spending plans.",
    content: "The Senate Industry, Research, and Energy Committee (Senato della Repubblica) has formally launched an audit on national electricity grid financing. Senator Stefano Patuanelli (M5S) tabled the hearing, questioning if the grid infrastructure tariff exemptions granted to large utility providers have effectively incentivized green grid connections. Terna executives are slated to present detailed investment logs next week.",
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    sourceType: "Official",
    sourceName: "Dati Senato",
    sourceUrl: "https://dati.senato.it/leg/19/rel/hearing20260524",
    category: "Committee Meeting",
    impactLevel: "Medium",
    entities: [
      { name: "Stefano Patuanelli", role: "Senator", party: "M5S" }
    ],
    tags: ["Grid Connection", "Inquiry", "Transmission", "Terna"]
  },
  {
    id: "it-evt-003",
    title: "Openpolis Tracks PD Party Leadership Shuffle in Environment Committee",
    description: "Democratic Party replaces spokesperson on the Environment and Productive Activities Commission.",
    content: "Openpolis records indicate a critical movement inside the Chamber's Environment Commission. The Democratic Party (PD) has replaced its key commission coordinator with Rossella Muroni, a highly vocal pro-grid advocate. This shift indicates a potential tightening of PD advocacy alignment towards aggressive distributed energy support structures.",
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    sourceType: "Official",
    sourceName: "Openpolis",
    sourceUrl: "https://openpolis.it/politici/rossella-muroni-commissione-ambiente",
    category: "Political Statement",
    impactLevel: "Low",
    entities: [
      { name: "Rossella Muroni", role: "Commission Coordinator", party: "PD" },
      { name: "Elly Schlein", role: "Party Leader", party: "PD" }
    ],
    tags: ["Commission", "PD", "Lobby Shift", "Personnel"]
  },
  {
    id: "it-evt-004",
    title: "NewsData.io: Minister Pichetto Fratin Confirms State-Aid Talks with EU on Carbon Contracts",
    description: "Ministry of Environment and Energy Security confirms advanced negotiations with DG COMP on industrial carbon contracts.",
    content: "According to reports published by NewsData.io, Italian Minister of Environment Gilberto Pichetto Fratin (Forza Italia) confirmed during a Rome conference that Italy has submitted a formal draft state-aid notification to the European Commission. The draft requests a €2.5 billion package supporting bilateral Carbon Contracts for Difference (CCfDs) aimed at heavy decarbonization assets. Immediate lobbying opportunities exist to expand this to multi-gigawatt thermal storage retrofits.",
    date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
    sourceType: "News",
    sourceName: "NewsData.io",
    sourceUrl: "https://newsdata.io/articles/italy-submits-state-aid-carbon-contracts",
    category: "Political Statement",
    impactLevel: "High",
    entities: [
      { name: "Gilberto Pichetto Fratin", role: "Minister of Environment", party: "FI" }
    ],
    tags: ["State Aid", "Decarbonization", "CCfD", "Forza Italia"]
  },
  {
    id: "it-evt-005",
    title: "Event Registry: Consolidated National Resistance Plan (PNRR) Fund Allocation for Hydro Infrastructure",
    description: "Aggregated reporting details €1.2B package targeting Apulian and Sicilian reservoir grid linkages.",
    content: "Event Registry consolidated news coverage shows the Ministry of European Affairs has signed off on a massive hydro-storage integration program. Spanning 12 news outlets, reports highlight a unified PNRR distribution aimed at developing pumped-storage reservoirs in Sicily. This will directly balance volatile regional solar assets and presents key investment options for utilities.",
    date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days ago
    sourceType: "News",
    sourceName: "Event Registry",
    sourceUrl: "https://newsapi.ai/events/pnrr-hydro-infrastructure-sicily-2026",
    category: "Corporate Regulation",
    impactLevel: "Medium",
    entities: [
      { name: "Raffaele Fitto", role: "Minister of European Affairs", party: "FdI" }
    ],
    tags: ["PNRR", "Hydro", "Sicily", "Infrastructure"]
  }
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const sourceType = searchParams.get("sourceType") || "";
    const category = searchParams.get("category") || "";
    const daysStr = searchParams.get("days") || "60";
    const party = searchParams.get("party") || "";

    const daysLimit = parseInt(daysStr, 10) || 60;
    const timeLimitMs = Date.now() - daysLimit * 24 * 60 * 60 * 1000;

    let results = POLITICAL_EVENTS_DB.filter(event => {
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
    return NextResponse.json({ error: error.message || "Failed to retrieve events." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, content, sourceType, sourceName, sourceUrl, category, impactLevel, entities, tags } = body;

    if (!title || !description || !content || !sourceType || !sourceName || !category || !impactLevel) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const newEvent: PoliticalEvent = {
      id: `it-evt-${Date.now()}`,
      title,
      description,
      content,
      date: new Date().toISOString(), // Current timestamp for dynamic live simulation
      sourceType,
      sourceName,
      sourceUrl: sourceUrl || "https://dati.camera.it",
      category,
      impactLevel,
      entities: entities || [],
      tags: tags || []
    };

    // Prepend to database
    POLITICAL_EVENTS_DB.unshift(newEvent);

    // Auto-prune items older than 60 days
    const timeLimitMs = Date.now() - 60 * 24 * 60 * 60 * 1000;
    POLITICAL_EVENTS_DB = POLITICAL_EVENTS_DB.filter(event => new Date(event.date).getTime() >= timeLimitMs);

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to ingest simulated event." }, { status: 500 });
  }
}
