import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchOfficeNews, toOfficeNewsItem } from "../lib/officeNews";
import { fetchPressFromCommission, toPressItem } from "../lib/pressCorner";
import { getOfficeNewsResponse, nextOfficeNewsSlot } from "../lib/officeNewsSchedule";
import type { PressItem } from "../lib/types";

const press = (overrides: Partial<PressItem> = {}): PressItem => ({
  ref: "IP-2026-100",
  title: "Commission announces new grid upgrade for renewable electricity",
  lead: "The Commission published a grid and renewable energy network announcement.",
  date: "2026-10-02T10:00:00Z",
  type: "Press release",
  stateAid: false,
  url: "https://ec.europa.eu/commission/presscorner/detail/en/IP_26_100",
  ...overrides,
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("office news normalization", () => {
  it("classifies priority topics and grounds action fields in the source lead", () => {
    const item = toOfficeNewsItem(press());
    expect(item).not.toBeNull();
    expect(item?.category).toBe("grids");
    expect(item?.summary).toContain("grid and renewable");
    expect(item?.whyItMatters).toContain("grid and network policy");
    expect(item?.action).toContain("infrastructure scope");
    expect(toOfficeNewsItem(press({ title: "Commission discusses G7 energy security", lead: "Energy security and market context." }))?.category).toBe("energy-policy");
  });

  it("drops non-priority, malformed and duplicate records and sorts newest first", async () => {
    const payload = (docs: unknown[]) => ({ docuLanguageListResources: docs });
    const docs = [
      { title: "Unrelated agriculture announcement", leadText: "Farm policy", eventDate: "2026-10-02", refCode: "IP-1", docutype: { description: "Release" } },
      { title: "State aid approved for electricity networks", leadText: "Aid scheme details", eventDate: "2026-10-02T12:00:00Z", refCode: "IP-2", docutype: { description: "Release" } },
      { title: "State aid approved for electricity networks", leadText: "Aid scheme details", eventDate: "2026-10-02T12:00:00Z", refCode: "IP-2", docutype: { description: "Release" } },
      { title: "Solar funding", leadText: "Renewable grant", eventDate: "2026-09-20T12:00:00Z", refCode: "IP-3", docutype: { description: "Release" } },
    ];
    expect(toPressItem(docs[1])).not.toBeNull();
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({
      ok: true,
      json: async () => payload(url.includes("pagenumber=1") ? docs : []),
    })));
    const fetched = await fetchPressFromCommission();
    expect(fetched.map((item) => item.ref)).toEqual(["IP-2", "IP-3"]);
    const items = await fetchOfficeNews(new Date("2026-10-03T00:00:00Z"));
    expect(items.map((item) => item.id)).toEqual(["IP-2", "IP-3"]);
    expect(items[0].category).toBe("state-aid");
  });
});

describe("Brussels office news schedule", () => {
  it("handles exact boundaries and the following-day 07:00 slot", () => {
    expect(nextOfficeNewsSlot(new Date("2026-10-03T05:00:00Z")).toISOString()).toBe("2026-10-03T10:00:00.000Z"); // 07:00 -> 12:00 local
    expect(nextOfficeNewsSlot(new Date("2026-10-03T10:00:00Z")).toISOString()).toBe("2026-10-03T15:00:00.000Z"); // 12:00 -> 17:00 local
    expect(nextOfficeNewsSlot(new Date("2026-10-03T15:00:00Z")).toISOString()).toBe("2026-10-04T05:00:00.000Z"); // 17:00 -> next 07:00 local
  });

  it("follows Brussels DST in spring and autumn", () => {
    expect(nextOfficeNewsSlot(new Date("2026-03-28T16:30:00Z")).toISOString()).toBe("2026-03-29T05:00:00.000Z");
    expect(nextOfficeNewsSlot(new Date("2026-10-24T16:30:00Z")).toISOString()).toBe("2026-10-25T06:00:00.000Z");
  });

  it("reports unavailable when the first scheduled source attempt fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Commission unavailable"); }));
    const response = await getOfficeNewsResponse(new Date("2026-10-02T05:00:00Z"));
    expect(response.status).toBe("unavailable");
    expect(response.items).toEqual([]);
    expect(response.checkedAt).toBeNull();
    expect(response.attemptedAt).toBe("2026-10-02T05:00:00.000Z");
  });

  it("shares concurrent refreshes and preserves the last good snapshot after a source failure", async () => {
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      calls++;
      return { ok: true, json: async () => ({ docuLanguageListResources: [{
        title: "Grid investment announcement", leadText: "Commission grid funding", eventDate: "2026-10-03T05:00:00Z", refCode: "IP-CONCURRENT", docutype: { description: "Release" },
      }] }) };
    }));
    const atSeven = new Date("2026-10-03T05:00:00Z");
    const [first, second] = await Promise.all([getOfficeNewsResponse(atSeven), getOfficeNewsResponse(atSeven)]);
    expect(calls).toBe(3);
    expect(first.status).toBe("live");
    expect(second.items[0].id).toBe("IP-CONCURRENT");
    const checkedAt = first.checkedAt;

    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Commission unavailable"); }));
    const failed = await getOfficeNewsResponse(new Date("2026-10-03T10:00:00Z"));
    const repeated = await getOfficeNewsResponse(new Date("2026-10-03T10:00:00Z"));
    expect(failed.status).toBe("stale");
    expect(failed.items[0].id).toBe("IP-CONCURRENT");
    expect(failed.checkedAt).toBe(checkedAt);
    expect(failed.attemptedAt).toBe("2026-10-03T10:00:00.000Z");
    expect(repeated.attemptedAt).toBe(failed.attemptedAt);

    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ docuLanguageListResources: [] }),
    })));
    const empty = await getOfficeNewsResponse(new Date("2026-10-03T15:00:00Z"));
    expect(empty.status).toBe("live");
    expect(empty.items).toEqual([]);
    const emptyCheckedAt = empty.checkedAt;

    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Commission unavailable again"); }));
    const emptyFailed = await getOfficeNewsResponse(new Date("2026-10-04T05:00:00Z"));
    expect(emptyFailed.status).toBe("stale");
    expect(emptyFailed.items).toEqual([]);
    expect(emptyFailed.checkedAt).toBe(emptyCheckedAt);
  });
});
