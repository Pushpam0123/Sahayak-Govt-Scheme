// Thin API client for the Sahayak backend.
import type {
  AdminStats,
  ChatFilters,
  ChatResponse,
  ChunkResult,
  CitationInfo,
  CitizenProfile,
  EligibilityMap,
  HealthResponse,
  RulesQueueItem,
  SchemeDetail,
  SchemeInfo,
  SearchResponse,
} from './types';

export const API_BASE: string =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') ?? 'http://localhost:8000';

const V1 = `${API_BASE}/api/v1`;

async function getJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

async function postJson<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export function fetchHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>(`${V1}/healthz`);
}

export interface SchemeFilterParams {
  state?: string;
  category?: string;
  benefit_type?: string;
  status?: string;
}

export function fetchSchemes(params?: SchemeFilterParams): Promise<SchemeInfo[]> {
  const q = new URLSearchParams();
  if (params?.state) q.append('state', params.state);
  if (params?.category) q.append('category', params.category);
  if (params?.benefit_type) q.append('benefit_type', params.benefit_type);
  if (params?.status) q.append('status', params.status);
  return getJson<SchemeInfo[]>(`${V1}/schemes?${q.toString()}`);
}

export function fetchSchemeDetail(schemeId: string): Promise<SchemeDetail> {
  return getJson<SchemeDetail>(`${V1}/schemes/${schemeId}`);
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
  filters?: ChatFilters,
  sessionId?: string,
): Promise<ChatResponse> {
  return postJson<ChatResponse>(`${V1}/chat`, {
    question,
    session_id: sessionId,
    filters: {
      state: filters?.state ?? null,
      category: filters?.category ?? null,
      scheme_id: filters?.scheme_id ?? null,
    },
  });
}

export interface StreamChatHandlers {
  onContext?: (data: { retrieved_chunks: ChunkResult[]; citation_candidates: CitationInfo[] }) => void;
  onToken?: (token: string) => void;
  onDone?: (data: ChatResponse) => void;
  onError?: (err: Error) => void;
}

export async function streamChatAnswer(
  question: string,
  filters?: ChatFilters,
  sessionId?: string,
  handlers?: StreamChatHandlers,
): Promise<void> {
  try {
    const res = await fetch(`${V1}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        session_id: sessionId,
        filters: {
          state: filters?.state ?? null,
          category: filters?.category ?? null,
          scheme_id: filters?.scheme_id ?? null,
        },
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Streaming failed: HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = '';
      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.replace('event:', '').trim();
        } else if (line.startsWith('data:')) {
          const dataStr = line.replace('data:', '').trim();
          if (!dataStr) continue;
          try {
            const data = JSON.parse(dataStr);
            if (currentEvent === 'context' && handlers?.onContext) {
              handlers.onContext(data);
            } else if (currentEvent === 'token' && handlers?.onToken) {
              handlers.onToken(data.token);
            } else if (currentEvent === 'done' && handlers?.onDone) {
              handlers.onDone(data);
            }
          } catch {
            // malformed json line ignored
          }
        }
      }
    }
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    if (handlers?.onError) {
      handlers.onError(errorObj);
    } else {
      throw errorObj;
    }
  }
}

// Admin API
export function fetchAdminStats(adminToken: string): Promise<AdminStats> {
  return getJson<AdminStats>(`${V1}/admin/stats`, {
    'X-Admin-Token': adminToken,
  });
}

export function fetchRulesQueue(adminToken: string): Promise<RulesQueueItem[]> {
  return getJson<RulesQueueItem[]>(`${V1}/admin/rules/queue`, {
    'X-Admin-Token': adminToken,
  });
}

export function verifySchemeRules(
  schemeId: string,
  rulesJson: Record<string, unknown>,
  verifiedBy: string,
  notes: string,
  adminToken: string,
): Promise<{ status: string; scheme_id: string }> {
  return postJson(
    `${V1}/admin/rules/${schemeId}/verify`,
    { rules_json: rulesJson, verified_by: verifiedBy, notes },
    { 'X-Admin-Token': adminToken },
  );
}
