// Advanced, collapsible tool: keyword-search the indexed guideline chunks
// and inspect their full text. Secondary to the citizen-facing dashboard.
import { useState } from 'react';
import { fetchSearch } from '../../lib/api';
import { DEMO_CHUNKS } from '../../lib/demo';
import type { Dict } from '../../lib/i18n';
import type { ChunkResult } from '../../lib/types';
import { Button, Card, Segmented, Spinner, TextInput } from '../ui';
import { SearchIcon } from '../icons';

export function DocumentExplorer({
  t,
  offline,
}: {
  t: Dict;
  offline: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(20);
  const [chunks, setChunks] = useState<ChunkResult[]>([]);
  const [selected, setSelected] = useState<ChunkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      if (offline) {
        const q = query.trim().toLowerCase();
        const filtered = q
          ? DEMO_CHUNKS.filter(
              (c) =>
                c.text.toLowerCase().includes(q) ||
                c.heading_path.toLowerCase().includes(q),
            )
          : DEMO_CHUNKS;
        setChunks(filtered.slice(0, limit));
        setSelected(filtered[0] ?? null);
      } else {
        const data = await fetchSearch({ query: query || undefined, limit });
        setChunks(data.results);
        setSelected(data.results[0] ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-left cursor-pointer"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-content">
          <SearchIcon className="h-4.5 w-4.5 text-primary" />
          {t.advancedTools}
        </span>
        <span className="text-xs font-medium text-muted">
          {open ? '−' : '+'}
        </span>
      </button>

      {open ? (
        <div className="border-t border-border-subtle p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch();
            }}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <label className="flex-1">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                {t.keywordMatch}
              </span>
              <TextInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
              />
            </label>
            <div className="flex items-center gap-3">
              <div>
                <span className="mb-1.5 block text-xs font-medium text-muted">
                  {t.limit}
                </span>
                <Segmented<string>
                  size="sm"
                  value={String(limit)}
                  onChange={(v) => setLimit(Number(v))}
                  options={[
                    { value: '10', label: '10' },
                    { value: '20', label: '20' },
                    { value: '50', label: '50' },
                  ]}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner className="h-4 w-4" /> : t.search}
              </Button>
            </div>
          </form>

          {error ? (
            <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
              {error}
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Chunk list */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
                {t.auditedChunks} ({chunks.length})
              </p>
              {chunks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border-subtle px-4 py-8 text-center">
                  <p className="text-sm font-medium text-content">
                    {t.noChunks}
                  </p>
                  <p className="mt-1 text-xs text-muted">{t.noChunksDesc}</p>
                </div>
              ) : (
                <ul className="max-h-72 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
                  {chunks.map((c) => {
                    const active = selected?.id === c.id;
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => setSelected(c)}
                          className={`w-full rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                            active
                              ? 'border-primary bg-primary-soft'
                              : 'border-border-subtle bg-surface hover:border-border-strong'
                          }`}
                        >
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                              seq {c.seq}
                            </span>
                            <span className="font-mono text-[10px] text-faint">
                              #{c.id}
                            </span>
                          </div>
                          <p className="truncate text-xs font-semibold text-content">
                            {c.heading_path || 'Root Document'}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted">
                            {c.text}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Inspector */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
                {t.chunkInspector}
              </p>
              {selected ? (
                <div className="rounded-lg border border-border-subtle bg-surface-2 p-3">
                  <p className="mb-2 text-xs font-semibold text-content">
                    {selected.heading_path || 'Root Document'}
                  </p>
                  <div className="max-h-60 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted scrollbar-thin">
                    {selected.text}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border-subtle px-4 py-8 text-center text-xs text-muted">
                  {t.selectChunkInspect}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
