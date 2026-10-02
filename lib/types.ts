/**
 * Shared type definitions for the EU Researcher platform.
 * Import from this file instead of defining types locally in each page.
 */

/** A single log entry from a SPARQL search performed by the chat LLM. */
export interface SearchLog {
  q: string;
  namespace: string;
  top_k: number;
  success: boolean;
  resultsCount: number;
  results: EurLexHit[];
}

/** A chat message exchanged between the user and the AI assistant. */
export interface Message {
  role: "user" | "assistant";
  content: string;
  searchLogs?: SearchLog[];
}

/** A single document hit returned from the EUR-Lex SPARQL search. */
export interface EurLexHit {
  id: string;
  title: string;
  /** Relevance score — no longer provided by the API; kept optional for backwards compatibility. */
  score?: number | null;
  country: string;
  sector: string;
  url: string;
  snippet: string;
}

/** A document returned by the /api/latest feed (Luxembourg latest publications). */
export interface LatestDocument {
  celex: string;
  title: string;
  date: string;
  sector: string;
  url: string;
  snippet: string;
}

/** A written parliamentary question (live EP Open Data Portal record). */
export interface ParliamentQuestion {
  /** Display id, e.g. "E-003604/2026". */
  id: string;
  title: string;
  /** Author MEP(s) with political group, as listed by the Parliament. */
  askedBy: string;
  date: string;
  /** Addressee institution. */
  target: string;
  status: "Answered" | "Answer Pending";
  answerDate: string | null;
  /** Public Parliament page for the question. */
  url: string;
  /** Public page for the answer (null while pending). */
  answerUrl: string | null;
}

/** One plenary vote in a list (HowTheyVote). */
export interface ParliamentVoteSummary {
  id: string;
  date: string;
  title: string;
  reference: string | null;
}

export interface VoteSplit {
  yes: number;
  no: number;
  abstain: number;
  didNotVote: number;
}

/** A plenary roll-call vote with group and Italian splits (HowTheyVote). */
export interface ParliamentVote {
  id: string;
  date: string;
  title: string;
  description: string;
  reference: string | null;
  result: string | null;
  committees: string[];
  total: VoteSplit;
  /** Votes cast (for + against + abstain). */
  totalVotes: number;
  byGroup: ({ group: string } & VoteSplit)[];
  italy: VoteSplit | null;
  url: string;
}

/** A published response to a Have Your Say consultation (live Commission data). */
export interface ConsultationSubmission {
  id: string;
  stakeholder: string;
  country: string;
  userType: string;
  date: string | null;
  /** Comma-separated attachment file names ("" when none). */
  attachment: string;
  snippet: string;
}

/** A Have Your Say public consultation (live Commission Better Regulation data). */
export interface Consultation {
  /** Have Your Say initiative id. */
  pid: string;
  title: string;
  status: string;
  totalSubmissions: number;
  closingDate: string | null;
  summary: string;
  /** Public Have Your Say page for the initiative. */
  url: string;
  actType: string;
  publicationId: number | null;
  demographics: {
    /** Number of published responses the breakdowns below are computed from. */
    sampleSize: number;
    countries: { country: string; percentage: number; submissions: number }[];
    sectors: { name: string; percentage: number; count: number }[];
  };
  submissions: ConsultationSubmission[];
}

/** An item from the hub's live feed that can be turned into an AI briefing. */
export interface EnelBrief {
  id: string;
  title: string;
  type: string;
  date: string;
  source: string;
  url?: string;
}

/** An Italian political event tracked by the Politics Tracker module. */
export interface PoliticalEvent {
  id: string;
  title: string;
  description: string;
  content: string;
  date: string; // ISO 8601 string
  sourceType: "Official" | "News";
  sourceName: "Dati Camera" | "Dati Senato" | "Openpolis" | "NewsData.io" | "Event Registry";
  sourceUrl: string;
  category: "Legislative Act" | "Committee Meeting" | "Floor Vote" | "Political Statement" | "Corporate Regulation";
  impactLevel: "High" | "Medium" | "Low";
  entities: {
    name: string;
    role: string;
    party: "FdI" | "PD" | "M5S" | "Lega" | "FI" | "Other";
  }[];
  tags: string[];
}

