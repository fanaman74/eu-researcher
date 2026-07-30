// DEMO DATA: hardcoded mock — not connected to a live source.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COMITOLOGY_VOTES = [
  {
    id: "VOTE-2026-GRID",
    measure: "Technical Implementing Act on Harmonized European Smart-Grid Balancing Allocations",
    registerId: "RC/2026/041",
    date: "2026-05-12",
    chairperson: "DG ENER Directorate C",
    status: "Favourable Opinion (Approved)",
    votingSheet: {
      inFavour: 23, // Member states
      against: 3,
      abstentions: 1,
      countriesAgainst: ["Hungary", "Austria", "Slovakia"],
      countriesAbstaining: ["Bulgaria"]
    },
    strategicImpact: "Enel-supportive. The standardized smart-grid balancing act harmonizes energy dispatch rules across Northern and Southern grid connections, lowering cross-border arbitrage costs."
  },
  {
    id: "VOTE-2026-STORAGE",
    measure: "Delegated Regulation setting Safety Standards for Grid-Scale Battery Storage Systems (BESS)",
    registerId: "RC/2026/038",
    date: "2026-04-30",
    chairperson: "Joint Research Centre / DG ENER",
    status: "Favourable Opinion (Approved)",
    votingSheet: {
      inFavour: 25,
      against: 1,
      abstentions: 1,
      countriesAgainst: ["Poland"],
      countriesAbstaining: ["Germany"]
    },
    strategicImpact: "Highly relevant. Establishes a uniform safety standard for Enel's massive multi-megawatt BESS deployments in Italy and Spain. Eliminates local member-state fragmentation."
  }
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "";

    if (id) {
      const vote = COMITOLOGY_VOTES.find(item => item.id === id);
      return NextResponse.json({ vote: vote || null, demo: true });
    }

    return NextResponse.json({ votes: COMITOLOGY_VOTES, demo: true });
  } catch (error: any) {
    console.error("Comitology Route Error:", error);
    return NextResponse.json({ error: "Failed to retrieve comitology votes.", demo: true }, { status: 500 });
  }
}
