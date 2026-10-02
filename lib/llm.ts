/**
 * The OpenRouter model used by every AI route. Override with OPENROUTER_MODEL.
 * The default is a model that is commonly allowed by OpenRouter workspace guardrails;
 * if requests fail with "blocked by guardrail", allow the model there or set another id.
 */
export const LLM_MODEL = process.env.OPENROUTER_MODEL || "~deepseek/deepseek-flash-latest";