/** A Commission initiative on the radar (Have Your Say / Better Regulation data). */
export interface RadarItem {
  /** Have Your Say initiative id. */
  id: string;
  title: string;
  summary: string;
  actType: string;
  stage: string;
  /** The Commission's indicative adoption quarter, e.g. "Q4 2026" (null when none is published). */
  plannedPeriod: string | null;
  /** Sortable form of the planned quarter, e.g. "2026-4". */
  plannedSort: string | null;
  adoptionDate: string | null;
  /** "Overdue" = the planned quarter has passed and no adoption is recorded. */
  status: "Upcoming" | "Overdue" | "Adopted" | "Abandoned";
  feedback: "Open" | "Upcoming" | "None";
  feedbackEnd: string | null;
  totalFeedback: number;
  dg: string;
  major: boolean;
  reference: string;
  url: string;
}

export type ChangeSource = "radar" | "dossier" | "press" | "meeting";

/** One detected change in a monitored source (see lib/changeFeed.ts). */
export interface ChangeEvent {
  id: string;
  source: ChangeSource;
  externalId: string;
  kind: "new" | "changed";
  title: string;
  summary: string;
  url: string;
  detectedAt: string;
}

/** An MEP's role on a legislative file. */
export interface DossierActor {
  /** EP person id (null for committees). */
  mepId: string | null;
  name: string;
  role: string;
  group: string;
  country: string;
  committee: string;
}

/** A watched legislative file (European Parliament procedure data plus linked items). */
export interface Dossier {
  /** Procedure id as used in URLs, e.g. "2025-0399". */
  id: string;
  /** Interinstitutional reference, e.g. "2025/0399(COD)". */
  reference: string;
  name: string;
  title: string;
  why: string;
  proposal: string;
  proposalUrl: string;
  stage: string;
  leadCommittee: string;
  opinionCommittees: string[];
  actors: DossierActor[];
  timeline: { date: string; label: string; documents: { id: string; url: string }[] }[];
  lastActivity: { date: string; label: string } | null;
  oeilUrl: string;
  /** False when the Parliament has no record yet or the request failed. */
  available: boolean;
}

/** Items linked to a dossier by its hand-made mapping (keywords and procedure reference). */
export interface DossierLinks {
  initiatives: RadarItem[];
  questions: ParliamentQuestion[];
  votes: ParliamentVoteSummary[];
}

/** A stakeholder's published response to a consultation, with the full text. */
export interface PeerPosition {
  peer: string;
  organization: string;
  country: string;
  userType: string;
  date: string | null;
  text: string;
  transparencyId: string;
  attachments: { fileName: string; url: string; pages: number | null }[];
  publication: string;
}

/** A meeting between Commission staff and interest representatives (Commission transparency data). */
export interface CommissionMeeting {
  date: string;
  /** "Cabinet" (Commissioners and their cabinets) or "DG" (Directors-General and management staff). */
  level: "Cabinet" | "DG";
  /** Cabinet name, or DG acronym and name. */
  host: string;
  subject: string;
  location: string;
  organisations: { name: string; id: string }[];
  officials: string[];
}

export interface PeerMeetingStats {
  peer: string;
  cabinet: number;
  dg: number;
  last12Months: number;
  lastMeeting: string | null;
}

/** A Commission press corner item. */
export interface PressItem {
  ref: string;
  title: string;
  lead: string;
  date: string;
  type: string;
  stateAid: boolean;
  url: string;
}

export interface MarketSnapshot {
  zone: string;
  unit: string;
  /** Daily average day-ahead prices, oldest first. */
  days: { date: string; avg: number; min: number; max: number }[];
  /** Share of net generation by source for the most recent complete day. */
  mix: { date: string; sources: { name: string; share: number; gwh: number }[]; renewableShare: number | null } | null;
  source: string;
  license: string;
}

export interface CalendarEvent {
  date: string;
  kind: "Consultation deadline" | "Planned adoption" | "Plenary sitting";
  title: string;
  url: string;
}

export interface MepSummary {
  id: string;
  name: string;
  country: string;
  group: string;
}

export interface MepBriefing extends MepSummary {
  email: string | null;
  profileUrl: string;
  committees: { body: string; role: string }[];
  dossierRoles: { dossierId: string; dossier: string; role: string }[];
  questions: ParliamentQuestion[];
  votes: { id: string; date: string; title: string; position: string; url: string }[];
  /** Sections that could not be loaded. */
  gaps: string[];
}

/** Configuration for the document summarizer modal. */
export interface SummarizerConfig {
  title: string;
  snippet: string;
  namespace: string;
  celex: string;
}
