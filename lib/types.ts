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

/** A written parliamentary question tracked by the EP watcher (mock DB). */
export interface ParliamentQuestion {
  id: string;
  title: string;
  askedBy: string;
  date: string;
  committee: string;
  target: string;
  content: string;
  status: string;
  risk: string;
  riskRationale: string;
}

/** Plenary sitting vote results from the EP watcher (mock DB). */
export interface ParliamentVote {
  sittingId: string;
  sittingDate: string;
  resolution: string;
  totalVotes: number;
  split: {
    yes: number;
    no: number;
    abstain: number;
  };
  outcome: string;
  strategicImpact: string;
}

/** A comitology committee voting record (mock DB). */
export interface ComitologyVote {
  id: string;
  measure: string;
  registerId: string;
  date: string;
  chairperson: string;
  status: string;
  votingSheet: {
    inFavour: number;
    against: number;
    abstentions: number;
    countriesAgainst: string[];
    countriesAbstaining: string[];
  };
  strategicImpact: string;
}

/** A single stakeholder position paper attached to a consultation. */
export interface ConsultationSubmission {
  id: string;
  stakeholder: string;
  country: string;
  attachment: string;
  snippet: string;
  sentiment: string;
  relevance: string;
}

/** A Have Your Say public consultation (mock DB). */
export interface Consultation {
  pid: string;
  title: string;
  status: string;
  totalSubmissions: number;
  closingDate: string;
  enelAlignment: string;
  demographics: {
    countries: { country: string; percentage: number; submissions: number }[];
    sectors: { name: string; percentage: number; count: number }[];
    sentiments: { label: string; percentage: number; count: number }[];
  };
  submissions: ConsultationSubmission[];
}

/** A hardcoded sample inquiry brief shown on the Enel hub page. */
export interface EnelBrief {
  id: number;
  title: string;
  type: string;
  risk: string;
  date: string;
  source: string;
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
