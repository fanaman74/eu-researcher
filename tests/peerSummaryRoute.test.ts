import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(), positions: vi.fn(),
  ConfigError: class extends Error { code = "missing"; source = "server"; },
  ProviderError: class extends Error { category = "unavailable"; },
}));
vi.mock("@/lib/llm", () => ({ createAiClientForRequest: mocks.create, AiProviderError: mocks.ProviderError }));
vi.mock("@/lib/aiSettings", () => ({ AiConfigError: mocks.ConfigError }));
vi.mock("@/lib/peers", () => ({ getPeerPositions: mocks.positions }));

import { POST } from "../app/api/peer-summary/route";
import { extractivePeerBriefing } from "../lib/peerBriefingShared";

const position = (overrides: Record<string, unknown> = {}) => ({
  peer: "EDF", organization: "EDF", country: "France", userType: "company", date: "2026-01-01",
  text: "EDF raises concerns about F-gas and HFC refrigerant shortages affecting industrial and nuclear cooling equipment. It requests implementation that accounts for supply constraints and practical substitution timelines.",
  transparencyId: "id", attachments: [], publication: "Public consultation", ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Attachment fixture unavailable"); }));
  mocks.positions.mockResolvedValue({ title: "Consultation", url: "https://ec.europa.eu/info/law/better-regulation/have-your-say/initiatives/16872", scanned: 1, published: 1, positions: [position()] });
  mocks.create.mockRejectedValue(new mocks.ConfigError("not configured"));
});

afterEach(() => vi.unstubAllGlobals());

