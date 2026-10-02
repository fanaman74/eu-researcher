import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkRateLimit, getClientIp, isAllowedOrigin } from "@/lib/apiGuard";
import { AiConfigError, decryptAiProfile } from "@/lib/aiSettings";
import { AiValidationError, isAiProviderId, validateAiProfile } from "@/lib/aiProviders";
import { AiProviderError, createAiClient, type AiMessage } from "@/lib/llm";

export const dynamic = "force-dynamic";
function noStore(response: NextResponse) { response.headers.set("Cache-Control", "no-store"); return response; }

export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) return noStore(NextResponse.json({ error: "Forbidden." }, { status: 403 }));
  if (!checkRateLimit(`ai-test:${getClientIp(req)}`, 5, 60_000)) return noStore(NextResponse.json({ error: "Too many connection tests. Try again shortly." }, { status: 429 }));
  try {
    let body: Record<string, unknown>;
    try { body = await req.json() as Record<string, unknown>; } catch { return noStore(NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 })); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return noStore(NextResponse.json({ error: "Invalid settings body." }, { status: 400 }));
    if (!isAiProviderId(body.provider)) return noStore(NextResponse.json({ error: "Unknown AI provider." }, { status: 400 }));
    const jar = await cookies();
    let apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    if (!apiKey) {
      const saved = jar.get(`eu_ai_profile_${body.provider}`)?.value;
      if (saved) { try { apiKey = decryptAiProfile(saved, body.provider).apiKey; } catch { /* validation below */ } }
    }
    const profile = validateAiProfile({ provider: body.provider, model: body.model, apiKey });
    const client = createAiClient({ ...profile, source: "personal" });
    await client.complete([{ role: "user", content: "Reply with the single word OK." } satisfies AiMessage], { max_tokens: 256 });
    return noStore(NextResponse.json({ ok: true, provider: profile.provider, model: profile.model }));
  } catch (error) {
    if (error instanceof AiConfigError || error instanceof AiValidationError) return noStore(NextResponse.json({ error: error.message, category: error instanceof AiConfigError ? error.code : "validation" }, { status: 400 }));
    if (error instanceof AiProviderError) return noStore(NextResponse.json({ error: "The provider connection failed. Check the model ID and API key, then try again.", category: error.category }, { status: 502 }));
    return noStore(NextResponse.json({ error: "The provider connection failed. Check the model ID and API key, then try again.", category: "provider" }, { status: 502 }));
  }
}
