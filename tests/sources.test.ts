import { describe, it, expect } from "vitest";
import { parseQuestion, isEnergyRelevant } from "../lib/epQuestions";
import { cameraVoteToEvent, cameraVoteUrl } from "../lib/cameraVotes";
import { cleanTitle } from "../lib/eurlex";
import { SOURCE_URL_PATTERN } from "../lib/validateEvent";

// Shaped like a real EP Open Data record (E-10-2026-003603).
const epWork = {
  document_date: "2026-09-09",
  title_dcterms: {
    en: "Data centre concentration in Lombardy: environmental and sustainability risks",
    it: "Concentrazione data center in Lombardia",
  },
  workHadParticipation: [
    { participation_role: "def/ep-roles/AUTHOR", had_participant_person: ["person/257126"] },
    { participation_role: "def/ep-roles/ADDRESSEE", had_participant_organization: ["org/COM"] },
  ],
  is_realized_by: [
    { id: "eli/dl/doc/E-10-2026-003603/it", title_alternative: { it: "Interrogazione ... - Gaetano Pedulla' (The Left)" } },
    {
      id: "eli/dl/doc/E-10-2026-003603/en",
      title_alternative: {
        en: "Question for written answer E-003603/2026 - to the Commission - Rule 144 - Gaetano Pedulla' (The Left)",
      },
    },
  ],
  inverse_answers_to: [],
};

describe("parseQuestion", () => {
  it("extracts id, English title, author with group, addressee and pending status", () => {
    const q = parseQuestion("E-10-2026-003603", epWork);
    expect(q.id).toBe("E-003603/2026");
    expect(q.title).toMatch(/^Data centre concentration/);
    expect(q.askedBy).toBe("Gaetano Pedulla' (The Left)");
    expect(q.target).toBe("European Commission");
    expect(q.status).toBe("Answer Pending");
    expect(q.answerUrl).toBeNull();
    expect(q.url).toBe("https://www.europarl.europa.eu/doceo/document/E-10-2026-003603_EN.html");
  });

  it("marks answered questions and links the answer", () => {
    const q = parseQuestion("E-10-2026-003603", {
      ...epWork,
      inverse_answers_to: [{ document_date: "2026-11-02" }],
    });
    expect(q.status).toBe("Answered");
    expect(q.answerDate).toBe("2026-11-02");
    expect(q.answerUrl).toContain("E-10-2026-003603-ASW_EN.html");
  });

  it("keeps multiple authors intact", () => {
    const work = {
      ...epWork,
      is_realized_by: [
        { id: "x/en", title_alternative: { en: "Question for written answer E-003600/2026 - to the Commission - Rule 144 - A (S&D), B (S&D)" } },
      ],
    };
    expect(parseQuestion("E-10-2026-003600", work).askedBy).toBe("A (S&D), B (S&D)");
  });
});

describe("isEnergyRelevant", () => {
  it("matches energy topics and rejects unrelated ones", () => {
    const base = parseQuestion("E-10-2026-003603", epWork);
    expect(isEnergyRelevant({ ...base, title: "Electricity thefts and smart meters" })).toBe(true);
    expect(isEnergyRelevant({ ...base, title: "Access to cash and cash payments in Europe" })).toBe(false);
  });
});

describe("cameraVoteToEvent", () => {
  const vote = {
    uri: "http://dati.camera.it/ocd/votazione.rdf/vs19_714_031",
    description: "DDL 2628-A E ABB - VOTO FINALE",
    date: "2026-09-23",
    favorevoli: 145,
    contrari: 0,
    astenuti: 80,
    approvato: true,
  };

  it("builds an event containing only facts from the record", () => {
    const e = cameraVoteToEvent(vote);
    expect(e.title).toBe("Chamber final vote: DDL 2628-A E ABB");
    expect(e.description).toContain("145 in favour");
    expect(e.impactLevel).toBe("Low");
    expect(e.entities).toEqual([]);
    expect(e.date).toBe("2026-09-23T00:00:00.000Z");
  });

  it("derives a valid, working-format source URL", () => {
    const url = cameraVoteUrl(vote.uri);
    expect(SOURCE_URL_PATTERN.test(url)).toBe(true);
    expect(url).toContain("Legislatura=XIX&RifVotazione=714_31");
  });
});

describe("cleanTitle", () => {
  it("replaces Cellar's # separators and non-breaking spaces", () => {
    expect(cleanTitle("Judgment of the Court of 24 September 2026.#F.B. v Région wallonne.#Request")).toBe(
      "Judgment of the Court of 24 September 2026. — F.B. v Région wallonne. — Request"
    );
  });
});