function request(body: unknown, headers?: Record<string, string>) {
  return new Request("https://app.example/api/peer-summary", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
}

describe("peer summary route", () => {
  it("returns a grounded extractive EDF brief when AI is unavailable", async () => {
    const response = await POST(request({ pid: "16872", indices: [0] }));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.summaries[0].summary.provenance).toBe("Extractive source brief");
    expect(json.summaries[0].summary.position).toMatch(/F-gas|refrigerant/i);
    expect(json.summaries[0].summary.followUp).toMatch(/supply|refrigerant/i);
  });

  it("does not discard substantive text merely because it references an attachment", async () => {
    mocks.positions.mockResolvedValueOnce({ title: "Consultation", url: "https://ec.europa.eu/x", scanned: 1, published: 1, positions: [position({ text: "EDF opposes the proposed timing because refrigerant supply constraints create material cooling risks. Please see attached evidence." })] });
    const response = await POST(request({ pid: "16872", indices: [0] }));
    const json = await response.json();
    expect(json.summaries[0].summary.position).toMatch(/refrigerant|cooling/i);
    expect(json.summaries[0].summary.relevance).not.toMatch(/unassessable/i);
  });

  it("does not invent substance from an attachment-only pointer", async () => {
    mocks.positions.mockResolvedValueOnce({ title: "Consultation", url: "https://ec.europa.eu/x", scanned: 1, published: 1, positions: [position({ organization: "Eurogas", text: "Eurogas welcomes the opportunity to contribute to the Commissions initiative on the simplification of energy efficient products legislation. Please see attached our recommendations.", attachments: [{ fileName: "recommendations.pdf", url: "https://ec.europa.eu/info/law/better-regulation/api/download/recommendations", pages: 2 }] })] });
    const response = await POST(request({ pid: "16872", indices: [0] }));
    const summary = (await response.json()).summaries[0].summary;
    expect(summary.position).toMatch(/cannot be assessed/i);
    expect(summary.relevance).toMatch(/unassessable/i);
  });

  it("rejects invalid identifiers and oversized batches before source work", async () => {
    expect((await POST(request({ pid: "https://evil.test", indices: [0] }))).status).toBe(400);
    expect((await POST(request({ pid: "16872", indices: [0, 1, 2, 3, 4] }))).status).toBe(400);
    expect(mocks.positions).not.toHaveBeenCalled();
  });

  it("rejects null and non-object JSON bodies", async () => {
    const nullBody = new Request("https://app.example/api/peer-summary", { method: "POST", body: "null" });
    const arrayBody = new Request("https://app.example/api/peer-summary", { method: "POST", body: "[]" });
    expect((await POST(nullBody)).status).toBe(400);
    expect((await POST(arrayBody)).status).toBe(400);
  });

  it("uses a keyed AI result and falls back when the model returns the wrong count", async () => {
    const complete = vi.fn().mockResolvedValue({ content: JSON.stringify([{ responseIndex: 0, position: "EDF requests practical treatment of refrigerant supply constraints.", relevance: "Monitor cooling equipment exposure.", followUp: "Ask procurement to validate supply risk." }]) });
    mocks.create.mockResolvedValueOnce({ complete });
    const aiResponse = await POST(request({ pid: "16872", indices: [0] }));
    const aiJson = await aiResponse.json();
    expect(aiJson.summaries[0].summary.provenance).toBe("AI-written");
    expect(complete.mock.calls[0][0][1].content).toMatch(/Consultation title: Consultation/);

    mocks.create.mockResolvedValueOnce({ complete: vi.fn().mockResolvedValue({ content: "[]" }) });
    const fallbackResponse = await POST(request({ pid: "16872", indices: [0] }));
    expect((await fallbackResponse.json()).summaries[0].summary.provenance).toBe("Extractive source brief");
  });

  it("falls back after an AI provider failure and reports partial attachment coverage", async () => {
    mocks.create.mockRejectedValueOnce(new mocks.ProviderError("provider down"));
    const response = await POST(request({ pid: "16872", indices: [0] }));
    expect((await response.json()).summaries[0].summary.provenance).toBe("Extractive source brief");
    const partial = extractivePeerBriefing(position({ attachments: [{ fileName: "a.pdf", url: "https://ec.europa.eu/info/law/better-regulation/api/download/a", pages: 1 }, { fileName: "b.pdf", url: "https://ec.europa.eu/info/law/better-regulation/api/download/b", pages: 1 }] }), "Readable recommendation text.", true, 1);
    expect(partial.sourceCoverage).toBe("text+partial-attachments");
    expect(partial.readableAttachmentCount).toBe(1);
  });

  it("does not fetch an attachment outside the Commission download allowlist", async () => {
    mocks.positions.mockResolvedValueOnce({ title: "Consultation", url: "https://ec.europa.eu/x", scanned: 1, published: 1, positions: [position({ attachments: [{ fileName: "paper.pdf", url: "https://evil.test/paper.pdf", pages: 2 }] })] });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(request({ pid: "16872", indices: [0] }));
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(json.summaries[0].summary.sourceCoverage).toBe("text+unread-attachments");
    vi.unstubAllGlobals();
  });

  it("marks oversized attachment streams unread and uses redirect:error", async () => {
    mocks.positions.mockResolvedValueOnce({ title: "Consultation", url: "https://ec.europa.eu/x", scanned: 1, published: 1, positions: [position({ attachments: [{ fileName: "paper.pdf", url: "https://ec.europa.eu/info/law/better-regulation/api/download/document", pages: 2 }] })] });
    const fetchMock = vi.fn(async (url: string, options: RequestInit) => { void url; void options; return new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(6 * 1024 * 1024 + 1)); controller.close(); } }), { status: 200, headers: { "content-type": "application/pdf" } }); });
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(request({ pid: "16872", indices: [0] }));
    const json = await response.json();
    expect(json.summaries[0].summary.sourceCoverage).toBe("text+unread-attachments");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: "error" });
    vi.unstubAllGlobals();
  });

  it("enforces same-origin browser requests", async () => {
    const response = await POST(request({ pid: "16872", indices: [0] }, { origin: "https://other.example", host: "app.example" }));
    expect(response.status).toBe(403);
    expect(mocks.positions).not.toHaveBeenCalled();
  });
});
