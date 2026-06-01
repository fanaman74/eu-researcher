# Prompt Instruction: Italian Political Event Tracker Web App

## 1. Project Context & Objective
You are acting as an expert Full-Stack Developer and Copilot Architect. I need you to help me build a web application designed for a corporate liaison officer monitoring Italian political affairs. The app must aggregate, store, and display real-time political events and maintain a searchable 60-day historical archive. 

## 2. Technology Stack
Please architect the solution using the following stack:
* **Data Ingestion & Automation:** Power Automate (Scheduled cloud flows)
* **Database/Backend:** Microsoft Dataverse (or SharePoint Lists as a fallback)
* **Frontend:** React (deployed as a standalone web app or integrated via Power Apps Component Framework - PCF)

## 3. Data Sources (APIs)
The app must ingest data from two primary categories of external APIs. Implement polling mechanisms for:

### A. Official Government & Civic Tech
* **Dati Camera & Senato:** Use the SPARQL endpoints to pull recent legislative acts, committee meetings, and floor votes.
* **Openpolis / OpenSanctions:** Track specific political figures, entity movements, and voting records.

### B. News & Event Aggregation
* **NewsData.io:** Fetch Italian political news (`country=it`, `category=politics`).
* **Event Registry (NewsAPI.ai):** Group related news articles into consolidated political events to reduce noise.

*(Note: Enterprise intelligence feeds like Politico Pro or DeHavilland are strictly out of scope for this build.)*

## 4. Backend & Automation Requirements (Power Automate)
Please generate the required JSON schemas and Power Automate expressions to:
1.  **Poll APIs** on a scheduled basis (e.g., every 4 hours).
2.  **Transform and Normalize** the payloads from the different sources into a unified `PoliticalEvent` object.
3.  **Upsert** the records into the Dataverse tables/SharePoint lists.
4.  **Data Retention:** Implement a scheduled flow to automatically archive or purge records older than 60 days to maintain the rolling historical window.

## 5. Database Schema
Design the Dataverse tables or SharePoint lists. At a minimum, define schemas for:
* `Events` (Title, Description, Date, Source, URL, Category)
* `Entities/Politicians` (Name, Party, Role)
* `Tags` (Keywords for easy filtering)

## 6. Frontend UI/UX (React)
Generate the React component code (using functional components, hooks, and modern UI libraries) for:
* **Main Dashboard:** A clean, chronologically ordered timeline view of events.
* **Filtering System:** Controls to filter by date range (up to 60 days), source (Official vs. News), and political entity.
* **Detail View:** A modal or expandable row showing the full event description, entity extraction, and outbound links to original sources.

## 7. Execution Steps for the AI
Please provide the implementation guide in the following exact order:
1.  Dataverse/SharePoint table definitions and column types.
2.  Power Automate flow structure, trigger definitions, and data transformation formulas.
3.  React setup (package.json dependencies) and core API fetching hooks.
4.  React UI components (Timeline, Filters, Detail View).
