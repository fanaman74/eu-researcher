"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, KeyRound, RotateCw, Trash2 } from "lucide-react";
import { AI_PROVIDERS, AI_PROVIDER_IDS, type AiProviderId } from "@/lib/aiProviders";
import { Badge, Button, Card, ExternalLink as ExternalAnchor, Field, Loading, Notice, Page, inputClass } from "@/components/ui";

type Profile = { provider: AiProviderId; model: string; hasKey: true };
type SettingsData = { profiles: Profile[]; active: AiProviderId | null; server?: { provider: AiProviderId; model: string; source: "server" }; encryption?: { stable: boolean; warning?: string }; };

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [provider, setProvider] = useState<AiProviderId>("openrouter");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"save" | "test" | "remove" | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "danger" | "info"; text: string } | null>(null);

  const selectedProfile = useMemo(() => data?.profiles.find((p) => p.provider === provider), [data, provider]);

  const load = async (clearMessage = true) => {
    setLoading(true);
    if (clearMessage) setMessage(null);
    try {
      const response = await fetch("/api/ai/settings", { cache: "no-store" });
      const json = await response.json() as SettingsData & { error?: string };
      if (!response.ok) throw new Error(json.error || "Settings could not be loaded.");
      setData(json);
      const next = json.active && AI_PROVIDER_IDS.includes(json.active) ? json.active : "openrouter";
      setProvider(next);
      const saved = json.profiles.find((p) => p.provider === next);
      setModel(saved?.model || (next === "openrouter" ? json.server?.model || "" : ""));
    } catch (error) { setMessage({ tone: "danger", text: error instanceof Error ? error.message : "Settings could not be loaded." }); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const chooseProvider = (next: AiProviderId) => {
    setProvider(next);
    const saved = data?.profiles.find((p) => p.provider === next);
    setModel(saved?.model || (next === "openrouter" ? data?.server?.model || "" : ""));
    setApiKey("");
    setMessage(null);
  };

  const save = async () => {
    setBusy("save"); setMessage(null);
    try {
      const response = await fetch("/api/ai/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, model, apiKey }) });
      const json = await response.json() as { error?: string };
      if (!response.ok) throw new Error(json.error || "Settings could not be saved.");
      setApiKey("");
      setMessage({ tone: "success", text: `${AI_PROVIDERS[provider].label} is saved and active for this browser.` });
      await load(false);
    } catch (error) { setMessage({ tone: "danger", text: error instanceof Error ? error.message : "Settings could not be saved." }); }
    finally { setBusy(null); }
  };

  const test = async () => {
    setBusy("test"); setMessage(null);
    try {
      const response = await fetch("/api/ai/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, model, apiKey }) });
      const json = await response.json() as { error?: string };
      if (!response.ok) throw new Error(json.error || "Connection test failed.");
      setMessage({ tone: "success", text: "Connection succeeded. The draft settings are still unsaved." });
    } catch (error) { setMessage({ tone: "danger", text: error instanceof Error ? error.message : "Connection test failed." }); }
    finally { setBusy(null); }
  };

  const remove = async () => {
    setBusy("remove"); setMessage(null);
    try {
      const response = await fetch("/api/ai/settings", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider }) });
      const json = await response.json() as { error?: string };
      if (!response.ok) throw new Error(json.error || "Saved settings could not be removed.");
      setApiKey(""); setMessage({ tone: "info", text: `${AI_PROVIDERS[provider].label} was removed from this browser.` }); await load(false);
    } catch (error) { setMessage({ tone: "danger", text: error instanceof Error ? error.message : "Saved settings could not be removed." }); }
    finally { setBusy(null); }
  };

  if (loading && !data) return <Page title="Settings" description="Choose the AI provider used by this browser."><Loading message="Loading AI settings…" /></Page>;
  const meta = AI_PROVIDERS[provider];
  const activeProfile = data?.profiles.find((profile) => profile.provider === data.active);
  const currentMeta = data?.active ? AI_PROVIDERS[data.active] : data?.server?.provider ? AI_PROVIDERS[data.server.provider] : null;

  return (
    <Page title="Settings" description="Choose the AI provider and model used by this browser. Your API keys stay protected and personal to this browser.">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div className="space-y-8">
          {message && <Notice tone={message.tone}>{message.text}</Notice>}
          {data?.encryption?.warning && <Notice tone="warning">{data.encryption.warning}</Notice>}
          <Card title="AI provider" description="Select a provider, then enter its model ID exactly as that provider documents it.">
            <fieldset className="space-y-3">
              <legend className="sr-only">AI provider</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {AI_PROVIDER_IDS.map((id) => {
                  const item = AI_PROVIDERS[id];
                  const saved = data?.profiles.some((profile) => profile.provider === id);
                  return <label key={id} className={`flex min-h-16 cursor-pointer items-start gap-3 border p-3 transition-colors ${provider === id ? "border-fg bg-sunken" : "border-line-strong hover:bg-sunken"}`}>
                    <input type="radio" name="provider" value={id} checked={provider === id} onChange={() => chooseProvider(id)} disabled={Boolean(busy)} className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
                    <span className="min-w-0"><span className="block font-semibold text-fg">{item.label}</span><span className="block text-sm text-muted">{item.description}</span>{saved && <Badge tone="success">Saved</Badge>}</span>
                  </label>;
                })}
              </div>
            </fieldset>
          </Card>

          <Card title={`Configure ${meta.label}`} description="The API key is write-only. Leave it blank to keep the saved key for this provider.">
            <div className="space-y-5">
              <Field label="Model ID" hint="Enter the model ID provided by your provider.">{(p) => <input {...p} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Enter a model ID" className={inputClass} autoComplete="off" disabled={Boolean(busy)} />}</Field>
              <Field label="API key" hint={<span>Use an API key issued by {meta.label}. For OpenAI, a ChatGPT subscription does not include API credit. <ExternalAnchor href={meta.docsUrl}>Open provider documentation</ExternalAnchor>.</span>}>{(p) => <input {...p} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={selectedProfile ? "Saved key retained; enter a new key to replace it" : "Paste an API key"} type="password" autoComplete="new-password" className={inputClass} disabled={Boolean(busy)} />}</Field>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="primary" onClick={save} loading={busy === "save"} disabled={Boolean(busy)}><Check className="h-4 w-4" aria-hidden="true" /> Save and use</Button>
                <Button onClick={test} loading={busy === "test"} disabled={Boolean(busy) || !model || (!apiKey && !selectedProfile)}><RotateCw className="h-4 w-4" aria-hidden="true" /> Test connection</Button>
                {selectedProfile && <Button variant="ghost" onClick={remove} loading={busy === "remove"} disabled={Boolean(busy)}><Trash2 className="h-4 w-4" aria-hidden="true" /> Remove saved provider</Button>}
              </div>
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Current selection" padded={false}>
            <dl className="divide-y divide-line border-y border-line">
              <div className="grid grid-cols-[7rem_1fr] gap-3 py-3 text-sm"><dt className="text-subtle">Provider</dt><dd className="font-semibold text-fg">{currentMeta?.label || "Server default"}</dd></div>
              <div className="grid grid-cols-[7rem_1fr] gap-3 py-3 text-sm"><dt className="text-subtle">Model</dt><dd className="break-all text-fg">{activeProfile?.model || data?.server?.model || "Not configured"}</dd></div>
              <div className="grid grid-cols-[7rem_1fr] gap-3 py-3 text-sm"><dt className="text-subtle">Source</dt><dd className="text-fg">{activeProfile ? "Personal browser setting" : "Server default"}</dd></div>
            </dl>
          </Card>
          <div className="border-t border-line pt-4 text-sm text-muted space-y-2">
            <p className="flex gap-2"><KeyRound className="h-4 w-4 mt-0.5 shrink-0 text-subtle" aria-hidden="true" /> Each provider has its own protected setting. Switching providers never transfers a key.</p>
            <p>Personal settings belong to this browser and are not shared with another visitor.</p>
          </div>
        </aside>
      </div>
    </Page>
  );
}
