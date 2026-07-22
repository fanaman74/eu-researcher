# Twice-Daily Data Refresh Architecture Specification

## 1. Executive Summary
This design specification defines the architecture for ensuring that all webapp data feeds across the **EU-Researcher Platform** automatically refresh **twice a day (every 12 hours, at 00:00 and 12:00 UTC)**. The system supports both persistent Express server environments (`node-cron`) and Vercel/serverless environments (`Vercel Cron` + Next.js revalidation).

---

## 2. Target Architecture

```
                                  [Schedule: Twice Daily (00:00 & 12:00)]
                                                  |
                        +-------------------------+-------------------------+
                        |                                                   |
                        v                                                   v
           +--------------------------+                         +--------------------------+
           | Node-Cron Ingestion Task |                         |  Vercel Cron / External  |
           | (src/workers/ingestion)  |                         |  GET/POST /api/cron      |
           +------------+-------------+                         +------------+-------------+
                        |                                                   |
                        +-------------------------+-------------------------+
                                                  |
                                                  v
                                    +---------------------------+
                                    | executeIngestionPipeline  |
                                    +-------------+-------------+
                                                  |
                         +------------------------+------------------------+
                         |                        |                        |
                         v                        v                        v
                +-----------------+      +------------------+     +------------------+
                |  NewsData.io    |      | Dati Camera/     |     |   EUR-Lex SPARQL |
                |  Political News |      | Senato SPARQL    |     |   Cellar Cache   |
                +--------+--------+      +--------+---------+     +--------+---------+
                         |                        |                        |
                         +------------------------+------------------------+
                                                  |
                                                  v
                                   +----------------------------+
                                   | Prisma Database / Storage  |
                                   |   + 60-Day Auto Prune      |
                                   +----------------------------+
```

---

## 3. Detailed Component Modifications

### 3.1 Node.js Worker Cron (`src/workers/ingestionWorker.js`)
- **Current Schedule**: `0 */4 * * *` (Every 4 hours / 6x daily)
- **New Schedule**: `0 0,12 * * *` (Every 12 hours / twice daily at 00:00 and 12:00)
- **Functions**:
  - `executeIngestionPipeline()`: Ingests live news from `NewsData.io`, official RDF data from `Dati Camera`, and purges records older than 60 days.
  - `startIngestionScheduler()`: Starts the `node-cron` cron job with `0 0,12 * * *`.

### 3.2 Next.js Cron API Route (`app/api/cron/route.ts`)
- **Endpoint**: `GET /api/cron` and `POST /api/cron`
- **Security**: Verifies optional `Authorization: Bearer <CRON_SECRET>` or `CRON_SECRET` query parameter to prevent unauthorized public execution.
- **Action**:
  - Calls `executeIngestionPipeline()` to populate/update database records.
  - Returns JSON status detailing ingested count, timestamp, and success status.

### 3.3 Vercel Cron Configuration (`vercel.json`)
- Adds cron schedule definition:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron",
        "schedule": "0 0,12 * * *"
      }
    ]
  }
  ```

### 3.4 SPARQL & API Route Cache Revalidation (`app/api/latest/route.ts`)
- **Current Cache Time**: `revalidate: 1800` (30 minutes)
- **New Cache Time**: `revalidate: 43200` (12 hours / 43,200 seconds)
- Ensures SPARQL queries to EUR-Lex Cellar align with the twice-daily refresh rate.

### 3.5 UI Data Refresh Indicator & Manual Trigger (`components/` / `app/`)
- Adds a "Last Refreshed" timestamp display and a manual "Sync Live Data" trigger button in the main political tracker dashboard.
- Displays toast/banner notifying users when data was last synchronized.

---

## 4. Error Handling & Resiliency
- If an external API (e.g., NewsData.io or Dati Camera SPARQL) is temporarily unreachable during a scheduled run, the worker logs the error cleanly and continues running without crashing.
- Database records older than 60 days are automatically pruned via `pruneOldRecords()` at the end of each twice-daily cycle.

---

## 5. Verification & Testing Plan
1. **Cron Schedule Verification**: Verify `0 0,12 * * *` expression validity in `node-cron` and `vercel.json`.
2. **API Endpoint Verification**: Make test requests to `GET /api/cron` to verify execution output.
3. **Database State Verification**: Confirm database records updated and historical items older than 60 days pruned.
4. **Cache Revalidation Verification**: Confirm Next.js `revalidate: 43200` setting in `/api/latest/route.ts`.
