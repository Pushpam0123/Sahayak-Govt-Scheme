import React, { useState, useEffect } from 'react';

interface HealthResponse {
  status: string;
  database: string;
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkCount, setCheckCount] = useState<number>(0);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      // Connect to FastAPI on localhost:8000
      const response = await fetch('http://localhost:8000/api/v1/health');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: HealthResponse = await response.json();
      setHealth(data);
    } catch (err: any) {
      console.error("Health check failed:", err);
      setError(err.message || "Failed to reach the API server");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, [checkCount]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Decorative background glow elements */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-xl z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-full px-4 py-1.5 text-xs font-semibold text-brand-300 mb-4 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
            Sahayak Project Scaffold Active
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-400 bg-clip-text text-transparent sm:text-5xl">
            Sahayak AI Assistant
          </h1>
          <p className="mt-3 text-slate-400 max-w-md mx-auto text-sm sm:text-base">
            A multilingual retrieval-augmented generation (RAG) assistant for Indian government schemes and eligibility profiles.
          </p>
        </div>

        {/* Dashboard Liveness Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-slate-700/80">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center justify-between border-b border-slate-800 pb-3">
            System Connectivity Status
            <button
              onClick={() => setCheckCount(prev => prev + 1)}
              disabled={loading}
              className="text-xs px-3 py-1.5 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-brand-900/30"
            >
              {loading ? (
                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18v3.582" />
                </svg>
              )}
              Refresh
            </button>
          </h2>

          <div className="space-y-4">
            {/* API Health Row */}
            <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-850 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-300">FastAPI Application Server</p>
                <p className="text-xs text-slate-500 mt-0.5">Endpoint: /api/v1/health</p>
              </div>
              <div>
                {loading ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                    Checking...
                  </span>
                ) : error ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-800/40">
                    Offline
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/30">
                    Online
                  </span>
                )}
              </div>
            </div>

            {/* DB Health Row */}
            <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-850 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-300">PostgreSQL (with pgvector)</p>
                <p className="text-xs text-slate-500 mt-0.5">Dialect: asyncpg</p>
              </div>
              <div>
                {loading ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                    Checking...
                  </span>
                ) : health?.database === "connected" ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/30">
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-800/40">
                    Disconnected
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details / Debug Log Console */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Debug Console Logs</p>
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 font-mono text-xs text-slate-400 overflow-x-auto min-h-[80px]">
              {loading ? (
                <span className="text-brand-400/70">Connecting to services...</span>
              ) : error ? (
                <div className="text-red-400">
                  <p className="font-bold">Error communicating with backend:</p>
                  <p className="mt-1 opacity-90">{error}</p>
                  <p className="mt-2 text-slate-500 text-[10px]">
                    Make sure to run `make up` to spin up the local docker containers or start the python local server.
                  </p>
                </div>
              ) : (
                <div className="text-slate-300">
                  <p className="text-emerald-400 font-semibold">[SUCCESS] Connection established</p>
                  <p className="mt-1">Response JSON: {JSON.stringify(health)}</p>
                  <p className="mt-1 text-slate-500 text-[10px]">Timestamp: {new Date().toISOString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-8">
          Sahayak Monorepo Scaffold • Phase 0 Completed
        </p>
      </div>
    </div>
  );
}

export default App;
