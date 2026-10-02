/**
 * The OpenRouter model used by every AI route. Override with OPENROUTER_MODEL.
 * The default is the pinned DeepSeek V4 Flash build (supports tool calling). Aliases such as
 * "~deepseek/deepseek-flash-latest" can route to providers a workspace guardrail blocks; if requests
 * fail with "blocked by guardrail", allow the model there or set another id.
 */
export const LLM_MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v4-flash-0731";
