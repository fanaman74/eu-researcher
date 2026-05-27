# Multi-Page Split & Sector-Specific Live Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route the "Access Research Console" button (renamed to "Advanced AI Research") to a dedicated `/research` sub-page housing the full AI Query interface, and replace the homepage query terminal with a dynamic top-5 live feed of latest documents matching the clicked sector category bubble.

**Architecture:** 
1. Refactor `app/api/latest/route.ts` to accept a `namespace` query parameter and perform sector prefix queries (`FILTER(STRSTARTS(?celex, "<prefix>"))`) with a `LIMIT 10`.
2. Move the Search & Chat area, Summariser modal, message history states, and search controllers from `app/page.tsx` to a new React client page `/app/research/page.tsx`.
3. Clean `app/page.tsx` to show only the Geodata Europe Map, the "Advanced AI Research" button, the sector bubbles row, and the top 5 latest matching cards in a responsive grid.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS v4, SPARQL.

---

### Task 1: Refactor Latest API (`app/api/latest/route.ts`)

**Files:**
- Modify: `app/api/latest/route.ts` (accept `namespace` parameter, dynamically build SPARQL query, return up to 10 matching docs)

- [ ] **Step 1: Read search parameters and map namespaces to CELEX prefixes**
  
  Read the request URL's query parameters and map namespaces:
  ```typescript
  import { NextRequest, NextResponse } from "next/server";

  export const dynamic = "force-dynamic";

  const PREFIX_MAP: Record<string, string> = {
    consolidated: "0",
    international: "1",
    agreements: "2",
    statutes: "3",
    complementary: "4",
    regulatory: "5",
    case_law: "6",
    transposition: "7",
    national_case_law: "8",
    parliamentary: "9"
  };

  const SECTOR_NAMES: Record<string, string> = {
    consolidated: "Consolidated Texts",
    international: "Primary Law & Treaties",
    agreements: "International Agreements",
    statutes: "Secondary Legislation",
    complementary: "Complementary Legislation",
    regulatory: "Preparatory Documents",
    case_law: "Case Law",
    transposition: "National Transposition",
    national_case_law: "National Case-Law",
    parliamentary: "Parliamentary Questions"
  };
  ```

- [ ] **Step 2: Update route handler function signature and build query**
  
  Modify the `GET` function to accept `request: NextRequest` and execute the SPARQL query with `LIMIT 10`:
  ```typescript
  export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const namespace = searchParams.get("namespace") || "case_law";
    const sectorPrefix = PREFIX_MAP[namespace] || "6";
    const sectorLabel = SECTOR_NAMES[namespace] || "Case Law";

    const currentYear = new Date().getFullYear();
    const dateLimit = `${currentYear - 2}-01-01`; // wider range for sparser sectors

    const sparqlQuery = `
      PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>

      SELECT DISTINCT ?work ?celex ?title ?date
      WHERE {
        ?work cdm:resource_legal_id_celex ?celex .
        ?expr cdm:expression_belongs_to_work ?work .
        ?expr cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> .
        ?expr cdm:expression_title ?title .
        ?work cdm:work_date_document ?date .
        FILTER(STRSTARTS(?celex, "${sectorPrefix}"))
        FILTER(?date >= "${dateLimit}"^^<http://www.w3.org/2001/XMLSchema#date>)
      }
      ORDER BY DESC(?date)
      LIMIT 10
    `;
    ...
  ```

- [ ] **Step 3: Verify compiling and build**
  
  Run: `npm run build`
  Expected: Success without errors.

---

### Task 2: Create Dedicated Research Workspace (`app/research/page.tsx`)

**Files:**
- Create: `app/research/page.tsx` (holds the Interactive Search Console, status card, presets, query forms, and summary modal)

- [ ] **Step 1: Write full Interactive Query console into `/app/research/page.tsx`**
  
  Create the folder `app/research` and write a fully featured React component representing the AI research console (similar to the Section 2 & Section 3 logic we crafted in `app/page.tsx`). It will include a simple "Back to Home" navigation header to easily route back.

- [ ] **Step 2: Verify compiling and build**
  
  Run: `npm run build`
  Expected: Success.

---

### Task 3: Clean Homepage & Load Sector-Specific Cards (`app/page.tsx`)

**Files:**
- Modify: `app/page.tsx` (rename button, display sector bubbles, load top 5 latest matching cards dynamically in grid, remove search terminal)

- [ ] **Step 1: Link "Advanced AI Research" button to `/research`**
  
  Update the button text from `Access Research Console` to `Advanced AI Research` and wrap it in a Next.js `Link` component or update `onClick` routing to `/research`.

- [ ] **Step 2: Integrate dynamic sector-based fetching**
  
  Introduce a `useEffect` hooked to changes in the `namespace` category bubble selection:
  ```typescript
  useEffect(() => {
    const fetchLatestDocs = async () => {
      setLoadingLatest(true);
      try {
        const res = await fetch(`/api/latest?namespace=${namespace}`);
        if (res.ok) {
          const data = await res.json();
          if (data.documents && data.documents.length > 0) {
            setLatestDocs(data.documents);
          }
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoadingLatest(false);
      }
    };
    fetchLatestDocs();
  }, [namespace]);
  ```

- [ ] **Step 3: Replace the entire query terminal with 5 cards grid**
  
  Strip out all redundant chat states, logs, accordion event tables, range sliders, and prompt input forms from the home page `app/page.tsx`, and place a responsive grid displaying the first 5 records of `latestDocs` (with full summary modals working).

- [ ] **Step 4: Verify compiling, build, and routing**
  
  Run: `npm run build`
  Expected: Success.

---

### Task 4: Commit and Launch Dev Server

- [ ] **Step 1: Commit code updates**
  
  Commit all changes to local `master` branch.

- [ ] **Step 2: Restart Next.js dev server**
  
  Execute: `npx next dev -p 3001`
  Verify both homepage sector-specific loading and `/research` chat queries perform flawlessly.
