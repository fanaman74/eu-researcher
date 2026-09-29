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

/** Configuration for the document summarizer modal. */
export interface SummarizerConfig {
  title: string;
  snippet: string;
  namespace: string;
  celex: string;
}
