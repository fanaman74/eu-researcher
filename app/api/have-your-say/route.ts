// Live data: European Commission "Have Your Say" (Better Regulation API). See lib/haveYourSay.ts.
import { NextResponse } from "next/server";
import { listConsultations, getConsultation } from "@/lib/haveYourSay";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pid = searchParams.get("pid") || "";
    const fetchedAt = new Date().toISOString();

    if (pid) {
      const consultation = await getConsultation(pid);
      return NextResponse.json({ consultation, source: "European Commission — Have Your Say", fetchedAt });
    }

    const consultations = await listConsultations();
    return NextResponse.json({ consultations, source: "European Commission — Have Your Say", fetchedAt });
  } catch (error: any) {
    console.error("Have Your Say Route Error:", error);
    return NextResponse.json({ error: "Failed to retrieve Have Your Say feed." }, { status: 502 });
  }
}
