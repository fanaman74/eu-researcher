import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  const values = new Map<string, { value: string }>();
  const writes: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];
  const jar = {
    get: (name: string) => values.get(name),
    set: (name: string, value: string, options?: Record<string, unknown>) => { values.set(name, { value }); writes.push({ name, value, options }); },
    clear: () => { values.clear(); writes.length = 0; },
    values,
    writes,
  };
  return { jar };
});

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => state.jar) }));

import { POST, GET, DELETE } from "../app/api/ai/settings/route";
import { decryptAiProfile, resolveAiConfig } from "../lib/aiSettings";

const request = (method: string, body?: unknown) => new Request("http://localhost/api/ai/settings", { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });

beforeEach(() => { state.jar.clear(); process.env.AI_SETTINGS_SECRET = "route-test-secret-that-is-long-enough"; process.env.OPENROUTER_API_KEY = "server-key-that-is-not-used-for-personal-save"; });

describe("AI settings credential boundary", () => {
  it("requires a key for a first personal save even when a server key exists", async () => {
    const response = await POST(request("POST", { provider: "openrouter", model: "model-id", apiKey: "" }));
    expect(response.status).toBe(400);
  });

  it("retains a saved key only for the same provider and sets protected cookie flags", async () => {
    expect((await POST(request("POST", { provider: "openai", model: "first-model", apiKey: "openai-secret" }))).status).toBe(200);
    expect(state.jar.writes.some((write) => write.name.includes("openai") && write.options?.httpOnly === true && write.options?.path === "/api" && write.options?.sameSite === "strict")).toBe(true);
    const response = await POST(request("POST", { provider: "openai", model: "second-model", apiKey: "" }));
    expect(response.status).toBe(200);
    expect(decryptAiProfile(state.jar.values.get("eu_ai_profile_openai")!.value, "openai").apiKey).toBe("openai-secret");
    expect((await POST(request("POST", { provider: "deepseek", model: "deepseek-model", apiKey: "" }))).status).toBe(400);
  });

  it("does not return keys from GET and resets to server resolution on remove", async () => {
    await POST(request("POST", { provider: "openai", model: "openai-model", apiKey: "private-key" }));
    const response = await GET(new Request("http://localhost/api/ai/settings"));
    const body = await response.json() as Record<string, unknown>;
    expect(JSON.stringify(body)).not.toContain("private-key");
    expect((await DELETE(request("DELETE", { provider: "openai" }))).status).toBe(200);
    expect((await resolveAiConfig(state.jar)).source).toBe("server");
  });
});
