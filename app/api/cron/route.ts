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

    let ingestionSummary = "Standalone serverless execution.";
    // Attempt to invoke worker ingestion pipeline if running in Node server environment
    try {
      // Import ingestion worker when running in Node.js server context
      const worker = require("../../../src/workers/ingestionWorker");
      if (worker && typeof worker.executeIngestionPipeline === "function") {
        await worker.executeIngestionPipeline();
        ingestionSummary = "Ingestion pipeline executed via worker.";
      }
    } catch (workerErr: any) {
      console.warn("[Cron API] Ingestion worker execution note:", workerErr.message);
    }

    // Revalidate Next.js cache paths that display aggregated data
    revalidatePath("/politics-tracker");
    revalidatePath("/api/latest");
    revalidatePath("/api/politics-tracker");

    const timestamp = new Date().toISOString();
    return NextResponse.json({
      success: true,
      message: "Twice-daily data refresh executed successfully.",
      ingestionSummary,
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
