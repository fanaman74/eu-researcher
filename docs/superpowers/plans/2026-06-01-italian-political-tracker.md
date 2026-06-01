# Italian Political Event Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a high-fidelity Next.js page `/politics-tracker` and mock API route `/api/politics-tracker` to display a searchable, filterable, and dynamically simulated 60-day historical timeline of Italian political events designed for a corporate liaison officer.

**Architecture:** We will implement an App Router Next.js page utilizing client-side state for interactive filters, integrated with an App Router API route storing events in-memory. We will also modify the gateway landing page to integrate this new tracking division.

**Tech Stack:** Next.js, React, Tailwind CSS, Lucide icons.

---

### Task 1: Create the API Endpoint `/api/politics-tracker`

**Files:**
- Create: `app/api/politics-tracker/route.ts`

- [ ] **Step 1: Write mock database structures and helper interfaces**

Create the route handler file that defines the TypeScript interfaces and implements the in-memory array containing highly realistic, detailed Italian political events spanning the last 60 days.

```typescript
// app/api/politics-tracker/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface PoliticalEvent {
  id: string;
  title: string;
  description: string;
  content: string; 
  date: string; // ISO 8601 string
  sourceType: "Official" | "News";
  sourceName: "Dati Camera" | "Dati Senato" | "Openpolis" | "NewsData.io" | "Event Registry";
  sourceUrl: string;
  category: "Legislative Act" | "Committee Meeting" | "Floor Vote" | "Political Statement" | "Corporate Regulation";
  impactLevel: "High" | "Medium" | "Low";
  entities: {
    name: string;
    role: string;
    party: "FdI" | "PD" | "M5S" | "Lega" | "FI" | "Other";
  }[];
  tags: string[];
}

// Seed the mock database with events spanning the last 60 days
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
```

- [ ] **Step 2: Implement GET and POST methods in the same route file**

Add the GET filtering logic and the POST ingestion endpoint logic to `app/api/politics-tracker/route.ts`.

```typescript
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
```

- [ ] **Step 3: Verification of the endpoint**

Start the server locally and make a GET request to verify structure:
Run: `curl -s "http://localhost:3000/api/politics-tracker"`
Expected: Output contains `{"events": [...]}` with the seeded events.

---

### Task 2: Create the Dashboard Page `/politics-tracker`

**Files:**
- Create: `app/politics-tracker/page.tsx`

- [ ] **Step 1: Write standard page layout and state imports**

Create `app/politics-tracker/page.tsx`. Add state hooks, icons import, and main telemetry navigation header structure.

```tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Scale, 
  Search, 
  Filter, 
  Calendar, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  Radio,
  ExternalLink,
  ChevronRight,
  Compass,
  PlusCircle,
  Database,
  Check,
  RotateCcw
} from "lucide-react";
import { PoliticalEvent } from "../api/politics-tracker/route";

export default function ItalianTrackerPage() {
  const [events, setEvents] = useState<PoliticalEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PoliticalEvent | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filtering States
  const [search, setSearch] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [category, setCategory] = useState("");
  const [party, setParty] = useState("");
  const [days, setDays] = useState(60);

  // Ingestion Simulator States
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatedSource, setSimulatedSource] = useState<"Camera" | "News">("Camera");
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationSuccess, setSimulationSuccess] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (sourceType) params.append("sourceType", sourceType);
      if (category) params.append("category", category);
      if (party) params.append("party", party);
      params.append("days", days.toString());

      const res = await fetch(`/api/politics-tracker?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        // Autoselect first event if none selected
        if (data.events?.length > 0 && !selectedEvent) {
          setSelectedEvent(data.events[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search, sourceType, category, party, days]);
```

- [ ] **Step 2: Add dynamic filter triggers, helper badges, and details content**

Add the filter layout reset and simulated event triggers.

```tsx
  const handleResetFilters = () => {
    setSearch("");
    setSourceType("");
    setCategory("");
    setParty("");
    setDays(60);
  };

  const handleSimulateIngestion = async (preset: string) => {
    setSimulationLoading(true);
    setSimulationSuccess(false);
    
    let payload = {};

    if (preset === "camera-vote") {
      payload = {
        title: "Chamber Committee Vote: Regional Energy Self-Sufficiency Framework",
        description: "Committee X (Productive Activities) passes critical amendment protecting grid priorities for solar microgrids.",
        content: "A bipartisan majority in the Chamber's Tenth Committee voted to fast-track self-generation approvals for industrial consumers in Piedmont and Veneto. Spurred by lobbying representing domestic manufacturing interests, the amendment limits Terna's ability to defer connection licenses for distributed battery facilities. This secures key advantages for grid-edge utilities. The vote was championed by Lega and FI, with PD voting in support after environmental audits were added.",
        sourceType: "Official",
        sourceName: "Dati Camera",
        sourceUrl: "https://dati.camera.it/ocd/votazione.rdf/v20260601-grid-edge",
        category: "Floor Vote",
        impactLevel: "High",
        entities: [
          { name: "Alberto Gusmeroli", role: "Committee Chairman", party: "Lega" }
        ],
        tags: ["Distributed Grid", "Microgrids", "Chamber", "Self-Generation"]
      };
    } else {
      payload = {
        title: "NewsData.io: Meloni Administration Announces Strategic Tariff Caps Overhaul",
        description: "Government decrees emergency cap overrides to secure industrial energy pricing corridors.",
        content: "As reported by NewsData.io, Prime Minister Giorgia Meloni has introduced an emergency decree-law addressing retail energy tariff surges. The measure bypasses regional consultative grids to set standard grid-fee deductions for manufacturing parks. This avoids DG COMP state-aid scrutiny by labeling the funds as regional infrastructure compensation assets.",
        sourceType: "News",
        sourceName: "NewsData.io",
        sourceUrl: "https://newsdata.io/articles/meloni-decree-tariff-infrastructure",
        category: "Political Statement",
        impactLevel: "High",
        entities: [
          { name: "Giorgia Meloni", role: "Prime Minister", party: "FdI" }
        ],
        tags: ["Tariff Cap", "Chamber", "State Aid", "Decarbonization"]
      };
    }

    try {
      const res = await fetch("/api/politics-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSimulationSuccess(true);
        setIsSimulatorOpen(false);
        fetchEvents();
        setTimeout(() => setSimulationSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulationLoading(false);
    }
  };
```

- [ ] **Step 3: Write the UI layout (HTML & Tailwind classes)**

Append the full UI layout inside `app/politics-tracker/page.tsx`.

```tsx
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-fuchsia-500/30 selection:text-fuchsia-200">
      {/* Mesh glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-2/3 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Main dashboard content container */}
      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 space-y-8 z-10">
        
        {/* Navigation Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-900 pb-6 gap-4 border-t-4 border-t-fuchsia-500 pt-4 rounded-t-xl">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-all"
            >
              ← Portal Gateway
            </Link>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-violet-500 flex items-center justify-center text-slate-950 shadow-lg shadow-fuchsia-500/10">
              <Radio className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black font-sans uppercase tracking-tight text-white">Italian Political Watch</h1>
                <span className="text-[9px] font-mono tracking-widest bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 px-2 py-0.5 rounded-md uppercase font-bold">Roma Tracker</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">National Legislative movements, official committee votes, and policy aggregations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse shadow-[0_0_8px_#d946ef]" />
              <span className="text-[10px] font-mono font-bold text-slate-300">ROLLING DB: 60-Day Active Archive</span>
            </div>
            <button
              onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-950 bg-fuchsia-400 hover:bg-fuchsia-350 transition-all px-4 py-2.5 rounded-xl shadow-lg shadow-fuchsia-400/10 active:scale-95 cursor-pointer"
            >
              Simulation Deck <Sparkles className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>

        {/* Ingestion Simulator Drawer Panel */}
        {isSimulatorOpen && (
          <div className="bg-slate-900/60 border border-fuchsia-500/20 rounded-2xl p-6 backdrop-blur-md space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-fuchsia-400 flex items-center gap-2">
                <Database className="w-4 h-4" /> Live Ingestion Pipeline Simulator
              </h3>
              <button 
                onClick={() => setIsSimulatorOpen(false)}
                className="text-xs text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inject custom political events directly into the rolling database to test timeline updates and real-time transition physics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => handleSimulateIngestion("camera-vote")}
                disabled={simulationLoading}
                className="p-4 bg-slate-950 border border-slate-800 hover:border-fuchsia-500/40 rounded-xl text-left space-y-2 group transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Preset: Chamber Committee</span>
                  <PlusCircle className="w-4 h-4 text-fuchsia-400 group-hover:scale-110 transition-all" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">Ingest Committee Vote (Renewables)</h4>
                <p className="text-[10px] text-slate-500">Simulates legislative voting in Rome committee sessions.</p>
              </button>
              <button
                onClick={() => handleSimulateIngestion("news-data")}
                disabled={simulationLoading}
                className="p-4 bg-slate-950 border border-slate-800 hover:border-fuchsia-500/40 rounded-xl text-left space-y-2 group transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Preset: NewsData.io Aggregator</span>
                  <PlusCircle className="w-4 h-4 text-fuchsia-400 group-hover:scale-110 transition-all" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">Ingest Breaking Energy Policy Decrees</h4>
                <p className="text-[10px] text-slate-500">Simulates real-time Italian media coverage of cabinet decrees.</p>
              </button>
            </div>
          </div>
        )}

        {simulationSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Real-time Ingestion Successful! Event added at the top of the feed log.</span>
            <span className="text-[9px] font-mono">200 OK</span>
          </div>
        )}

        {/* Dashboard 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* COLUMN 1: FILTERS (1/4) */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 space-y-6 backdrop-blur-md h-fit">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-fuchsia-400" /> Filters
              </h3>
              {(search || sourceType || category || party || days !== 60) && (
                <button
                  onClick={handleResetFilters}
                  className="text-[10px] text-fuchsia-400 hover:text-fuchsia-350 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            {/* Keyword Search */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Search Keywords</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Query politicians, acts, tags..."
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Source Type Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Source Stream</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSourceType(sourceType === "Official" ? "" : "Official")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${sourceType === "Official" ? "bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-300" : "bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-250"}`}
                >
                  Official Gov
                </button>
                <button
                  onClick={() => setSourceType(sourceType === "News" ? "" : "News")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${sourceType === "News" ? "bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-300" : "bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-250"}`}
                >
                  News Media
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Legislative Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl py-2 px-3 text-xs text-slate-350 focus:outline-none focus:border-fuchsia-500 cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="Floor Vote">Floor Vote</option>
                <option value="Committee Meeting">Committee Meeting</option>
                <option value="Political Statement">Political Statement</option>
                <option value="Corporate Regulation">Corporate Regulation</option>
                <option value="Legislative Act">Legislative Act</option>
              </select>
            </div>

            {/* Italian Party Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Key Party Involved</label>
              <div className="grid grid-cols-3 gap-1.5">
                {["FdI", "PD", "M5S", "Lega", "FI", "Other"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setParty(party === p ? "" : p)}
                    className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer uppercase ${party === p ? "bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-400" : "bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-350"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Window Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                <span>Archive Depth</span>
                <span className="font-mono text-fuchsia-400 font-bold">{days} Days</span>
              </div>
              <input
                type="range"
                min="7"
                max="60"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
              />
              <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                <span>7 days</span>
                <span>30 days</span>
                <span>60 days</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2 & 3: LIVE STREAM TIMELINE (2/4) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4.5 h-4.5 text-fuchsia-400" /> Rolling Policy Stream ({events.length})
              </h3>
              <span className="text-[10px] font-mono text-slate-500">Ordered: Latest First</span>
            </div>

            {loading ? (
              <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <Radio className="w-8 h-8 text-fuchsia-400 animate-spin" />
                <span className="text-xs text-slate-400">Syncing Rome legislative feeds...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="bg-slate-900/10 border border-dashed border-slate-900 rounded-3xl p-12 text-center text-slate-500 italic text-xs">
                No active events matching filter criteria in the current {days}-day archive.
              </div>
            ) : (
              <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
                {events.map((evt) => {
                  const isSelected = selectedEvent?.id === evt.id;
                  const eventDate = new Date(evt.date).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  });

                  return (
                    <button
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`w-full text-left p-5 bg-slate-950 border rounded-2xl space-y-3 transition-all hover:border-slate-800 cursor-pointer duration-200 ${isSelected ? "border-fuchsia-500/50 bg-slate-900/40 shadow-[0_0_15px_rgba(217,70,239,0.06)] scale-[1.01]" : "border-slate-900 hover:border-slate-850"}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            {evt.sourceName}
                          </span>
                          <span className="text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-350">
                            {evt.category}
                          </span>
                        </div>
                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${evt.impactLevel === "High" ? "bg-red-500/10 border-red-500/20 text-red-400" : evt.impactLevel === "Medium" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
                          {evt.impactLevel} Impact
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-200 leading-snug group-hover:text-fuchsia-400 transition-colors">
                        {evt.title}
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-600" /> {eventDate}
                        </span>
                        <span className="flex gap-1">
                          {evt.tags.slice(0, 2).map((t, idx) => (
                            <span key={idx} className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 border border-slate-850">#{t}</span>
                          ))}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUMN 4: DEEP EXTRACTION PANEL (1/4) */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-md h-fit">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-fuchsia-400 animate-pulse" /> AI Extraction & Risks
              </h3>
              <p className="text-[10px] text-slate-500">Corporate briefing overview & policy analysis</p>
            </div>

            {selectedEvent ? (
              <div className="space-y-6">
                
                {/* Event Title Block */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    {selectedEvent.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 leading-snug">
                    {selectedEvent.title}
                  </h4>
                </div>

                {/* Abstract Text */}
                <div className="space-y-2">
                  <h5 className="text-[9px] font-mono font-bold text-fuchsia-400 uppercase tracking-wider">Abstract</h5>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedEvent.content}
                  </p>
                </div>

                {/* Lobbying Impact & Risk Analysis */}
                <div className="space-y-2 border-t border-slate-900 pt-4">
                  <h5 className="text-[9px] font-mono font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" /> Liaison Risk Assessment
                  </h5>
                  <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-400 leading-relaxed space-y-1">
                    <p>
                      {selectedEvent.impactLevel === "High" 
                        ? "🚨 CRITICAL THREAT: Immediately assess portfolio impacts. This decree fast-tracks connections but alters local regional tariffs, potentially destabilizing grid-connected margins."
                        : selectedEvent.impactLevel === "Medium"
                        ? "⚠️ MEDIUM ALERT: Monitor policy progression. Active advocacy required in committee levels to ensure protection clauses for large utility storage corridors."
                        : "ℹ️ LOW ADVISORY: System status nominal. Track personnel shuffling for commission coordinator roles to capture changing sentiments early."}
                    </p>
                  </div>
                </div>

                {/* Extracted Entities Table */}
                {selectedEvent.entities?.length > 0 && (
                  <div className="space-y-2 border-t border-slate-900 pt-4">
                    <h5 className="text-[9px] font-mono font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-fuchsia-400" /> Extracted Actors
                    </h5>
                    <div className="space-y-2">
                      {selectedEvent.entities.map((ent, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
                          <div>
                            <div className="text-xs font-bold text-slate-200">{ent.name}</div>
                            <div className="text-[9px] text-slate-500">{ent.role}</div>
                          </div>
                          <span className={`text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded border ${ent.party === "FdI" ? "bg-red-500/10 border-red-500/20 text-red-400" : ent.party === "PD" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : ent.party === "M5S" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : ent.party === "Lega" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"}`}>
                            {ent.party}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outbound Link */}
                <div className="border-t border-slate-900 pt-4">
                  <a
                    href={selectedEvent.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-[0.98]"
                  >
                    View Original SPARQL RDF <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>

              </div>
            ) : (
              <div className="p-8 bg-slate-950/30 border border-dashed border-slate-900 rounded-xl text-center text-xs text-slate-500 italic">
                Select any timeline event to view deep legislative analytics and lobbying risks.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify the page matches current styling**

Ensure Outfit fonts are inherited from global layout, standard responsive container spacing rules are active, and no placeholders exist.

---

### Task 3: Integrate Italian Tracker Card into gateway portal home page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Check existing page content & identify card location**

Locate lines 87-97 where Enel Public Affairs card is placed and the wrapper closing divs start. We will insert the third card in `app/page.tsx` immediately after Card 2, modifying the grid layout to support three elements on large screens.

- [ ] **Step 2: Modify grid template classes in `app/page.tsx`**

Replace:
```tsx
        {/* Dual Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
```
with:
```tsx
        {/* Workspace Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
```

- [ ] **Step 3: Insert Card 3 element code inside `app/page.tsx`**

Insert the following code immediately below Card 2:

```tsx
          {/* Card 3: Italian Political Event Tracker */}
          <div className="group bg-slate-900/20 border border-slate-900 border-t-4 border-t-fuchsia-500 hover:border-fuchsia-500/40 rounded-3xl p-8 flex flex-col justify-between gap-8 backdrop-blur-md transition-all duration-350 hover:shadow-[0_0_50px_-12px_rgba(217,70,239,0.15)] relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full pointer-events-none">
              [Civic Watch Portal]
            </div>

            <div className="space-y-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 shrink-0 shadow-lg shadow-fuchsia-500/5">
                <Radio className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Italian Policy Watch <span className="text-[10px] font-mono tracking-wider bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 px-2 py-0.5 rounded-full">Roma Live Tracker</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Monitor Italian legislative acts, Senate and Chamber votes, Openpolis public figures movement logs, and Italian political news aggregates on a rolling 60-day watch timeline.
              </p>
            </div>

            <Link 
              href="/politics-tracker"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-all active:scale-[0.98] group-hover:border-fuchsia-500/30"
            >
              Enter Italian Tracker <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
```

---

### Task 4: Complete Web Verification Plan

**Files:**
- None

- [ ] **Step 1: Execute Next.js build compilation**

Run a local production build check:
Run: `npm run build`
Expected: Passes with zero compilation, styling, or type errors.

- [ ] **Step 2: Test live search filter state integration**

Open the dashboard `/politics-tracker` and:
- Verify that filtering by "Lega" narrows down the timeline list items.
- Verify that selecting individual items from the timeline immediately updates the AI deep watch panel details.

- [ ] **Step 3: Test live event simulation ingestion**

Open the simulation deck and click "Ingest Committee Vote (Renewables)".
Verify that the success message appears and the newly created event appears dynamically at the top of the timeline feed in real-time.
