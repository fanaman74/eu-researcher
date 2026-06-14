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
  score: number;
  country: string;
  sector: string;
  url: string;
  snippet: string;
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
