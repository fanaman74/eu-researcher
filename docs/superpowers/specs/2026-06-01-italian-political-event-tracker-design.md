# Design Specification: Italian Political Event Tracker (Next.js & Web APIs)

This document details the architecture, data models, and user interface specifications for building the **Italian Political Event Tracker** within the Next.js intelligence application workspace.

---

## 1. Goal & Requirements
- **Target Audience**: A corporate liaison public affairs officer monitoring legislative, regulatory, and civic tech movements in Italy.
- **Data Ingestion**: High-fidelity local Next.js `/api/politics-tracker` API simulating Dati Camera/Senato, Openpolis, NewsData.io, and Event Registry payloads.
- **Search & Retention**: Dynamic search indexing, 60-day historical rolling retention, and filters by source category (Official vs News), date, political entity, and impact levels.
- **Real-Time Simulation**: A live simulation control deck to trigger instantaneous political event ingestions.
- **Cyberpunk Dark Theme**: A visually spectacular dashboard with Fuchsia & Violet gradients and floating glassmorphic badges.

---

## 2. API Architecture & Data Definitions

We will design a local serverless API route in Next.js App Router format.

### File: `app/api/politics-tracker/route.ts`

#### Data Structure (`PoliticalEvent`)
```typescript
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
```

#### In-Memory DB Core
The backend maintains a localized, in-memory array containing a comprehensive list of realistic, high-fidelity historical events mapped within a 60-day rolling window. 
- **`GET` Endpoint**: Filters the collection based on `q` (text matching), `sourceType`, `category`, `days` (rolling limit), and `party`.
- **`POST` Endpoint**: Normalizes and appends a newly simulated event to the front of the in-memory array. Older events are automatically pruned if they slip outside the 60-day threshold.

---

## 3. UI/UX Interface Structure

### File: `app/politics-tracker/page.tsx`

The layout utilizes a fully responsive, three-column dark layout with beautiful micro-animations and glowing fuchsia borders.

```
+-----------------------------------------------------------------------------------+
|                                 TELEMETRY HEADER                                  |
|   <- Portal Gateway   |   Active Pipeline: Stable   |   Archive Count: 48 Events   |
+-----------------------+---------------------------------------+-------------------+
|                       |                                       |                   |
|   FILTERS SIDEBAR     |         LIVE STREAM TIMELINE          |    AI DEEP WATCH  |
|                       |                                       |                   |
|   - Search Input      |   +-------------------------------+   |   Event Abstract  |
|   - Source Type Pills |   | Dati Camera | HIGH IMPACT     |   |                   |
|   - Date Range Slider |   | Title of legislative act      |   |   Lobbying Risks  |
|   - Party Selectors   |   | [Dati Camera]  [2026-05-30]   |   |   & Mitigations   |
|                       |   +-------------------------------+   |                   |
|                       |   | NewsData.io | MED IMPACT      |   |   Extracted       |
|                       |   | Title of news event           |   |   Entities        |
|                       |   | [NewsData.io]  [2026-05-29]   |   |                   |
|                       |   +-------------------------------+   |   Outbound Link   |
|                       |                                       |                   |
+-----------------------+---------------------------------------+-------------------+
|                                                       [ Floating Simulator Deck ] |
+-----------------------------------------------------------------------------------+
```

### Components Matrix

1. **Dashboard Header & Telemetry**:
   - Outlined in a top-border fuchsia mesh glow (`border-t-4 border-t-fuchsia-500`).
   - Standard branding displaying `ITALIAN POLITICAL WATCH` with floating glass telemetry blocks demonstrating active database size and rolling window status.
   - Clickable back navigation `<- Portal Gateway` to return to the landing portal.

2. **Tactile Filters Column (Left)**:
   - Floating search text bar with responsive filtering.
   - Quick-select category buttons and checkbox selectors for official versus news data.
   - Italian Political Party filter pills (`FdI`, `PD`, `M5S`, `Lega`, `FI`) colored programmatically.
   - A range slider displaying exact date parameters up to 60 days.

3. **Event Timeline Column (Center)**:
   - Chronological vertical line containing slide-in card animations.
   - Hover magnification and custom box shadows (`shadow-fuchsia-500/10`).
   - Visual indicator tags for **Impact Level** (High, Medium, Low) and **Source types**.

4. **AI Deep Extraction Panel (Right)**:
   - Full detailed overview of selected events.
   - Highlights *Lobbying Risks & Corporate Implications* tailored for a corporate liaison officer monitoring Italian policy affairs.
   - Tabulated list of involved politicians, party allocations, and legislative roles.

5. **Dynamic Event Simulator Deck**:
   - Glassmorphic drawer allowing instant custom event injection.
   - Pre-designed scenarios for instant ingestion to see real-time UI transitions.

---

## 4. Gateway Portal Integration

### File: `app/page.tsx`

We will add a third premium workspace card on the portal landing screen:
- **Title**: `Italian Political Watch`
- **Sub-tag**: `Roma Policy & Civic Tracker`
- **Theme**: Fuchsia gradient highlight (`border-t-fuchsia-500 hover:shadow-[0_0_50px_-12px_rgba(217,70,239,0.15)]`)
- **Icon**: `Compass` or `Radio` signaling live civic streaming.
- **Description**: "Monitor Italian legislative acts, Chamber/Senate votes, Openpolis entity tracking, and aggregate real-time political news streams in a rolling 60-day watch timeline."

---

## 5. Verification Plan

- **Compilation Validation**: Perform a complete Next.js compilation check (`npm run build`) to ensure all TypeScript typings and route bindings compile successfully.
- **State Flow Test**: Verify that filters correctly toggle the timeline results instantly.
- **Simulation Validation**: Execute dynamic simulation injections to guarantee new events append gracefully to the top of the feed list.
