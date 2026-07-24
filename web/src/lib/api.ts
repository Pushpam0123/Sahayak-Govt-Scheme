// Thin API client for the Sahayak backend.
// Base URL is configurable via VITE_API_BASE so the app is not pinned to
// localhost in every environment.

import type {
  ChatFilters,
  ChatResponse,
  CitizenProfile,
  EligibilityMap,
  HealthResponse,
  SearchResponse,
} from './types';

export const API_BASE: string =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, '') ?? 'http://localhost:8000';

const V1 = `${API_BASE}/api/v1`;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export function fetchHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>(`${V1}/health`);
}

export interface SearchParams {
  query?: string;
  schemeId?: string;
  limit?: number;
}

export function fetchSearch({
  query,
  schemeId,
  limit = 20,
}: SearchParams): Promise<SearchResponse> {
  const params = new URLSearchParams();
  if (schemeId) params.append('scheme_id', schemeId);
  if (query) params.append('query', query);
  params.append('limit', String(limit));
  return getJson<SearchResponse>(`${V1}/search?${params.toString()}`);
}

export function matchEligibility(
  profile: CitizenProfile,
): Promise<EligibilityMap> {
  return postJson<EligibilityMap>(`${V1}/eligibility/match-all`, profile);
}

export function askChat(
  question: string,
  filters: ChatFilters,
): Promise<ChatResponse> {
  return postJson<ChatResponse>(`${V1}/chat`, { question, filters });
}
