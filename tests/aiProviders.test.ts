import { afterEach, describe, expect, it, vi } from "vitest";
import { createAiClient } from "../lib/llm";
import { AI_PROVIDERS } from "../lib/aiProviders";

afterEach(() => vi.unstubAllGlobals());

describe("AI provider adapter", () => {
  it("exposes only fixed provider origins", () => {
    expect(AI_PROVIDERS.openrouter.origin).toBe("https://openrouter.ai/api/v1");
    expect(AI_PROVIDERS.openai.origin).toBe("https://api.openai.com/v1");
    expect(AI_PROVIDERS.deepseek.origin).toBe("https://api.deepseek.com");
    expect(AI_PROVIDERS.anthropic.origin).toBe("https://api.anthropic.com/v1/messages");
  });

  it("uses each OpenAI-compatible origin with bearer auth and a bounded request", async () => {
    for (const provider of ["openrouter", "openai", "deepseek"] as const) {
      const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "completion-test", object: "chat.completion", created: 1, model: "model-id", choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: "ok" } }] }), { status: 200, headers: { "content-type": "application/json" } }));
      const client = createAiClient({ provider, model: "model-id", apiKey: "provider-secret", source: "personal" }, fetchMock as unknown as typeof fetch);
      await client.complete([{ role: "user", content: "hello" }]);
      const [request, init] = fetchMock.mock.calls[0] as unknown as [string | Request, RequestInit];
      expect(String(request)).toContain(AI_PROVIDERS[provider].origin);
      expect(new Headers(init.headers).get("authorization")).toBe("Bearer provider-secret");
      const requestBody = JSON.parse(String(init.body));
      expect(requestBody).toMatchObject({ model: "model-id" });
      expect(requestBody.max_tokens || requestBody.max_completion_tokens).toBe(4096);
    }
  });

  it("converts Claude tool calls and groups parallel tool results for the next turn", async () => {
    const bodies: Record<string, unknown>[] = [];
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ content: [{ type: "tool_use", id: "call-1", name: "search", input: { q: "energy" } }, { type: "tool_use", id: "call-2", name: "search", input: { q: "law" } }] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = createAiClient({ provider: "anthropic", model: "claude-test", apiKey: "claude-secret", source: "personal" });
    const first = await client.complete([{ role: "user", content: "search" }], { tools: [{ type: "function", function: { name: "search", description: "Search", parameters: { type: "object" } } }] });
    await client.complete([
      { role: "user", content: "search" },
      { role: "assistant", content: null, tool_calls: first.tool_calls, nativeContent: first.nativeContent },
      { role: "tool", tool_call_id: "call-1", content: "one" },
      { role: "tool", tool_call_id: "call-2", content: "two" },
    ]);
    expect(bodies[0]).toMatchObject({ model: "claude-test", tools: [{ name: "search", input_schema: { type: "object" } }] });
    expect(bodies[1].messages).toEqual([
      { role: "user", content: [{ type: "text", text: "search" }] },
      { role: "assistant", content: [{ type: "tool_use", id: "call-1", name: "search", input: { q: "energy" } }, { type: "tool_use", id: "call-2", name: "search", input: { q: "law" } }] },
      { role: "user", content: [{ type: "tool_result", tool_use_id: "call-1", content: "one" }, { type: "tool_result", tool_use_id: "call-2", content: "two" }] },
    ]);
  });

  it("preserves thinking blocks and rejects malformed native responses", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ content: [{ type: "thinking", thinking: "internal" }, { type: "redacted_thinking", data: "opaque" }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = createAiClient({ provider: "anthropic", model: "claude-test", apiKey: "secret", source: "personal" });
    const result = await client.complete([{ role: "user", content: "hello" }]);
    expect(result.nativeContent).toHaveLength(2);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ content: [{ type: "text" }] }), { status: 200 }));
    await expect(client.complete([{ role: "user", content: "hello" }])).rejects.toMatchObject({ category: "invalid-response" });
  });
});
