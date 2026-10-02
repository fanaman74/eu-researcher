/**
 * Monitoring run: snapshot every tracked source and record what changed since the
 * previous run (lib/changeFeed.ts). Invoked by the twice-daily scheduler and /api/cron.
 * A failing source is reported and never aborts the others.
 */
import { recordSnapshot, type SnapshotItem } from "./changeFeed";
import { listRadar } from "./radar";
import { listDossiers } from "./dossiers";
import { listPress } from "./pressCorner";
import { meetingId, recentPeerMeetings } from "./commissionMeetings";
import type { ChangeSource } from "./types";

const MEETING_WINDOW_DAYS = 120; // meetings are often published weeks after they took place
const MEETINGS_URL = "https://data.europa.eu/data/datasets/european-commission-meetings-with-interest-representatives";

export type MonitoringResult = Record<ChangeSource, { items: number; changes: number; baseline: boolean } | { error: string }>;

async function radarSnapshot(): Promise<SnapshotItem[]> {
  return (await listRadar()).map((i) => ({
    externalId: i.id,
    title: i.title,
    url: i.url,
    fields: {
      status: i.status,
      stage: i.stage,
      actType: i.actType,
      plannedPeriod: i.plannedPeriod,
      feedback: i.feedback,
      feedbackEnd: i.feedbackEnd,
    },
  }));
}

async function dossierSnapshot(): Promise<SnapshotItem[]> {
  return (await listDossiers())
    .filter((d) => d.available)
    .map((d) => ({
      externalId: d.id,
      title: `${d.name} — ${d.reference}`,
      url: `/enel/dossiers/${d.id}`,
      fields: {
        stage: d.stage,
        lastActivity: d.lastActivity ? `${d.lastActivity.label} (${d.lastActivity.date})` : null,
        rapporteur: d.actors.filter((a) => a.role === "Rapporteur").map((a) => `${a.name} (${a.group})`).join(", ") || null,
        shadows: String(d.actors.filter((a) => a.role === "Shadow rapporteur").length),
      },
    }));
}

async function pressSnapshot(): Promise<SnapshotItem[]> {
  return (await listPress()).map((p) => ({
    externalId: p.ref,
    title: p.title,
    url: p.url,
    fields: { summary: `${p.stateAid ? "State aid · " : ""}${p.type} ${p.ref}, ${p.date}` },
  }));
}

async function meetingSnapshot(): Promise<SnapshotItem[]> {
  const since = new Date(Date.now() - MEETING_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
  return (await recentPeerMeetings(since)).map((m) => ({
    externalId: meetingId(m),
    title: `${m.peers.join(", ")} met ${m.host}`,
    url: MEETINGS_URL,
    fields: { summary: `${m.date}: ${m.subject || "no subject given"}` },
  }));
}

const SOURCES: { source: ChangeSource; load: () => Promise<SnapshotItem[]>; labels: Record<string, string> }[] = [
  {
    source: "radar",
    load: radarSnapshot,
    labels: {
      status: "Status",
      stage: "Stage",
      actType: "Act type",
      plannedPeriod: "Planned adoption",
      feedback: "Feedback",
      feedbackEnd: "Feedback deadline",
    },
  },
  {
    source: "dossier",
    load: dossierSnapshot,
    labels: { stage: "Stage", lastActivity: "Latest activity", rapporteur: "Rapporteur", shadows: "Shadow rapporteurs" },
  },
  // Press items and meetings do not change once published; only their arrival is recorded.
  { source: "press", load: pressSnapshot, labels: {} },
  { source: "meeting", load: meetingSnapshot, labels: {} },
];

export async function runMonitoring(): Promise<MonitoringResult> {
  const result = {} as MonitoringResult;
  for (const { source, load, labels } of SOURCES) {
    try {
      const items = await load();
      const { baseline, changes } = await recordSnapshot(source, items, {
        labels,
        describeNew: (i) => i.fields.summary ?? Object.entries(labels).map(([k, label]) => `${label}: ${i.fields[k] ?? "none"}`).join("; "),
      });
      result[source] = { items: items.length, changes, baseline };
    } catch (err) {
      console.error(`[Monitor] ${source} failed:`, err);
      result[source] = { error: err instanceof Error ? err.message : String(err) };
    }
  }
  return result;
}
