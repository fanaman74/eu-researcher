import { describe, it, expect } from "vitest";
import { diffSnapshot } from "../lib/changeFeed";
import { parsePlannedPeriod, toRadarItem, upcomingRadar } from "../lib/radar";
import { parseProcedure, WATCHLIST } from "../lib/dossiers";
import { matchPeer } from "../lib/peers";
import { parseMeetings } from "../lib/commissionMeetings";
import { toPressItem } from "../lib/pressCorner";
import { dailyPrices } from "../lib/market";
import { radarEvents, toIcs } from "../lib/calendar";
import { digestText } from "../lib/digest";

describe("diffSnapshot", () => {
  const labels = { stage: "Stage", plannedPeriod: "Planned adoption" };
  const item = (fields: Record<string, string | null>) => ({ externalId: "1", title: "Grid package", url: "https://example.eu/1", fields });

  it("reports a field change with old and new values", () => {
    const prev = new Map([["1", { stage: "Planned", plannedPeriod: "Q4 2026" }]]);
    const [change] = diffSnapshot("radar", prev, [item({ stage: "Planned", plannedPeriod: "Q1 2027" })], { labels });
    expect(change.kind).toBe("changed");
    expect(change.summary).toBe("Planned adoption: Q4 2026 → Q1 2027");
  });

  it("reports unseen items as new and unchanged items not at all", () => {
    const prev = new Map([["1", { stage: "Planned", plannedPeriod: null }]]);
    const next = [item({ stage: "Planned", plannedPeriod: null }), { ...item({ stage: "Planned", plannedPeriod: null }), externalId: "2" }];
    const changes = diffSnapshot("radar", prev, next, { labels, describeNew: () => "described" });
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ externalId: "2", kind: "new", summary: "described" });
  });

  it("ignores fields that are not tracked", () => {
    const prev = new Map([["1", { stage: "Planned", plannedPeriod: null, summary: "old" }]]);
    expect(diffSnapshot("radar", prev, [item({ stage: "Planned", plannedPeriod: null, summary: "new" })], { labels })).toEqual([]);
  });
});

describe("radar", () => {
  // Shaped like a real Have Your Say record (initiative 19293).
  const group = {
    id: 19293,
    shortTitle: "Minimum performance standards for data centres in Europe",
    stage: "PLANNING_WORKFLOW",
    foreseenActType: "PROP_REG",
    dg: "ENER",
    isMajor: true,
    publications: [
      { frontEndStage: "PLANNING_WORKFLOW", receivingFeedbackStatus: "OPEN", endDate: "2026/12/14 23:59:59", totalFeedback: 21 },
      { frontEndStage: "ADOPTION_WORKFLOW", receivingFeedbackStatus: "UPCOMING", plannedPeriod: "Q-2027-2", totalFeedback: 0 },
    ],
  };
  const now = new Date("2026-10-02T00:00:00Z");

  it("parses planned quarters", () => {
    expect(parsePlannedPeriod("Q-2027-2")).toEqual({ label: "Q2 2027", sort: "2027-2" });
    expect(parsePlannedPeriod("")).toBeNull();
  });

  it("derives act type, planned quarter and open feedback period", () => {
    const item = toRadarItem(group, now);
    expect(item).toMatchObject({
      actType: "Proposal for a regulation",
      stage: "Call for evidence",
      plannedPeriod: "Q2 2027",
      status: "Upcoming",
      feedback: "Open",
      feedbackEnd: "2026-12-14",
      totalFeedback: 21,
    });
  });

  it("marks a passed quarter without adoption as overdue, and an adoption as adopted", () => {
    const late = { ...group, publications: [{ frontEndStage: "ADOPTION_WORKFLOW", plannedPeriod: "Q-2026-1" }] };
    expect(toRadarItem(late, now).status).toBe("Overdue");
    const done = { ...group, publications: [{ frontEndStage: "ADOPTION_WORKFLOW", plannedPeriod: "Q-2026-1", adoptionDate: "2026/03/02 00:00:00" }] };
    expect(toRadarItem(done, now)).toMatchObject({ status: "Adopted", adoptionDate: "2026-03-02" });
  });

  it("lists upcoming items by quarter before overdue ones", () => {
    const mk = (id: number, plannedPeriod: string) => toRadarItem({ ...group, id, publications: [{ frontEndStage: "ADOPTION_WORKFLOW", plannedPeriod }] }, now);
    const order = upcomingRadar([mk(1, "Q-2020-1"), mk(2, "Q-2027-1"), mk(3, "Q-2026-4"), mk(4, "Q-2026-2")]).map((i) => i.id);
    expect(order).toEqual(["3", "2", "4", "1"]);
  });
});

