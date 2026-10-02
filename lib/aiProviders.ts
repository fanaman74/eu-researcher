/** Public provider metadata and strict validation shared by settings UI and API routes. */
export const AI_PROVIDER_IDS = ["openrouter", "openai", "anthropic", "deepseek"] as const;
export type AiProviderId = (typeof AI_PROVIDER_IDS)[number];

export type AiProviderMeta = {
  id: AiProviderId;
  label: string;
  description: string;
  origin: string;
  docsUrl: string;
};

export class AiValidationError extends Error {
  constructor(message: string) { super(message); this.name = "AiValidationError"; }
}

export const AI_PROVIDERS: Record<AiProviderId, AiProviderMeta> = {
  openrouter: { id: "openrouter", label: "OpenRouter", description: "One API key for models from many providers.", origin: "https://openrouter.ai/api/v1", docsUrl: "https://openrouter.ai/keys" },
  openai: { id: "openai", label: "OpenAI / ChatGPT", description: "OpenAI API access. A ChatGPT subscription does not include API credit.", origin: "https://api.openai.com/v1", docsUrl: "https://platform.openai.com/api-keys" },
  anthropic: { id: "anthropic", label: "Claude", description: "Use a Claude model with your Anthropic API key.", origin: "https://api.anthropic.com/v1/messages", docsUrl: "https://platform.claude.com/docs/en/api/messages/create" },
  deepseek: { id: "deepseek", label: "DeepSeek", description: "Use a DeepSeek model with your DeepSeek API key.", origin: "https://api.deepseek.com", docsUrl: "https://api-docs.deepseek.com/" },
};

export function isAiProviderId(value: unknown): value is AiProviderId {
  return typeof value === "string" && (AI_PROVIDER_IDS as readonly string[]).includes(value);
}

export function validateAiText(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") throw new AiValidationError(`${field} is required.`);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max || /[\u0000-\u001f\u007f]/.test(trimmed)) throw new AiValidationError(`Invalid ${field}.`);
  return trimmed;
}

export function validateAiProfile(value: unknown): { provider: AiProviderId; model: string; apiKey: string } {
  if (!value || typeof value !== "object") throw new AiValidationError("A provider profile is required.");
  const input = value as Record<string, unknown>;
  if (!isAiProviderId(input.provider)) throw new AiValidationError("Unknown AI provider.");
  return {
    provider: input.provider,
    model: validateAiText(input.model, "model", 160),
    apiKey: validateAiText(input.apiKey, "API key", 512),
  };
}
