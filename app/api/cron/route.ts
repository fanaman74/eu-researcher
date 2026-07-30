import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CRON_SCHEDULE = "0 0,12 * * *";

async function handleCron(req: Request) {
  // Auth: Authorization: Bearer <CRON_SECRET> header only (no query-param secrets).
  // Fail closed: if CRON_SECRET is not configured the endpoint is disabled.
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    console.error("[Cron API] CRON_SECRET is not configured — cron endpoint is disabled.");
    return NextResponse.json(
      { error: "Cron endpoint is misconfigured (CRON_SECRET is not set)." },
      { status: 500 }
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  // Run the ingestion pipeline; never report success when it failed.
  let ingestion;
  try {
    const { runIngestion } = await import("@/lib/ingestion");
    ingestion = await runIngestion();
  } catch (error) {
    console.error("[Cron API] Ingestion pipeline failed:", error);
    return NextResponse.json({ error: "Data refresh failed." }, { status: 500 });
  }

  // Revalidate Next.js cache paths that display aggregated data
  revalidatePath("/politics-tracker");
  revalidatePath("/api/latest");
  revalidatePath("/api/politics-tracker");

  const timestamp = new Date().toISOString();

  if (ingestion.skipped) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: ingestion.reason,
      timestamp,
      schedule: CRON_SCHEDULE,
    });
  }

  return NextResponse.json({
    success: true,
    skipped: false,
    message: "Twice-daily data refresh executed successfully.",
    ingestion,
    timestamp,
    schedule: CRON_SCHEDULE,
  });
}

export async function GET(req: Request) {
  return handleCron(req);
}

export async function POST(req: Request) {
  return handleCron(req);
}
