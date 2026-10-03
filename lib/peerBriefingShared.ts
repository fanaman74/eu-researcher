import type { PeerPosition } from "./types";

export type PeerBriefing = {
  position: string;
  relevance: string;
  followUp: string;
  sourceCoverage: "text" | "text+attachments" | "attachments" | "text+unread-attachments" | "text+partial-attachments" | "attachments+unread" | "attachments+partial" | "insufficient";
  provenance: "AI-written" | "Extractive source brief";
  attachmentCount: number;
  readableAttachmentCount: number;
};

/** Stable source identity used to prevent a delayed batch applying to shifted results. */
export function peerPositionKey(position: PeerPosition): string {
  return JSON.stringify([position.organization, position.date, position.publication, position.text, position.attachments.map((attachment) => [attachment.fileName, attachment.url, attachment.pages])]);
}

const TOPICS: Array<[RegExp, string, string]> = [
  [/f-gas|fluorinated|hfc|refrigerant|cooling/i, "fluorinated gases, refrigerants and cooling equipment", "Ask engineering and procurement to map exposure to refrigerant supply, equipment availability and substitution or servicing requirements."],
  [/nuclear|reactor|radioactive/i, "nuclear generation and its operating constraints", "Ask the relevant generation and engineering teams to test whether the stated constraint affects licensing, maintenance, cooling or investment assumptions."],
  [/hydrogen|methane|gas infrastructure|lng/i, "gas and emerging fuel infrastructure", "Ask the gas and transition policy teams to compare the proposal with Enel's infrastructure, investment and decarbonisation assumptions."],
  [/grid|network|transmission|distribution|connection/i, "networks and connection delivery", "Ask grid affairs and delivery teams to identify permitting, connection, procurement or cost risks that need evidence in the Commission process."],
  [/renewable|wind|solar|storage|battery/i, "renewables and flexibility deployment", "Ask renewables and market teams to check the proposed requirements against project timing, supply chains and flexibility investments."],
];

function clean(text: string) { return text.replace(/\s+/g, " ").trim(); }
function sentences(text: string): string[] { return clean(text).split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((s) => s.trim()).filter((s) => s.length >= 35); }
function topicFor(text: string): [string, string] {
  return TOPICS.find(([pattern]) => pattern.test(text))?.slice(1) as [string, string] ?? ["the consultation's stated policy and implementation issues", "Ask the responsible policy and operating teams to validate the concrete cost, delivery and compliance implications before engaging the Commission."];
}
function bestEvidence(text: string): string {
  const list = sentences(text);
  if (!list.length) return clean(text).slice(0, 620) || "The published response does not contain enough readable prose to state the organisation's position safely.";
  const scored = list.map((s, i) => ({ s, score: TOPICS.reduce((n, [p]) => n + (p.test(s) ? 3 : 0), 0) + (/(recommend|support|oppose|concern|request|call for|should|must|impact|cost|supply|shortage)/i.test(s) ? 2 : 0) - i * 0.01 }));
  return scored.sort((a, b) => b.score - a.score).slice(0, 2).map(({ s }) => s).join(" ").slice(0, 620);
}

export function extractivePeerBriefing(position: PeerPosition, attachmentText = "", unreadAttachments = false, readableAttachmentCount = attachmentText ? 1 : 0): PeerBriefing {
  const source = clean([position.text, attachmentText].filter(Boolean).join(" "));
  const [topic, followUp] = topicFor(source);
  const evidence = bestEvidence(source);
  const pointerPattern = /please\s+see\s+(the\s+)?attached|please\s+see\s+(here\s+)?(our\s+)?recommendations?|see\s+(the\s+)?annex|attached\s+(document|paper)\s+for/i;
  const pointerRemainder = position.text
    .replace(new RegExp(`(?:${pointerPattern.source})[^.!?]*[.!?]?`, "gi"), "")
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !(/\bwelcomes? the opportunity\b/i.test(sentence) && !/\b(requests?|calls? for|urges?|should|must|recommends?|supports?|opposes?|concerns?)\b/i.test(sentence)))
    .join("").replace(/[\s:;,.!?-]/g, "");
  const attachmentOnlyPointer = !attachmentText && position.attachments.length > 0 && pointerPattern.test(position.text) && !pointerRemainder;
  const unreadOnly = !source || attachmentOnlyPointer;
  const positionText = unreadOnly
    ? position.attachments.length
      ? `The published feedback from ${position.organization} points to an attachment, but its substantive position cannot be assessed from the readable record.`
      : `The published feedback from ${position.organization} contains no readable substantive text, so its position cannot be assessed from this record.`
    : `${position.organization} focuses on ${topic}. ${evidence}`;
  const relevance = unreadOnly ? position.attachments.length ? "Enel EU-affairs relevance is unassessable until the referenced attachment can be read." : "Enel EU-affairs relevance cannot be assessed because no readable substantive material was published." : `For Enel EU affairs, this is a monitoring lead on ${topic}. Treat the organisation's rationale as its own position; compare it with Enel's exposure and response before drawing alignment conclusions.`;
  const actualFollowUp = unreadOnly && position.attachments.length ? "Open the referenced position paper and capture its concrete recommendation, evidence and implementation concerns before using this response." : unreadOnly ? "Check whether the Commission has a separate public filing before treating this record as a substantive position." : followUp;
  const sourceCoverage = position.text && unreadAttachments && readableAttachmentCount > 0 ? "text+partial-attachments" : position.text && unreadAttachments ? "text+unread-attachments" : position.text && readableAttachmentCount > 0 ? "text+attachments" : position.text ? "text" : unreadAttachments && readableAttachmentCount > 0 ? "attachments+partial" : readableAttachmentCount > 0 ? "attachments" : "insufficient";
  return { position: positionText, relevance, followUp: actualFollowUp, sourceCoverage, provenance: "Extractive source brief", attachmentCount: position.attachments.length, readableAttachmentCount };
}
