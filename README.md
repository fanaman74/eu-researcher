# 🇪🇺 European Union Intelligence Portals (EU-Researcher)

> An Advanced EU Legal AI Gateway built to bridge citizens, advocates, and corporate public affairs professionals with live, semantic-level insights directly from the official European Union's databases.

---

## 🏛️ Project Architecture Overview

EU-Researcher is a next-generation Next.js 15 web application designed to act as a **multi-tenant intelligence portal**. It provides targeted workspaces leveraging **live SPARQL query engines**, **RESTful web services**, and **generative AI models** (specifically `DeepSeek v4 Flash` via OpenRouter) to deliver unprecedented clarity on EU legal, regulatory, and parliamentary processes.

```
                   +------------------------------+
                   |      Next.js 15 Web App      |
                   |   (React 19 & Tailwind v4)   |
                   +--------------+---------------+
                                  |
            +---------------------+---------------------+
            |                     |                     |
     [User Queries]       [API Requests]        [Case Summaries]
            v                     v                     v
   +--------+--------+   +--------+--------+   +--------+--------+
   |  /api/chat      |   |  /api/latest    |   |  /api/summarize |
   +--------+--------+   +--------+--------+   +--------+--------+
            |                     |                     |
            +----------+----------+                     |
                       |                                |
                       v (Live SPARQL)                  v (Full HTML Fetch)
       +---------------+---------------+        +-------+-------+
       |   EUR-Lex CELLAR Triplestore  |        |  CELLAR REST  |
       |  publications.europa.eu/rdf   |        |  Web Service  |
       +---------------+---------------+        +-------+-------+
                       |                                |
                       v (Search Hits)                  v (Raw Context)
               +-------+--------------------------------+-------+
               |           OpenRouter AI Gateway                |
               |           (DeepSeek v4 Flash Model)            |
               +-----------------------+------------------------+
                                       |
                                       v
                         [Refined Insights & Briefs]
```

---

## 🔮 Strategic Portals

The platform is split into two specialized strategic workspaces, routing users to distinct, high-fidelity interfaces based on their focus:

### 1. ⚖️ Legal Aid Hunter
*Designed for citizens, legal aid advocates, and researchers.*
* **Statutory Directives Search**: Browse and query the visual stream of the **10 legal sectors** (Treaties, Secondary Legislation, Case-Law, National Transpositions, etc.).
* **Live Case-Law Mapping**: Connect directly to official CELEX documents. Harassment and labor disputes automatically target high-precision cases from the **General Court (GCEU)** and the **Civil Service Tribunal (CST)**.
* **Semantic Clarifier**: Employs a specific disambiguation prompt that identifies broad/single-word searches (e.g., "dismissal"), requesting instant structured options while immediately resolving specific legal terminology queries.

### 2. ⚡ Enel Public Affairs Hub
*A premium corporate workspace tailored for the strategic advocacy and public affairs team of Enel in Brussels.*
* **European Parliament Watch**: Live written questions to the Commission (EP Open Data Portal) and plenary roll-call votes with political-group and Italian splits (HowTheyVote.eu).
* **State Aid Watcher**: State-aid judgments, orders and decisions from EUR-Lex (Cellar full-text search).
* **"Have Your Say" Dashboard**: Monitor EU public consultations, showing live response counts, who is responding (countries and organisation types) and published position papers.
* **Advocacy Brief Generator**: AI-drafted briefs (clearly labelled as AI-generated) from live feed items.

The hub is also organised the way an EU-affairs office works — by file, by date and by what changed:

