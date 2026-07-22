# Twice-Daily Data Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the web application twice a day (every 12 hours, at 00:00 and 12:00) automatically refreshes all its data feeds and cache states across both Express worker and Next.js environments.

**Architecture:** 
Update `node-cron` in `src/workers/ingestionWorker.js` to `0 0,12 * * *`, introduce a new Next.js cron API route at `app/api/cron/route.ts`, configure `vercel.json` for Vercel Cron at `0 0,12 * * *`, adjust SPARQL query revalidation in `app/api/latest/route.ts` to 43,200 seconds (12 hours), and add a manual sync trigger and status indicator in `app/politics-tracker/page.tsx`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Express, node-cron, Prisma.

---

### Task 1: Update Ingestion Worker Cron Schedule

**Files:**
- Modify: `src/workers/ingestionWorker.js:174-180`

- [ ] **Step 1: Inspect `src/workers/ingestionWorker.js` cron expression**

Verify that line 176 contains `cron.schedule("0 */4 * * *", ...)` and update it to `cron.schedule("0 0,12 * * *", ...)`.

- [ ] **Step 2: Update `startIngestionScheduler` in `src/workers/ingestionWorker.js`**

```javascript
function startIngestionScheduler() {
  console.log("[Scheduler] Initializing node-cron ingestion worker (Interval: Twice Daily at 00:00 & 12:00)...");
  cron.schedule("0 0,12 * * *", async () => {
    console.log("[Scheduler] Running twice-daily ingestion job...");
    await executeIngestionPipeline();
  });
}
```

- [ ] **Step 3: Run quick syntax check on `src/workers/ingestionWorker.js`**

Run: `node -c src/workers/ingestionWorker.js`
Expected: Clean exit with zero errors.

- [ ] **Step 4: Commit change**

```bash
git add src/workers/ingestionWorker.js
git commit -m "feat: update ingestion worker cron schedule to twice daily"
```

---

### Task 2: Create Next.js Cron API Route

**Files:**
- Create: `app/api/cron/route.ts`

- [ ] **Step 1: Create `app/api/cron/route.ts`**

Create the Next.js API route handling `GET` and `POST` requests to execute data refresh and trigger revalidation.

```typescript
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    const secret = searchParams.get("secret");

    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}` && secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
    }

    // Attempt to invoke worker ingestion pipeline if running in Node context
    try {
      // Dynamic import to support both standalone express & Next.js serverless execution
      const worker = require("@/src/workers/ingestionWorker");
      if (worker && typeof worker.executeIngestionPipeline === "function") {
        await worker.executeIngestionPipeline();
      }
    } catch (workerErr: any) {
      console.warn("[Cron API] Ingestion worker execution skipped or standalone:", workerErr.message);
    }

    // Revalidate paths that display aggregated data
    revalidatePath("/politics-tracker");
    revalidatePath("/api/latest");
    revalidatePath("/api/politics-tracker");

    const timestamp = new Date().toISOString();
    return NextResponse.json({
      success: true,
      message: "Twice-daily data refresh executed successfully.",
      timestamp,
      schedule: "0 0,12 * * *"
    });
  } catch (error: any) {
    console.error("[Cron API] Refresh execution error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute data refresh." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
```

- [ ] **Step 2: Verify `app/api/cron/route.ts` syntax**

Run: `npx tsc --noEmit`
Expected: No type errors reported in `app/api/cron/route.ts`.

- [ ] **Step 3: Commit `app/api/cron/route.ts`**

```bash
git add app/api/cron/route.ts
git commit -m "feat: add Next.js /api/cron endpoint for twice-daily data refresh"
```

---

### Task 3: Add Vercel Cron Configuration

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create `vercel.json`**

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

- [ ] **Step 2: Validate JSON formatting**

Run: `node -e "JSON.parse(fs.readFileSync('vercel.json'))"`
Expected: Clean exit without JSON parse errors.

- [ ] **Step 3: Commit `vercel.json`**

```bash
git add vercel.json
git commit -m "config: add Vercel cron schedule for twice-daily data refresh"
```

---

### Task 4: Update EUR-Lex SPARQL Route Revalidation Cache

**Files:**
- Modify: `app/api/latest/route.ts:64`

- [ ] **Step 1: Modify cache revalidation interval in `app/api/latest/route.ts`**

Update `revalidate: 1800` (30 minutes) to `revalidate: 43200` (12 hours).

```typescript
    const response = await fetch(url, {
      headers: { 'Accept': 'application/sparql-results+json' },
      next: { revalidate: 43200 } // Cache for 12 hours (Twice Daily)
    });
```

- [ ] **Step 2: Commit change**

```bash
git add app/api/latest/route.ts
git commit -m "perf: align EUR-Lex SPARQL route cache revalidation with twice-daily cycle"
```

---

### Task 5: Add Last Refreshed Banner & Manual Refresh Trigger to Dashboard

**Files:**
- Modify: `app/politics-tracker/page.tsx`

- [ ] **Step 1: Add state for `lastRefreshed` timestamp and `isSyncing` status**

Update `app/politics-tracker/page.tsx` to display a "Last Refreshed" indicator, show a twice-daily sync badge ("Refreshed 2x/day"), and add a manual "Sync Live Data" button that calls `/api/cron`.

- [ ] **Step 2: Verify UI component builds without errors**

Run: `npm run build`
Expected: Successful Next.js build.

- [ ] **Step 3: Commit UI updates**

```bash
git add app/politics-tracker/page.tsx
git commit -m "feat: add twice-daily refresh banner and manual trigger to politics tracker UI"
```

---

### Task 6: End-to-End Verification

- [ ] **Step 1: Execute production build**

Run: `npm run build`
Expected: Build passes with `/api/cron` route listed as dynamic.

- [ ] **Step 2: Test `/api/cron` API response locally**

Run dev server or node test to verify `/api/cron` returns `success: true` and `schedule: "0 0,12 * * *"`.
