/**
 * Runs once when the Next.js server boots (production only; never blocks startup).
 *
 *  - Warms the slow upstream caches (Have Your Say, EP questions) so the first
 *    visitor after a deploy doesn't pay a 20–30s cold start.
 *  - Schedules the data refresh (ingestion + cache warm-up) at 00:00 and 12:00 UTC,
 *    plus one run shortly after boot so a fresh database fills immediately.
 *    Ingestion de-duplicates, so repeated or overlapping runs are harmless.
 *
 * /api/cron remains available for manual or external triggering.
 */

const BOOT_RUN_DELAY_MS = 60_000;

/** Milliseconds until the next 00:00 or 12:00 UTC. */
function msUntilNextRun(now: Date = new Date()): number {
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(now.getUTCHours() < 12 ? 12 : 24); // 24 rolls over to 00:00 next day
  return next.getTime() - now.getTime();
}

async function warmCaches() {
  const { listConsultations } = await import("./lib/haveYourSay");
  const { warmQuestions } = await import("./lib/epQuestions");
  await Promise.allSettled([
    listConsultations().catch((err) => console.warn("[Scheduler] Have Your Say warm-up failed:", err)),
    warmQuestions().catch((err) => console.warn("[Scheduler] EP questions warm-up failed:", err)),
  ]);
}

async function refreshAll() {
  try {
    const { runIngestion } = await import("./lib/ingestion");
    const result = await runIngestion();
    console.log("[Scheduler] Ingestion result:", JSON.stringify(result));
  } catch (err) {
    console.error("[Scheduler] Ingestion failed:", err);
  }
  await warmCaches();
}

function scheduleNext() {
  const timer = setTimeout(async () => {
    await refreshAll();
    scheduleNext();
  }, msUntilNextRun());
  timer.unref?.();
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;

  void warmCaches();

  if (process.env.DATABASE_URL) {
    const boot = setTimeout(() => void refreshAll(), BOOT_RUN_DELAY_MS);
    boot.unref?.();
  }
  scheduleNext();
  console.log("[Scheduler] Twice-daily refresh scheduled (00:00 and 12:00 UTC).");
}
