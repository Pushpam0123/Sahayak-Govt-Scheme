// Shared API/domain types for the Sahayak frontend.

export interface HealthResponse {
  status: string;
  database: string;
}

export interface SchemeInfo {
  id: string;
  name: string;
  state: string;
  category: string;
}

export interface ChunkResult {
  id: number;
  scheme_id: string;
  document_title: string;
  seq: number;
  heading_path: string;
  text: string;
  tokens: number;
  score?: number;
}

export interface SearchResponse {
  results: ChunkResult[];
  schemes: SchemeInfo[];
}

export interface CitationInfo {
  n: number;
  chunk_id: number;
  source_url: string;
  heading_path: string;
  quote: string;
}

export interface Groundedness {
  status: 'supported' | 'partial' | 'unsupported' | string;
  reasoning: string;
}

export interface SentenceInfo {
  text: string;
  citations: number[];
  groundedness?: Groundedness;
}

export interface ChatUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  sentences?: SentenceInfo[];
  citations?: CitationInfo[];
  usage?: ChatUsage;
  latency_ms?: number;
}

export interface ChatResponse {
  answer: string;
  sentences?: SentenceInfo[];
  citations?: CitationInfo[];
  usage?: ChatUsage;
  latency_ms?: number;
}

export interface EligibilityStatus {
  eligible: boolean;
  failed_rules: string[];
}

export type EligibilityMap = Record<string, EligibilityStatus>;

export interface CitizenProfile {
  age: number | null;
  state: string | null;
  gender: string | null;
  caste: string | null;
  annual_income: number | null;
  landholding_acres: number | null;
}

export interface ChatFilters {
  state: string | null;
  category: string | null;
  scheme_id: string | null;
}