describe("parseProcedure", () => {
  const file = WATCHLIST[0];
  const proc = {
    process_title: { en: "Guidelines for trans-European energy infrastructure" },
    current_stage: "http://publications.europa.eu/resource/authority/procedure-phase/RDG1",
    had_participation: [
      { participation_role: "def/ep-roles/RAPPORTEUR_SHADOW", had_participant_person: ["person/2"], politicalGroup: "org/PPE" },
      { participation_role: "def/ep-roles/COMMITTEE_LEAD", had_participant_organization: ["org/ITRE"] },
      { participation_role: "def/ep-roles/RAPPORTEUR", had_participant_person: ["person/1"], politicalGroup: "org/S-D", participation_in_name_of: "org/ITRE" },
    ],
    consists_of: [
      { activity_date: "2026-02-12", had_activity_type: "def/ep-activities/REFERRAL" },
      { activity_date: "2026-05-19", had_activity_type: "def/ep-activities/COMMITTEE_TABLING_AMENDMENT", based_on_a_realization_of: ["eli/dl/doc/ITRE-AM-788922"] },
      { activity_date: "2026-05-19", had_activity_type: "def/ep-activities/COMMITTEE_TABLING_AMENDMENT", based_on_a_realization_of: ["eli/dl/doc/ITRE-AM-788941"] },
      { activity_date: "2026-09-30", had_activity_type: "def/ep-activities/INTERINSTITUTIONAL_NEGOTIATION" },
    ],
  };
  const meps = new Map([["1", { name: "Tsvetelina PENKOVA", country: "BG", group: "S&D" }]]);

  it("extracts stage, lead committee and actors with the rapporteur first", () => {
    const d = parseProcedure(file, proc, meps);
    expect(d.stage).toBe("First reading");
    expect(d.leadCommittee).toBe("ITRE — Industry, Research and Energy");
    expect(d.actors[0]).toMatchObject({ name: "Tsvetelina PENKOVA", role: "Rapporteur", group: "S&D", country: "BG", committee: "ITRE" });
    expect(d.actors[1]).toMatchObject({ name: "MEP 2", role: "Shadow rapporteur", group: "EPP" });
  });

  it("orders the timeline newest first and merges same-day activities", () => {
    const d = parseProcedure(file, proc, meps);
    expect(d.lastActivity).toEqual({ date: "2026-09-30", label: "Interinstitutional negotiations (trilogue)" });
    expect(d.timeline).toHaveLength(3);
    expect(d.timeline[1].documents.map((x) => x.id)).toEqual(["ITRE-AM-788922", "ITRE-AM-788941"]);
  });

  it("accepts single values that JSON-LD writes without an array", () => {
    const single = {
      ...proc,
      had_participation: { participation_role: "def/ep-roles/COMMITTEE_LEAD", had_participant_organization: "org/ITRE" },
      consists_of: { activity_date: "2026-09-17", had_activity_type: "def/ep-activities/REFERRAL", based_on_a_realization_of: "eli/dl/doc/X-1" },
    };
    const d = parseProcedure(file, single, meps);
    expect(d.leadCommittee).toMatch(/^ITRE/);
    expect(d.timeline).toEqual([{ date: "2026-09-17", label: "Referred to committee", documents: [{ id: "X-1", url: expect.stringContaining("X-1_EN.html") }] }]);
  });

  it("reports a published act as adopted", () => {
    const done = { ...proc, consists_of: [...proc.consists_of, { activity_date: "2027-01-10", had_activity_type: "def/ep-activities/PUBLICATION_OFFICIAL_JOURNAL" }] };
    expect(parseProcedure(file, done, meps).stage).toMatch(/^Adopted/);
  });
});

describe("matchPeer", () => {
  it("matches whole words only", () => {
    expect(matchPeer("ENEL SpA")).toBe("Enel");
    expect(matchPeer("Enel Green Power S.p.A.")).toBe("Enel");
    expect(matchPeer("Expert panel on circular economy")).toBeNull();
    expect(matchPeer("CHANEL")).toBeNull();
    expect(matchPeer("ENEDIS")).toBeNull();
  });

  it("recognises associations and name variants", () => {
    expect(matchPeer("Union of the Electricity Industry - Eurelectric aisbl")).toBe("Eurelectric");
    expect(matchPeer("ENTSO-e")).toBe("ENTSO-E");
    expect(matchPeer("Ørsted A/S")).toBe("Ørsted");
    expect(matchPeer("ELECTRICITE DE FRANCE")).toBe("EDF");
    expect(matchPeer("")).toBeNull();
  });
});

