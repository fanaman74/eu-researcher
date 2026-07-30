// DEMO DATA: hardcoded mock — not connected to a live source.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CONSULTATIONS_DB = [
  {
    pid: "PID-2026-EMD",
    title: "Public Consultation on electricity market design crisis interventions",
    status: "Closed (Analysis Phase)",
    totalSubmissions: 412,
    closingDate: "2026-05-15",
    enelAlignment: "Strong Alignment (92%)",
    demographics: {
      countries: [
        { country: "Italy", percentage: 34, submissions: 140 },
        { country: "Germany", percentage: 22, submissions: 90 },
        { country: "France", percentage: 18, submissions: 74 },
        { country: "Spain", percentage: 15, submissions: 62 },
        { country: "Others", percentage: 11, submissions: 46 }
      ],
      sectors: [
        { name: "Trade & Industry Associations", percentage: 48, count: 198 },
        { name: "Utility Operators", percentage: 24, count: 99 },
        { name: "Environmental NGOs", percentage: 16, count: 66 },
        { name: "Citizens & Academia", percentage: 12, count: 49 }
      ],
      sentiments: [
        { label: "Enel-Supportive (Pro-Market/PPAs)", percentage: 68, count: 280 },
        { label: "Neutral", percentage: 18, count: 74 },
        { label: "Hostile (Support Price-Caps)", percentage: 14, count: 58 }
      ]
    },
    submissions: [
      {
        id: "SUB-801",
        stakeholder: "Eurelectric (EU Power Sector)",
        country: "EU-level",
        attachment: "Eurelectric_Position_Paper_EMD.pdf",
        snippet: "Eurelectric strongly cautions against structural wholesale price caps. Market trust is paramount to trigger the private grid investments required for decarbonization.",
        sentiment: "Supportive",
        relevance: "High"
      },
      {
        id: "SUB-815",
        stakeholder: "Greenpeace European Unit",
        country: "EU-level",
        attachment: "Greenpeace_Interventionist_Electricity_Market.pdf",
        snippet: "We urge the Commission to implement structural profit caps on utility conglomerates to subsidize consumer bills and finance local municipal energy co-operatives.",
        sentiment: "Hostile",
        relevance: "High"
      },
      {
        id: "SUB-840",
        stakeholder: "Confindustria (Italian Industry Group)",
        country: "Italy",
        attachment: "Confindustria_EMD_Interventions.pdf",
        snippet: "Italian energy intensive industries support long-term pricing options but urge grid-tariff exemptions to maintain competitiveness during price spikes.",
        sentiment: "Supportive",
        relevance: "Med"
      }
    ]
  },
  {
    pid: "PID-2026-RED3",
    title: "Public Consultation on simplified grid connector permitting mandates (RED III Article 6)",
    status: "Open (Polling Submissions)",
    totalSubmissions: 124,
    closingDate: "2026-07-01",
    enelAlignment: "Full Support (98%)",
    demographics: {
      countries: [
        { country: "Spain", percentage: 38, submissions: 47 },
        { country: "Italy", percentage: 28, submissions: 35 },
        { country: "France", percentage: 16, submissions: 20 },
        { country: "Others", percentage: 18, submissions: 22 }
      ],
      sectors: [
        { name: "Utility Operators", percentage: 55, count: 68 },
        { name: "Trade Associations", percentage: 25, count: 31 },
        { name: "NGOs", percentage: 10, count: 12 },
        { name: "Others", percentage: 10, count: 13 }
      ],
      sentiments: [
        { label: "Enel-Supportive (Fast-Track Permitting)", percentage: 85, count: 105 },
        { label: "Neutral", percentage: 10, count: 12 },
        { label: "Hostile (Environmental Exceptions)", percentage: 5, count: 7 }
      ]
    },
    submissions: [
      {
        id: "SUB-902",
        stakeholder: "WindEurope",
        country: "EU-level",
        attachment: "WindEurope_FastTrackPermitting_REDIII.pdf",
        snippet: "Simplified permitting rules are critical. Current queues for wind-farm and grid connectors extend to 7 years in Spain, blocking clean generation deployment.",
        sentiment: "Supportive",
        relevance: "High"
      },
      {
        id: "SUB-911",
        stakeholder: "European Environmental Bureau (EEB)",
        country: "EU-level",
        attachment: "EEB_Grid_FastTrack_Exceptions.pdf",
        snippet: "Fast-tracking Permitting must not override Environmental Impact Assessments (EIAs), particularly in ecologically sensitive Natura 2000 protected areas.",
        sentiment: "Hostile",
        relevance: "High"
      }
    ]
  }
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pid = searchParams.get("pid") || "";

    if (pid) {
      const consultation = CONSULTATIONS_DB.find(item => item.pid === pid);
      return NextResponse.json({ consultation: consultation || null, demo: true });
    }

    return NextResponse.json({ consultations: CONSULTATIONS_DB, demo: true });
  } catch (error: any) {
    console.error("Have Your Say Route Error:", error);
    return NextResponse.json({ error: "Failed to retrieve Have Your Say feed.", demo: true }, { status: 500 });
  }
}
