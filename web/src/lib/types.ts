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
  ministry?: string;
  summary?: string;
  benefit_amount?: string;
  benefit_type?: string;
  application_mode?: string;
  official_url?: string;
  status?: string;
  tags?: string[];
}

export interface SchemeDocument {
  id: number;
  title: string;
  source_url?: string;
  doc_type: string;
  fetch_status: string;
  verified_at?: string;
  content_sha256?: string;
}

export interface SchemeEligibilityInfo {
  is_verified: boolean;
  rules: Record<string, any> | null;
  verified_by?: string;
  verified_at?: string;
}

export interface SchemeDetail extends SchemeInfo {
  required_documents: string[];
  application_url?: string;
  deadlines?: string;
  helpline?: string;
  eligibility_rules?: SchemeEligibilityInfo | null;
  documents: SchemeDocument[];
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
  id?: string;
  sender: 'user' | 'assistant';
  text: string;
  sentences?: SentenceInfo[];
  citations?: CitationInfo[];
  usage?: ChatUsage;
  latency_ms?: number;
  isStreaming?: boolean;
}

export interface ChatResponse {
  id?: number;
  answer: string;
  sentences?: SentenceInfo[];
  citations?: CitationInfo[];
  usage?: ChatUsage;
  latency_ms?: number;
}

export type EligibilityVerdict = 'eligible' | 'ineligible' | 'unknown';

export interface EligibilityStatus {
  status: EligibilityVerdict;
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
  state?: string | null;
  category?: string | null;
  scheme_id?: string | null;
}

export interface AdminStats {
  catalogue: {
    total_schemes: number;
    active_schemes: number;
    total_documents: number;
    verified_documents: number;
    total_chunks: number;
    unverified_rules_in_queue: number;
  };
  usage: {
    total_questions_served: number;
    total_cost_usd: number;
  };
}

export interface RulesQueueItem {
  id: number;
  scheme_id: string;
  scheme_name: string;
  state: string;
  category: string;
  rules_json: Record<string, any>;
  extracted_by?: string;
  extracted_at?: string;
  is_verified: boolean;
  notes?: string;
}
