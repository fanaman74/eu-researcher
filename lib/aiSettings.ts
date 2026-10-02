import { cookies } from "next/headers";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { AI_PROVIDER_IDS, isAiProviderId, validateAiProfile, type AiProviderId } from "./aiProviders";

export const AI_COOKIE_PREFIX = "eu_ai_profile_";
export const AI_ACTIVE_COOKIE = "eu_ai_active";
export const AI_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const COOKIE_PATTERN = /^[a-z]+$/;

export type AiProfile = { provider: AiProviderId; model: string; apiKey: string };
export type AiProfileMetadata = { provider: AiProviderId; model: string; hasKey: true };
export type AiSource = "personal" | "server";
export type ResolvedAiConfig = AiProfile & { source: AiSource };

export class AiConfigError extends Error {
  code: "missing" | "invalid" | "security";
  source?: AiSource;
  constructor(message: string, code: "missing" | "invalid" | "security" = "invalid", source?: AiSource) {
    super(message); this.name = "AiConfigError"; this.code = code; this.source = source;
  }
}

type CookieStore = { get(name: string): { value: string } | undefined; set: (name: string, value: string, options?: Record<string, unknown>) => void; delete?: (name: string) => void };

function cookieName(provider: AiProviderId) { return `${AI_COOKIE_PREFIX}${provider}`; }

function configuredSecret(): { value: string; stable: boolean } {
  const explicit = process.env.AI_SETTINGS_SECRET?.trim();
  if (explicit && explicit.length < 32) throw new AiConfigError("AI_SETTINGS_SECRET must be at least 32 characters.", "security", "server");
  const candidate = explicit || process.env.OPENROUTER_API_KEY?.trim();
  if (candidate && candidate.length >= 32 && !candidate.includes("[YOUR_") && !candidate.toLowerCase().includes("placeholder") && !/^your[_-]/i.test(candidate)) return { value: candidate, stable: true };
  const root = globalThis as typeof globalThis & { __euAiEphemeralSecret?: string };
  if (!root.__euAiEphemeralSecret) root.__euAiEphemeralSecret = randomBytes(32).toString("base64url");
  return { value: root.__euAiEphemeralSecret, stable: false };
}

export function encryptionStatus() {
  const configured = configuredSecret();
  return { stable: configured.stable, warning: configured.stable ? undefined : "Saved connections may need to be entered again after the server restarts." };
}

function keyBytes() { return createHash("sha256").update(`eu-researcher:ai-settings:v1:${configuredSecret().value}`).digest(); }

export function encryptAiProfile(profile: AiProfile): string {
  const normalized = validateAiProfile(profile);
  const expiresAt = Date.now() + AI_COOKIE_MAX_AGE * 1000;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBytes(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify({ ...normalized, expiresAt }), "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptAiProfile(value: string, expectedProvider?: AiProviderId): AiProfile {
  try {
    const [version, ivText, tagText, ciphertextText] = value.split(".");
    if (version !== "v1" || !ivText || !tagText || !ciphertextText) throw new Error("format");
    const decipher = createDecipheriv("aes-256-gcm", keyBytes(), Buffer.from(ivText, "base64url"));
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextText, "base64url")), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(plaintext) as { expiresAt?: number };
    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) throw new Error("expired");
    const profile = validateAiProfile(parsed);
    if (expectedProvider && profile.provider !== expectedProvider) throw new Error("provider");
    return profile;
  } catch { throw new AiConfigError("This saved AI setting is invalid or expired. Save it again.", "invalid", "personal"); }
}

function cookieOptions() { return { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/api", maxAge: AI_COOKIE_MAX_AGE } as const; }

export function setAiProfileCookies(store: CookieStore, profile: AiProfile) {
  const encrypted = encryptAiProfile(profile);
  if (encrypted.length > 3900) throw new AiConfigError("This API key is too large to save securely.", "invalid");
  store.set(cookieName(profile.provider), encrypted, cookieOptions());
  store.set(AI_ACTIVE_COOKIE, profile.provider, cookieOptions());
}

export function removeAiProfileCookies(store: CookieStore, provider: AiProviderId) {
  store.set(cookieName(provider), "", { ...cookieOptions(), maxAge: 0 });
  const active = store.get(AI_ACTIVE_COOKIE)?.value;
  if (active === provider) store.set(AI_ACTIVE_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

export function readAiProfiles(store: CookieStore): AiProfileMetadata[] {
  const result: AiProfileMetadata[] = [];
  for (const provider of AI_PROVIDER_IDS) {
    const raw = store.get(cookieName(provider))?.value;
    if (!raw) continue;
    try {
      const profile = decryptAiProfile(raw, provider);
      result.push({ provider: profile.provider, model: profile.model, hasKey: true });
    } catch { /* Tampered cookies are treated as absent in metadata; resolution remains explicit. */ }
  }
  return result;
}

function envProfile(provider: AiProviderId): AiProfile {
  const keyName: Record<AiProviderId, string> = { openrouter: "OPENROUTER_API_KEY", openai: "OPENAI_API_KEY", anthropic: "ANTHROPIC_API_KEY", deepseek: "DEEPSEEK_API_KEY" };
  const key = process.env[keyName[provider]]?.trim();
  if (!key || key.includes("[YOUR_") || key.toLowerCase().includes("placeholder")) throw new AiConfigError("The selected AI provider is not configured on this server.", "missing", "server");
  const model = provider === "openrouter" ? (process.env.OPENROUTER_MODEL || "deepseek/deepseek-v4-flash-0731") : (process.env[`${provider.toUpperCase()}_MODEL`] || "");
  if (!model) throw new AiConfigError("Set a model for this provider in the personal settings page.", "missing", "server");
  return { provider, model, apiKey: key };
}

export async function resolveAiConfig(store?: CookieStore): Promise<ResolvedAiConfig> {
  const jar = store ?? await cookies() as unknown as CookieStore;
  const active = jar.get(AI_ACTIVE_COOKIE)?.value;
  if (active) {
    if (!isAiProviderId(active)) throw new AiConfigError("The saved AI provider selection is invalid. Save it again.", "invalid", "personal");
    const raw = jar.get(cookieName(active))?.value;
    if (!raw) throw new AiConfigError("The saved AI provider is unavailable. Save its API key again.", "invalid", "personal");
    return { ...decryptAiProfile(raw, active), source: "personal" };
  }
  const provider = isAiProviderId(process.env.AI_PROVIDER) ? process.env.AI_PROVIDER : "openrouter";
  return { ...envProfile(provider), source: "server" };
}

export function getCookieName(provider: AiProviderId) { if (!COOKIE_PATTERN.test(provider)) throw new Error("Invalid provider"); return cookieName(provider); }
