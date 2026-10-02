import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkRateLimit, getClientIp, isAllowedOrigin } from "@/lib/apiGuard";
import { AI_ACTIVE_COOKIE, AiConfigError, encryptionStatus, readAiProfiles, removeAiProfileCookies, resolveAiConfig, setAiProfileCookies, decryptAiProfile } from "@/lib/aiSettings";
import { AiValidationError, AI_PROVIDER_IDS, isAiProviderId, validateAiProfile } from "@/lib/aiProviders";

export const dynamic = "force-dynamic";

function noStore(response: NextResponse) { response.headers.set("Cache-Control", "no-store"); return response; }
function limited(req: Request, suffix: string) { return checkRateLimit(`ai-settings:${suffix}:${getClientIp(req)}`, 20, 60_000); }

export async function GET(req: Request) {
  if (!isAllowedOrigin(req)) return noStore(NextResponse.json({ error: "Forbidden." }, { status: 403 }));
  try {
    const jar = await cookies();
    const active = jar.get(AI_ACTIVE_COOKIE)?.value;
    const profiles = readAiProfiles(jar);
    let server: { provider: string; model: string; source: "server" } | undefined;
    try { const config = await resolveAiConfig(jar); if (config.source === "server") server = { provider: config.provider, model: config.model, source: "server" }; }
    catch { /* The UI still gets saved metadata and can show the server configuration problem. */ }
    return noStore(NextResponse.json({ providers: AI_PROVIDER_IDS, profiles, active: active && isAiProviderId(active) ? active : null, server, encryption: encryptionStatus() }));
  } catch (error) {
    const message = error instanceof AiConfigError ? error.message : "Settings could not be loaded.";
    return noStore(NextResponse.json({ error: message }, { status: 500 }));
  }
}

export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) return noStore(NextResponse.json({ error: "Forbidden." }, { status: 403 }));
  if (!limited(req, "write")) return noStore(NextResponse.json({ error: "Too many settings requests. Try again shortly." }, { status: 429 }));
  try {
    const body = await req.json() as Record<string, unknown>;
    if (!body || typeof body !== "object" || Array.isArray(body)) return noStore(NextResponse.json({ error: "Invalid settings body." }, { status: 400 }));
    if (!isAiProviderId(body.provider)) return noStore(NextResponse.json({ error: "Unknown AI provider." }, { status: 400 }));
    const jar = await cookies();
    const existing = readAiProfiles(jar).find((profile) => profile.provider === body.provider);
    let apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    if (!apiKey) {
      const raw = jar.get(`eu_ai_profile_${body.provider}`)?.value;
      if (raw) {
        try { apiKey = decryptAiProfile(raw, body.provider).apiKey; } catch { /* require a replacement below */ }
      }
    }
    if (!apiKey) return noStore(NextResponse.json({ error: "Enter an API key the first time you save this provider." }, { status: 400 }));
    const profile = validateAiProfile({ provider: body.provider, model: body.model, apiKey });
    setAiProfileCookies(jar, profile);
    return noStore(NextResponse.json({ provider: profile.provider, model: profile.model, hasKey: true, active: profile.provider, replaced: Boolean(existing) }));
  } catch (error) {
    const message = error instanceof AiConfigError || error instanceof AiValidationError ? error.message : "Invalid settings.";
    return noStore(NextResponse.json({ error: message }, { status: 400 }));
  }
}

export async function DELETE(req: Request) {
  if (!isAllowedOrigin(req)) return noStore(NextResponse.json({ error: "Forbidden." }, { status: 403 }));
  if (!limited(req, "delete")) return noStore(NextResponse.json({ error: "Too many settings requests. Try again shortly." }, { status: 429 }));
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const jar = await cookies();
    if (body.all === true) {
      for (const provider of AI_PROVIDER_IDS) removeAiProfileCookies(jar, provider);
      jar.set(AI_ACTIVE_COOKIE, "", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/api", maxAge: 0 });
    } else if (isAiProviderId(body.provider)) removeAiProfileCookies(jar, body.provider);
    else return noStore(NextResponse.json({ error: "Unknown AI provider." }, { status: 400 }));
    return noStore(NextResponse.json({ ok: true }));
  } catch { return noStore(NextResponse.json({ error: "Settings could not be removed." }, { status: 400 })); }
}
