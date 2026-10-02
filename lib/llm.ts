import OpenAI from "openai";
import { AI_PROVIDERS } from "./aiProviders";
import { resolveAiConfig, type ResolvedAiConfig } from "./aiSettings";

/** Existing server default retained for deployments that only set OPENROUTER_API_KEY. */
export const LLM_MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v4-flash-0731";

export type AiMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
  nativeContent?: unknown[];
  reasoning_content?: string;
  reasoning_details?: unknown;
};
export type AiTool = { type: "function"; function: { name: string; description?: string; parameters: unknown } };
export type AiCompletion = { content: string | null; tool_calls?: AiMessage["tool_calls"]; nativeContent?: unknown[]; reasoning_content?: string; reasoning_details?: unknown };
const OPENAI_TIMEOUT = 60_000;
export type AiProviderErrorCategory = "auth" | "model" | "rate-limit" | "unavailable" | "invalid-response";
export class AiProviderError extends Error {
  constructor(public category: AiProviderErrorCategory) { super("The selected AI provider could not complete the request."); this.name = "AiProviderError"; }
}
function statusCategory(status: number): AiProviderErrorCategory {
  if (status === 401 || status === 403) return "auth";
  if (status === 404) return "model";
  if (status === 429) return "rate-limit";
  if (status >= 500) return "unavailable";
  return "invalid-response";
}

async function anthropicComplete(config: ResolvedAiConfig, messages: AiMessage[], options: { tools?: AiTool[]; max_tokens?: number }): Promise<AiCompletion> {
  const system = messages.filter((m) => m.role === "system").map((m) => String(m.content || "")).join("\n\n");
  const converted: unknown[] = [];
  for (const message of messages.filter((m) => m.role !== "system")) {
    if (message.role === "tool") {
      const previous = converted[converted.length - 1] as { role?: string; content?: unknown } | undefined;
      const block = { type: "tool_result", tool_use_id: message.tool_call_id || "unknown", content: message.content || "" };
      if (previous?.role === "user" && Array.isArray(previous.content)) (previous.content as unknown[]).push(block);
      else converted.push({ role: "user", content: [block] });
      continue;
    }
    if (message.role === "assistant" && message.nativeContent) { converted.push({ role: "assistant", content: message.nativeContent }); continue; }
    const content: unknown[] = [];
    if (message.content) content.push({ type: "text", text: message.content });
    for (const call of message.tool_calls || []) content.push({ type: "tool_use", id: call.id, name: call.function.name, input: (() => { try { return JSON.parse(call.function.arguments); } catch { return {}; } })() });
    converted.push({ role: message.role === "assistant" ? "assistant" : "user", content: content.length ? content : [{ type: "text", text: "" }] });
  }
  const body: Record<string, unknown> = { model: config.model, max_tokens: Math.min(options.max_tokens || 4096, 4096), messages: converted };
  if (system) body.system = system;
  if (options.tools?.length) body.tools = options.tools.map((tool) => ({ name: tool.function.name, description: tool.function.description || "", input_schema: tool.function.parameters }));
  let response: Response;
  try { response = await fetch(AI_PROVIDERS.anthropic.origin, { method: "POST", headers: { "content-type": "application/json", "x-api-key": config.apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify(body), signal: AbortSignal.timeout(OPENAI_TIMEOUT) }); }
  catch { throw new AiProviderError("unavailable"); }
  if (!response.ok) throw new AiProviderError(statusCategory(response.status));
  let data: { content?: unknown[] };
  try { data = await response.json() as { content?: unknown[] }; } catch { throw new AiProviderError("invalid-response"); }
  if (!Array.isArray(data.content)) throw new AiProviderError("invalid-response");
  const blocks = data.content;
  if (blocks.some((block) => {
    if (!block || typeof block !== "object" || typeof (block as { type?: unknown }).type !== "string") return true;
    const type = (block as { type: string }).type;
    if (type === "text") return typeof (block as { text?: unknown }).text !== "string";
    if (type === "thinking" || type === "redacted_thinking") return false;
    if (type === "tool_use") return typeof (block as { id?: unknown }).id !== "string" || typeof (block as { name?: unknown }).name !== "string" || !("input" in block);
    return true;
  })) throw new AiProviderError("invalid-response");
  const text = blocks.filter((block): block is { type: "text"; text: string } => !!block && typeof block === "object" && (block as { type?: string }).type === "text" && typeof (block as { text?: unknown }).text === "string").map((block) => block.text).join("\n");
  const calls = blocks.filter((block): block is { type: "tool_use"; id: string; name: string; input: unknown } => !!block && typeof block === "object" && (block as { type?: string }).type === "tool_use").map((block) => ({ id: block.id, type: "function" as const, function: { name: block.name, arguments: JSON.stringify(block.input ?? {}) } }));
  return { content: text || null, tool_calls: calls.length ? calls : undefined, nativeContent: blocks };
}

export function createAiClient(config: ResolvedAiConfig, fetchImpl?: typeof fetch) {
  const openai = config.provider === "anthropic" ? null : new OpenAI({ apiKey: config.apiKey, baseURL: AI_PROVIDERS[config.provider].origin, timeout: OPENAI_TIMEOUT, maxRetries: 1, defaultHeaders: config.provider === "openrouter" ? { "HTTP-Referer": "https://legaldatahunter.com", "X-Title": "Legal Data Hunter AI" } : undefined, ...(fetchImpl ? { fetch: fetchImpl } : {}) });
  return {
    provider: config.provider, model: config.model, source: config.source,
    complete: async (messages: AiMessage[], options: { tools?: AiTool[]; tool_choice?: unknown; max_tokens?: number } = {}): Promise<AiCompletion> => {
      if (config.provider === "anthropic") return anthropicComplete(config, messages, options);
      try {
        const outputLimit = Math.min(options.max_tokens ?? 4096, 4096);
        const outputField = config.provider === "openai" ? { max_completion_tokens: outputLimit } : { max_tokens: outputLimit };
        const response = await openai!.chat.completions.create({
          model: config.model,
          messages: messages as unknown as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
          tools: options.tools as unknown as OpenAI.Chat.Completions.ChatCompletionTool[] | undefined,
          tool_choice: options.tool_choice as unknown as OpenAI.Chat.Completions.ChatCompletionToolChoiceOption | undefined,
          ...outputField,
        } as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);
        const msg = response.choices?.[0]?.message as unknown as { content?: string | null; tool_calls?: AiCompletion["tool_calls"]; reasoning_content?: string; reasoning_details?: unknown } | undefined;
        if (!msg) throw new AiProviderError("invalid-response");
        return { content: msg.content ?? null, tool_calls: msg.tool_calls, reasoning_content: msg.reasoning_content, reasoning_details: msg.reasoning_details };
      } catch (error: unknown) {
        if (error instanceof AiProviderError) throw error;
        const status = typeof error === "object" && error && "status" in error && typeof (error as { status?: unknown }).status === "number" ? (error as { status: number }).status : 503;
        throw new AiProviderError(statusCategory(status));
      }
    },
  };
}

export async function createAiClientForRequest() { return createAiClient(await resolveAiConfig()); }
export type AiClient = ReturnType<typeof createAiClient>;
