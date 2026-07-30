import { describe, expect, it } from "vitest";
import { validateEventPayload, MAX_BODY_BYTES, SOURCE_URL_PATTERN } from "@/lib/validateEvent";

const validPayload = {
  title: "Chamber Floor Vote on Smart Grid Decree",
  description: "The Chamber passes the smart grid decree.",
  content: "Full text of the floor vote coverage.",
  sourceType: "Official",
  sourceName: "Dati Camera",
  sourceUrl: "https://dati.camera.it/votazione/sg-2026",
  category: "Floor Vote",
  impactLevel: "High",
  entities: [{ name: "Matteo Salvini", role: "Minister of Infrastructure", party: "Lega" }],
  tags: ["Smart Grid", "Tariffario"],
};

describe("validateEventPayload", () => {
  it("accepts a fully valid payload and preserves its fields", () => {
    const result = validateEventPayload(validPayload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.title).toBe(validPayload.title);
      expect(result.data.sourceUrl).toBe("https://dati.camera.it/votazione/sg-2026");
      expect(result.data.entities).toHaveLength(1);
      expect(result.data.tags).toEqual(["Smart Grid", "Tariffario"]);
    }
  });

  it("rejects payloads missing a required field", () => {
    const { title, ...withoutTitle } = validPayload;
    const result = validateEventPayload(withoutTitle);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/title/);
  });

  it("rejects non-http(s) sourceUrl values (stored-XSS guard)", () => {
    for (const sourceUrl of ["javascript:alert(1)", "data:text/html,<script>1</script>", "ftp://x"]) {
      expect(SOURCE_URL_PATTERN.test(sourceUrl)).toBe(false);
      const result = validateEventPayload({ ...validPayload, sourceUrl });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/sourceUrl/);
    }
  });

  it("rejects values outside the documented enums", () => {
    const badImpact = validateEventPayload({ ...validPayload, impactLevel: "Critical" });
    expect(badImpact.ok).toBe(false);

    const badSourceType = validateEventPayload({ ...validPayload, sourceType: "Blog" });
    expect(badSourceType.ok).toBe(false);

    const badParty = validateEventPayload({
      ...validPayload,
      entities: [{ name: "Someone", party: "NONEXISTENT" }],
    });
    expect(badParty.ok).toBe(false);
  });

  it("applies defaults for optional sourceUrl, entity role/party and tags", () => {
    const { sourceUrl, entities, tags, ...rest } = validPayload;
    const result = validateEventPayload({ ...rest, entities: [{ name: "Elly Schlein" }] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sourceUrl).toBe("https://dati.camera.it");
      expect(result.data.entities[0]).toEqual({
        name: "Elly Schlein",
        role: "Unknown",
        party: "Other",
      });
      expect(result.data.tags).toEqual([]);
    }
  });

  it("rejects malformed entities/tags and non-object bodies", () => {
    expect(validateEventPayload(null).ok).toBe(false);
    expect(validateEventPayload("not-an-object").ok).toBe(false);
    expect(validateEventPayload({ ...validPayload, tags: ["ok", 42] }).ok).toBe(false);
    expect(validateEventPayload({ ...validPayload, entities: [{ role: "No name" }] }).ok).toBe(false);
  });

  it("exposes a sane 100KB body cap constant", () => {
    expect(MAX_BODY_BYTES).toBe(100 * 1024);
  });
});
