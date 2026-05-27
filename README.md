# 🇪🇺 European Union Intelligence Portals (EU-Researcher)

> An Advanced EU Legal AI Gateway built to bridge citizens, advocates, and corporate public affairs professionals with live, semantic-level insights directly from the official European Union's databases.

---

## 🏛️ Project Architecture Overview

EU-Researcher is a next-generation Next.js 15 web application designed to act as a **multi-tenant intelligence portal**. It provides targeted workspaces leveraging **live SPARQL query engines**, **RESTful web services**, and **generative AI models** (specifically `Gemini 3.5 Flash` via OpenRouter) to deliver unprecedented clarity on EU legal, regulatory, and parliamentary processes.

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
               |           (Gemini 3.5 Flash Model)             |
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
* **European Parliament Watch**: Track live parliamentary written questions, MEP sponsors, target committees (ITRE, ENVI, ECON), and risk assessments mapping straight to asset portfolios (e.g., Sicily smart grids, Catania 3SUN gigafactories).
* **DG COMP & ENER Tracker**: Direct dashboard oversight of state-aid cases and **Comitology votes** (smart grid allocations, safety standards).
* **"Have Your Say" Dashboard**: Monitor EU public consultations, mapping stakeholder demographics, attachment position papers (eurelectric, EEB, Greenpeace), and sentiment trends (Supportive/Neutral/Hostile).
* **Advocacy Brief Generator**: Transform complex legislative acts and voting charts into formatted corporate briefs.

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
* Configured using `OpenRouter` to interface with the cutting-edge `google/gemini-3.5-flash` model.
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
