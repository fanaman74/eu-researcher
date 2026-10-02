import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/llm", () => ({ createAiClientForRequest: mocks.create, AiProviderError: class AiProviderError extends Error { category = "unavailable"; } }));
vi.mock("@/lib/aiSettings", () => ({ AiConfigError: class AiConfigError extends Error { source = "personal"; code = "invalid"; } }));

import { POST } from "../app/api/politics-tracker/analyze/route";

beforeEach(() => {
  mocks.create.mockResolvedValue({ source: "personal", model: "test-model", complete: vi.fn().mockResolvedValue({ content: null }) });
});

describe("politics personal AI resolution", () => {
  it("surfaces an empty personal response instead of using the deterministic fallback", async () => {
    const response = await POST(new Request("http://localhost/api/politics-tracker/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Energy vote" }),
    }));
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ category: "invalid-response" });
  });
});
