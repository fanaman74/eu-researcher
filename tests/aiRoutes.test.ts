import { describe, expect, it } from "vitest";
import { POST as saveSettings } from "../app/api/ai/settings/route";
import { POST as testConnection } from "../app/api/ai/test/route";

async function json(response: Response) { return response.json() as Promise<Record<string, unknown>>; }

describe("AI settings route validation", () => {
  it("rejects malformed and null save bodies without touching cookies", async () => {
    const malformed = await saveSettings(new Request("http://localhost/api/ai/settings", { method: "POST", body: "{" }));
    expect(malformed.status).toBe(400);
    const nullBody = await saveSettings(new Request("http://localhost/api/ai/settings", { method: "POST", body: "null", headers: { "content-type": "application/json" } }));
    expect(nullBody.status).toBe(400);
    expect((await json(nullBody)).error).toBe("Invalid settings body.");
  });

  it("rejects malformed and null connection-test bodies with safe 400 responses", async () => {
    const malformed = await testConnection(new Request("http://localhost/api/ai/test", { method: "POST", body: "{" }));
    expect(malformed.status).toBe(400);
    const nullBody = await testConnection(new Request("http://localhost/api/ai/test", { method: "POST", body: "null", headers: { "content-type": "application/json" } }));
    expect(nullBody.status).toBe(400);
    expect((await json(nullBody)).error).toBe("Invalid settings body.");
  });
});
