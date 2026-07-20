import React, { useState, useEffect } from 'react';

interface HealthResponse {
  status: string;
  database: string;
}

interface SchemeInfo {
  id: string;
  name: string;
  state: string;
  category: string;
}

interface ChunkResult {
  id: number;
  scheme_id: string;
  document_title: string;
  seq: number;
  heading_path: string;
  text: string;
  tokens: number;
}

interface SearchResponse {
  results: ChunkResult[];
  schemes: SchemeInfo[];
}

function App() {
  // Liveness state
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [checkCount, setCheckCount] = useState<number>(0);

  // Search/Browser state
  const [schemes, setSchemes] = useState<SchemeInfo[]>([]);
  const [chunks, setChunks] = useState<ChunkResult[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchLimit, setSearchLimit] = useState<number>(20);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedChunk, setSelectedChunk] = useState<ChunkResult | null>(null);

  // Fetch liveness
  const checkHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const response = await fetch('http://localhost:8000/api/v1/health');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: HealthResponse = await response.json();
      setHealth(data);
    } catch (err: any) {
      console.error("Health check failed:", err);
      setHealthError(err.message || "Failed to reach the API server");
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  // Fetch search results and schemes
  const fetchChunks = async () => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const params = new URLSearchParams();
      if (selectedSchemeId) params.append('scheme_id', selectedSchemeId);
      if (searchQuery) params.append('query', searchQuery);
      params.append('limit', searchLimit.toString());

      const response = await fetch(`http://localhost:8000/api/v1/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch chunks. Status: ${response.status}`);
      }
      const data: SearchResponse = await response.json();
      setChunks(data.results);
      setSchemes(data.schemes);
      if (data.results.length > 0 && !selectedChunk) {
        setSelectedChunk(data.results[0]);
      }
    } catch (err: any) {
      console.error("Failed to query chunks:", err);
      setSearchError(err.message || "Failed to load database chunks");
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, [checkCount]);

  useEffect(() => {
    fetchChunks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchemeId, searchLimit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChunks();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6 relative overflow-hidden font-sans">
      {/* Decorative background glow elements */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Header Bar */}
      <header className="z-10 border-b border-slate-900 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 text-xs font-semibold text-sky-400 mb-3 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            Sahayak Scheme Assistant
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
            Sahayak Ingestion & Scheme Explorer
          </h1>
          <p className="mt-1 text-slate-400 text-sm max-w-xl">
            Audit and verify document cleaning, table markdown preservation, and semantic heading-aware chunk boundaries.
          </p>
        </div>

        {/* System Liveness Panel */}
        <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl flex items-center gap-6 text-xs shadow-lg backdrop-blur-md">
          <div>
            <div className="text-slate-500">API Status:</div>
            <div className="font-semibold mt-0.5">
              {healthLoading ? (
                <span className="text-slate-400">Checking...</span>
              ) : healthError ? (
                <span className="text-red-400">Offline</span>
              ) : (
                <span className="text-emerald-400">Online</span>
              )}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div>
            <div className="text-slate-500">Database Connection:</div>
            <div className="font-semibold mt-0.5">
              {healthLoading ? (
                <span className="text-slate-400">Checking...</span>
              ) : health?.database === "connected" ? (
                <span className="text-emerald-400 font-semibold">Connected</span>
              ) : (
                <span className="text-red-400">Disconnected</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setCheckCount(prev => prev + 1)}
            disabled={healthLoading}
            className="p-1.5 bg-slate-850 hover:bg-slate-800 rounded-lg border border-slate-800 text-slate-300 transition-colors"
            title="Refresh Liveness"
          >
            <svg className={`h-4.5 w-4.5 ${healthLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18v3.582" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Left Side: Filter and Listing Panel */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          {/* Filtering Controls */}
          <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl backdrop-blur-xl shadow-xl">
            <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Search and Filter Chunks</h2>
            
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              {/* Scheme Select */}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">Select Government Scheme</label>
                <select
                  value={selectedSchemeId}
                  onChange={(e) => setSelectedSchemeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                >
                  <option value="">-- All Schemes --</option>
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.state === 'Central' ? 'Central' : s.state})
                    </option>
                  ))}
                </select>
              </div>

              {/* Keyword Search */}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">Keyword Match</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter keywords..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-650 hover:bg-sky-600 active:bg-sky-700 text-white text-sm font-medium rounded-xl transition-colors shadow-md shadow-sky-950/20"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Limit Slider */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">Limit Results:</span>
                <div className="flex gap-2">
                  {[10, 20, 50, 100].map((limitVal) => (
                    <button
                      key={limitVal}
                      type="button"
                      onClick={() => setSearchLimit(limitVal)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                        searchLimit === limitVal
                          ? 'bg-sky-950/60 border-sky-800/80 text-sky-400'
                          : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {limitVal}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Results List */}
          <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl flex-1 flex flex-col backdrop-blur-xl shadow-xl min-h-[400px]">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex justify-between items-center pb-2 border-b border-slate-850">
              <span>Retrieved Chunks ({chunks.length})</span>
              {searchLoading && (
                <svg className="animate-spin h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </h3>

            {searchError ? (
              <div className="text-center py-12 text-red-400 bg-red-950/10 border border-red-900/20 rounded-xl px-4">
                <p className="font-semibold">Query Failed</p>
                <p className="text-xs opacity-80 mt-1">{searchError}</p>
                <p className="text-xs text-slate-500 mt-4">Make sure you have run migrations and the ingestion script (`make ingest`).</p>
              </div>
            ) : chunks.length === 0 ? (
              <div className="text-center py-16 text-slate-500 flex-1 flex flex-col justify-center">
                <svg className="mx-auto h-8 w-8 opacity-40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18" />
                </svg>
                <p className="text-sm font-semibold">No Chunks Found</p>
                <p className="text-xs mt-1 max-w-xs mx-auto">Database is empty or no chunks match your filters. Run the ingestion pipeline first.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin">
                {chunks.map((c) => {
                  const isSelected = selectedChunk?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedChunk(c)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-sky-950/40 border-sky-800/80 shadow-md shadow-sky-950/15'
                          : 'bg-slate-950 border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/30'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="text-[11px] font-bold text-sky-400 bg-sky-950/80 border border-sky-900/50 rounded px-1.5 py-0.5">
                          Seq: {c.seq}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">ID: #{c.id}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 line-clamp-1 mb-1.5" title={c.heading_path}>
                        {c.heading_path || "Root Document"}
                      </div>
                      <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {c.text}
                      </div>
                      <div className="mt-3 flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-900/50">
                        <span>Doc: {c.document_title}</span>
                        <span>{c.tokens} tokens</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Chunk Inspector Panel */}
        <section className="lg:col-span-7 flex flex-col">
          <div className="bg-slate-900/60 border border-slate-850 rounded-2xl flex-1 flex flex-col backdrop-blur-xl shadow-xl p-6 min-h-[500px]">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center justify-between mb-4">
              <span>Detailed Chunk Inspector</span>
              {selectedChunk && (
                <span className="text-xs text-sky-400 font-mono normal-case">
                  Est. Tokens: {selectedChunk.tokens}
                </span>
              )}
            </h2>

            {selectedChunk ? (
              <div className="flex-1 flex flex-col gap-6">
                {/* Meta details list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-3.5">
                    <span className="text-slate-500 block mb-1">Parent Scheme Slug:</span>
                    <span className="font-mono font-semibold text-slate-200">{selectedChunk.scheme_id}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-3.5">
                    <span className="text-slate-500 block mb-1">Heading Hierarchy Path:</span>
                    <span className="font-semibold text-slate-200 leading-normal">{selectedChunk.heading_path || "Root (No Headings)"}</span>
                  </div>
                </div>

                {/* Main Content Render Area */}
                <div className="flex-1 flex flex-col">
                  <span className="text-xs text-slate-500 font-medium mb-2">Chunk Markdown Content:</span>
                  <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl p-5 font-mono text-xs leading-relaxed text-slate-300 overflow-auto max-h-[500px]">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{selectedChunk.text}</pre>
                  </div>
                </div>

                {/* Eyeball Check Advice Box */}
                <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-3">
                  <svg className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-slate-300 mb-0.5">Verification Guideline:</p>
                    <p className="leading-normal">
                      Check that markdown tables are intact and not cut off. Make sure the heading hierarchy path captures correct sub-sections (e.g., Eligibility &gt; Age Limit) to ensure context remains preserved when searched.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-slate-500 py-24">
                <svg className="h-10 w-10 opacity-30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="text-sm font-semibold">Select a chunk to view details</p>
                <p className="text-xs mt-1">Chunk metadata, estimated tokens, and full markdown structures will load here.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="z-10 border-t border-slate-900 mt-10 pt-6 text-center text-slate-600 text-xs">
        Sahayak Government Scheme Assistant • Phase 1 Ingestion Completed
      </footer>
    </div>
  );
}

export default App;
