import { beforeEach, describe, expect, it } from "vitest";
import { decryptAiProfile, encryptAiProfile, readAiProfiles, resolveAiConfig, setAiProfileCookies } from "../lib/aiSettings";
import { validateAiProfile } from "../lib/aiProviders";

type Store = { values: Map<string, { value: string }>; get: (name: string) => { value: string } | undefined; set: (name: string, value: string, options?: Record<string, unknown>) => void };
const store = (): Store => {
  const values = new Map<string, { value: string }>();
  return { values, get: (name) => values.get(name), set: (name, value) => values.set(name, { value }) };
};

beforeEach(() => { process.env.AI_SETTINGS_SECRET = "test-encryption-secret-that-is-long-enough"; });

describe("AI settings encryption", () => {
  it("round-trips a profile without exposing plaintext in the cookie", () => {
    const profile = { provider: "openai" as const, model: "gpt-test", apiKey: "sk-test-key" };
    const encrypted = encryptAiProfile(profile);
    expect(encrypted).not.toContain(profile.apiKey);
    expect(decryptAiProfile(encrypted, "openai")).toMatchObject(profile);
  });

  it("rejects tampering and copying a cookie to another provider slot", () => {
    const encrypted = encryptAiProfile({ provider: "deepseek", model: "deepseek-test", apiKey: "secret" });
    expect(() => decryptAiProfile(`${encrypted}x`, "deepseek")).toThrow(/invalid or expired/i);
    expect(() => decryptAiProfile(encrypted, "openrouter")).toThrow(/invalid or expired/i);
  });

  it("keeps profiles isolated and resolves only the active profile", async () => {
    const jar = store();
    setAiProfileCookies(jar, { provider: "openrouter", model: "or-test", apiKey: "or-key" });
    setAiProfileCookies(jar, { provider: "anthropic", model: "claude-test", apiKey: "claude-key" });
    expect(readAiProfiles(jar)).toHaveLength(2);
    expect((await resolveAiConfig(jar)).provider).toBe("anthropic");
    expect((await resolveAiConfig(jar)).apiKey).toBe("claude-key");
  });
});

describe("AI profile validation", () => {
  it("rejects controls, oversized fields, and unknown providers", () => {
    expect(() => validateAiProfile({ provider: "openai", model: "bad\nmodel", apiKey: "secret" })).toThrow();
    expect(() => validateAiProfile({ provider: "openai", model: "m", apiKey: "x".repeat(513) })).toThrow();
    expect(() => validateAiProfile({ provider: "other", model: "m", apiKey: "secret" })).toThrow();
  });
});
