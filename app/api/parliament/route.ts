// DEMO DATA: hardcoded mock — not connected to a live source.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const QUESTIONS_DB = [
  {
    id: "E-001205/2026",
    title: "Lobby inquiry regarding grid fee tariff exemptions for large renewable energy parks",
    askedBy: "MEP Paolo Borchia (ID)",
    date: "2026-05-10",
    committee: "ITRE (Industry, Research and Energy)",
    target: "European Commission / DG ENER",
    content: "Given Italy's recent transmission grid congestion and feed-in disruptions, will the Commission audit grid-tariff exemptions granted to multi-gigawatt utility operators in Sicily?",
    status: "Answer Pending",
    risk: "High Risk",
    riskRationale: "MEP Borchia represents ID group; grid exemptions in Sicily directly affect Enel Green Power's solar and wind assets tariff structure."
  },
  {
    id: "P-000843/2026",
    title: "Commission funding clearance for the 3SUN Solar Gigafactory in Catania under state aid exceptions",
    askedBy: "MEP Patrizia Toia (S&D)",
    date: "2026-05-02",
    committee: "ITRE / ECON",
    target: "European Commission / DG COMP",
    content: "Can the Commission clarify if the State aid exception clearance for Enel's 3SUN expansion is subject to strict sourcing requirements of silicon wafers exclusively within EFTA and EU borders?",
    status: "Answered",
    risk: "Low Risk",
    riskRationale: "MEP Toia is highly supportive of S&D green industrial plans; confirming wafer exception is standard technical clearance, ensuring zero disruption to Catania facility supply chain."
  },
  {
    id: "E-000941/2026",
    title: "ACER wholesale energy market intervention rules under REMIT review",
    askedBy: "MEP Christian Ehler (EPP)",
    date: "2026-04-28",
    committee: "ITRE",
    target: "European Commission / ACER",
    content: "How does ACER intend to balance the increased reporting burdens of trading desks with the transparency benefits expected under the updated REMIT regulation?",
    status: "Answered",
    risk: "Med Risk",
    riskRationale: "EPP seeks to minimize compliance paperwork for industrial groups; Enel's trading desk will benefit from EPP counter-lobbying efforts."
  },
  {
    id: "E-001429/2026",
    title: "Compliance timeline of RED III targets on distributed energy grids",
    askedBy: "MEP Jutta Paulus (Greens/EFA)",
    date: "2026-04-15",
    committee: "ENVI",
    target: "European Commission / DG ENER",
    content: "Will the Commission enforce immediate infringement proceedings on member states failing to draft simplified fast-track permitting plans for grid connectors?",
    status: "Answer Pending",
    risk: "Med Risk",
    riskRationale: "Greens push for hyper-rapid permitting; helpful for Enel's distributed grids but increases immediate administrative compliance overhead."
  }
];

const VOTE_RESULTS = {
  "sitting-202605": {
    sittingId: "sitting-202605",
    sittingDate: "2026-05-15",
    resolution: "Draft Regulation on Electricity Market Design (EMD) — Amendment 42 (Retail Price Controls)",
    totalVotes: 689,
    split: {
      yes: 184,
      no: 472,
      abstain: 33
    },
    outcome: "Rejected (Amendment Defeated)",
    strategicImpact: "Enel-supportive. The defeat of emergency retail price controls ensures Enel's pricing mechanisms remain determined by long-term market parameters, safeguarding margins."
  },
  "sitting-202604": {
    sittingId: "sitting-202604",
    sittingDate: "2026-04-22",
    resolution: "Energy Efficiency Directive Recast (EED) — Plenary Final Adoption",
    totalVotes: 702,
    split: {
      yes: 489,
      no: 168,
      abstain: 45
    },
    outcome: "Adopted",
    strategicImpact: "Legislation passed. Forces strict energy consumption reduction mandates. Enel must accelerate national efficiency contracting offers to offset retail load drops."
  }
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "questions";

    if (type === "votes") {
      const id = searchParams.get("id") || "sitting-202605";
      const vote = VOTE_RESULTS[id as keyof typeof VOTE_RESULTS];
      return NextResponse.json({ vote: vote || null, demo: true });
    }

    // Default: Return tracked questions
    const q = searchParams.get("q") || "";
    let filteredQuestions = QUESTIONS_DB;

    if (q) {
      filteredQuestions = QUESTIONS_DB.filter(item => 
        item.title.toLowerCase().includes(q.toLowerCase()) || 
        item.askedBy.toLowerCase().includes(q.toLowerCase()) ||
        item.content.toLowerCase().includes(q.toLowerCase())
      );
    }

    return NextResponse.json({ questions: filteredQuestions, demo: true });
  } catch (error: any) {
    console.error("Parliament Route Error:", error);
    return NextResponse.json({ error: "Failed to retrieve EP watch feed.", demo: true }, { status: 500 });
  }
}