| Page | What it shows | Source |
| --- | --- | --- |
| `/enel/digest` | What changed since yesterday (pipeline, watched files, announcements, peer meetings) and deadlines in the next 14 days; copy as text or export to Word. | Change feed (`lib/changeFeed.ts`, `lib/monitor.ts`) |
| `/enel/radar` | The Commission's energy pipeline: act type, stage, planned quarter, feedback periods. | Have Your Say |
| `/enel/dossiers` | Watched legislative files: stage, lead committee, rapporteur and shadows with groups, timeline, linked initiatives, MEP questions and votes. | EP Open Data, HowTheyVote.eu |
| `/enel/calendar` | Consultation deadlines, planned adoptions (on the quarter's last day) and plenary sittings, with `.ics` export for Outlook. | Have Your Say, EP Open Data |
| `/enel/peers` | Peer utilities' and associations' responses to a consultation, with full text and position-paper links. | Have Your Say |
| `/enel/meetings` | Commission cabinet and DG meetings since 1 December 2024, with a peer benchmark. | Commission transparency register exports |
| `/enel/mep-briefing` | One-page MEP record (committees, file roles, questions, energy votes) with Word and PowerPoint export. | EP Open Data, HowTheyVote.eu |
| `/enel/context` | Commission press announcements on energy (state aid flagged), Italian day-ahead prices and generation mix. | Press corner, Energy-Charts |

Hand-made mappings live in code: the dossier watchlist and its linking keywords in `lib/dossiers.ts`, the peer list in `lib/peers.ts`.
Not covered, because the sources refuse automated access or have no data service: the Council, ARERA and the energy ministry, Parliament committee meetings, and infringement decisions.

The change feed stores history in PostgreSQL (`TrackedItem`, `ChangeEvent`; applied by `prisma migrate deploy` on start). The first monitoring run after a deployment records a baseline without reporting it. Without a database, history is kept in memory until the server restarts.

> Only features backed by real data are included. Sections without a public data source (e.g. comitology votes) were removed rather than mocked.

---

## 🛠️ Key Technical Engines

### 1. The SPARQL RDF Engine (`/api/chat`, `/api/latest`)
Instead of utilizing standard cached scraping, the app implements direct semantic queries in **SPARQL** against the official European Union Cellar RDF database.
* **CDM Ontology**: Utilizes properties like `cdm:resource_legal_id_celex`, `cdm:expression_title`, and `cdm:work_date_document` to query and filter active legal records.
* **Precision-Fallback Flow**: First triggers a high-precision `AND` token filter across document titles, smoothly falling back to a broader `OR` filter if no direct exact phrase matches exist.

### 2. The Cellar REST Document Extractor (`/api/summarize`)
To ensure high-fidelity summarization without truncation errors:
* Retrieves the actual official full-text document from the EUR-Lex Cellar REST service via the CELEX ID: `https://publications.europa.eu/resource/celex/${celex}?language=ENG&format=HTML`.
* Strips nested HTML layouts, extracts the core document up to 16,000 characters, and feeds it into the LLM context.

### 3. The OpenAI-Structured LLM Gateway
* Configured using `OpenRouter` to interface with the cutting-edge `deepseek/deepseek-v4-flash` model.
* Implements robust **Function Calling** via `search_legal_data` tools.
* Automatically strips thinking traces, raw markdown schemas, and tags before returning responses to the UI.

---

## 📦 Technology Stack

* **Core Framework**: [Next.js 15](https://nextjs.org/) (App Router, Force-Dynamic API endpoints)
* **Runtime**: [React 19](https://react.dev/) (Release Candidate)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Frosted Glassmorphism, cybernetic dark palettes, HSL borders)
* **Icons**: [Lucide React](https://lucide.dev/)
* **API Gateway**: [OpenRouter API / OpenAI SDK](https://openrouter.ai/)

---

## 🚀 Getting Started

### 1. Prerequisites
You need Node.js installed on your machine. Create a `.env` file in the root directory and populate it with your OpenRouter credentials (this file is pre-configured and automatically ignored by Git):

```env
OPENROUTER_API_KEY=your_openrouter_api_key
LDH_API_KEY=your_optional_ldh_api_key
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the Advanced EU Legal AI Gateway.

### 4. Build for Production
```bash
npm run build
npm run start
```
`npm run build` runs `prisma generate` + `next build`; neither needs a live database — `DATABASE_URL` is only used at runtime (and by `prisma migrate` when applying migrations).

---

## ☁️ Deployment & Environment (Railway)

The app deploys to **Railway** (Nixpacks builder, `npm run build` → `npm run start`). Set these variables in the Railway project:

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | Yes | Powers all AI chat & summarization features. |
| `DATABASE_URL` | Recommended | PostgreSQL connection string (Prisma + pg adapter). Without it, the politics tracker uses in-memory storage and cron ingestion is skipped. Apply the schema with `npx prisma migrate deploy`. |
| `CRON_SECRET` | Yes | Bearer token protecting `/api/cron`. The endpoint refuses all requests while unset. |
| `INGEST_API_KEY` | Yes (prod) | Bearer token protecting `POST /api/politics-tracker` event ingestion. |
| `NEWS_API_KEY` | Optional | NewsData.io key enabling live Italian news ingestion (`NEWSDATA_API_KEY` also accepted). |

**Cron scheduling**: in production the server schedules its own refresh (ingestion, change monitoring, cache warm-up) at 00:00 and 12:00 UTC, plus one run a minute after boot (`lib/scheduler.ts`). For an external trigger as well, point a scheduler (Railway cron or e.g. cron-job.org) at `POST https://<your-app>/api/cron` on a `0 0,12 * * *` schedule with header `Authorization: Bearer <CRON_SECRET>`.