describe("parseMeetings", () => {
  // The export double-encodes entities.
  const xml = `<meetings><meeting>
<cabinet>Cabinet of Commissioner Dan J&amp;#248;rgensen</cabinet>
<date>2026-09-30</date><location>Brussels</location><subject>Energy  Efficiency </subject>
<entities><entity><name>Mitsui &amp;amp; Co. Benelux</name><id>126187296814-11</id></entity>
<entity><name>ENEL SpA</name><id>6256831207-27</id></entity></entities>
<representatives><representative><name>Jane Doe</name><title>Cabinet member</title></representative></representatives>
</meeting></meetings>`;

  it("decodes entities and extracts organisations and officials", () => {
    const [m] = parseMeetings(xml, "Cabinet");
    expect(m.host).toBe("Cabinet of Commissioner Dan Jørgensen");
    expect(m.subject).toBe("Energy Efficiency");
    expect(m.organisations).toEqual([
      { name: "Mitsui & Co. Benelux", id: "126187296814-11" },
      { name: "ENEL SpA", id: "6256831207-27" },
    ]);
    expect(m.officials).toEqual(["Jane Doe (Cabinet member)"]);
  });
});

describe("toPressItem", () => {
  const doc = (title: string, extra = {}) => ({ title, leadText: "", refCode: "IP/26/1667", eventDate: "2026-09-21", docutype: { code: "IP", description: "Press release" }, ...extra });

  it("keeps energy items and builds the press corner link", () => {
    const p = toPressItem(doc("Commission enhances energy efficiency of data centres"));
    expect(p?.url).toBe("https://ec.europa.eu/commission/presscorner/detail/en/ip_26_1667");
    expect(p?.stateAid).toBe(false);
  });

  it("flags state aid and drops unrelated items and daily digests", () => {
    expect(toPressItem(doc("Commission approves €1 billion German State aid for renewable hydrogen"))?.stateAid).toBe(true);
    expect(toPressItem(doc("Commission approves State aid for farmers facing increased fuel prices"))).toBeNull();
    expect(toPressItem(doc("EU provides humanitarian aid"))).toBeNull();
    expect(toPressItem(doc("Daily News on energy", { docutype: { code: "MEX" } }))).toBeNull();
  });
});

describe("dailyPrices", () => {
  it("averages per Rome calendar day and skips gaps", () => {
    const t0 = Date.UTC(2026, 9, 1, 10) / 1000; // 12:00 in Rome
    const days = dailyPrices([t0, t0 + 3600, t0 + 7200, t0 + 86400], [100, null, 200, 50]);
    expect(days).toEqual([
      { date: "2026-10-01", avg: 150, min: 100, max: 200 },
      { date: "2026-10-02", avg: 50, min: 50, max: 50 },
    ]);
  });
});

describe("calendar", () => {
  const base = toRadarItem({ id: 7, shortTitle: "Hydrogen strategy", stage: "INIT_PLANNED", foreseenActType: "COMMUNIC", publications: [
    { frontEndStage: "PLANNING_WORKFLOW", receivingFeedbackStatus: "OPEN", endDate: "2026/10/15 23:59:59" },
    { frontEndStage: "ADOPTION_WORKFLOW", plannedPeriod: "Q-2026-4" },
  ] }, new Date("2026-10-02T00:00:00Z"));

  it("turns radar items into a deadline and a quarter-end entry", () => {
    const events = radarEvents([base], "2026-10-02");
    expect(events.map((e) => [e.kind, e.date])).toEqual([
      ["Consultation deadline", "2026-10-15"],
      ["Planned adoption", "2026-12-31"],
    ]);
  });

  it("writes valid all-day iCalendar events with escaped text and folded lines", () => {
    const ics = toIcs([{ date: "2026-12-31", kind: "Planned adoption", title: `Hydrogen, storage; grids ${"x".repeat(80)}`, url: "https://example.eu/7" }], new Date("2026-10-02T08:00:00Z"));
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261231\r\n");
    expect(ics).toContain("DTEND;VALUE=DATE:20270101\r\n");
    expect(ics).toContain("Hydrogen\\, storage\\; grids");
    expect(ics.split("\r\n").every((line) => Buffer.byteLength(line) <= 75)).toBe(true);
  });
});

describe("digestText", () => {
  it("lists changes by source with absolute links, and deadlines", () => {
    const text = digestText(
      {
        generatedAt: "2026-10-02T06:00:00Z",
        hours: 24,
        persistent: true,
        sections: [{ source: "dossier", label: "Legislative files", changes: [
          { id: "a", source: "dossier", externalId: "2025-0399", kind: "changed", title: "TEN-E", summary: "Stage: A → B", url: "/enel/dossiers/2025-0399", detectedAt: "2026-10-02T00:00:00Z" },
        ] }],
        deadlines: [{ id: "9", title: "Omnibus", feedbackEnd: "2026-10-15", url: "https://example.eu/9", totalFeedback: 66 }],
      },
      "https://hub.example"
    );
    expect(text).toContain("LEGISLATIVE FILES (1)");
    expect(text).toContain("- [Changed] TEN-E\n  Stage: A → B\n  https://hub.example/enel/dossiers/2025-0399");
    expect(text).toContain("- 2026-10-15: Omnibus (66 responses so far)");
  });
});
