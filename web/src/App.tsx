import React, { useState, useEffect, useRef } from 'react';

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

interface CitationInfo {
  n: number;
  chunk_id: number;
  source_url: string;
  heading_path: string;
  quote: string;
}

interface SentenceInfo {
  text: string;
  citations: number[];
  groundedness?: {
    status: string;
    reasoning: string;
  };
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  sentences?: SentenceInfo[];
  citations?: CitationInfo[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  latency_ms?: number;
}

interface EligibilityStatus {
  eligible: boolean;
  failed_rules: string[];
}

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'explorer' | 'chat'>('chat');

  // Liveness state
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [checkCount, setCheckCount] = useState<number>(0);

  // General states
  const [schemes, setSchemes] = useState<SchemeInfo[]>([]);

  // Explorer Tab State
  const [chunks, setChunks] = useState<ChunkResult[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchLimit, setSearchLimit] = useState<number>(20);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedChunk, setSelectedChunk] = useState<ChunkResult | null>(null);

  // Chat Tab State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: "Hello! I am Sahayak, your government scheme RAG assistant. Ask me questions about eligibility or benefits, and I'll answer using only official guidelines. You can also apply state or category filters in the options below."
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<CitationInfo | null>(null);
  
  // Chat option filters
  const [chatSchemeId, setChatSchemeId] = useState<string>('');
  const [chatStateFilter, setChatStateFilter] = useState<string>('');
  const [chatCategoryFilter, setChatCategoryFilter] = useState<string>('');

  // Citizen Profile Questionnaire State
  const [profileAge, setProfileAge] = useState<string>('30');
  const [profileState, setProfileState] = useState<string>('Madhya Pradesh');
  const [profileGender, setProfileGender] = useState<string>('Female');
  const [profileCaste, setProfileCaste] = useState<string>('General');
  const [profileIncome, setProfileIncome] = useState<string>('180000');
  const [profileLandholding, setProfileLandholding] = useState<string>('2.5');
  const [eligibilityMap, setEligibilityMap] = useState<Record<string, EligibilityStatus>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Run eligibility match
  const runEligibilityCheck = async () => {
    try {
      const payload = {
        age: profileAge ? parseInt(profileAge, 10) : null,
        state: profileState || null,
        gender: profileGender || null,
        caste: profileCaste || null,
        annual_income: profileIncome ? parseFloat(profileIncome) : null,
        landholding_acres: profileLandholding ? parseFloat(profileLandholding) : null
      };

      const response = await fetch('http://localhost:8000/api/v1/eligibility/match-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setEligibilityMap(data);
      }
    } catch (err) {
      console.error("Failed to match profile eligibility:", err);
    }
  };

  // Triggered on mount
  useEffect(() => {
    checkHealth();
    // Fetch initial schemes list for dropdowns
    const fetchInitialSchemes = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/search?limit=1');
        if (response.ok) {
          const data: SearchResponse = await response.json();
          setSchemes(data.schemes);
        }
      } catch (err) {
        console.error("Failed to fetch schemes dropdown:", err);
      }
    };
    fetchInitialSchemes();
  }, [checkCount]);

  useEffect(() => {
    if (activeTab === 'explorer') {
      fetchChunks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchemeId, searchLimit, activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    runEligibilityCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileAge, profileState, profileGender, profileCaste, profileIncome, profileLandholding]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChunks();
  };

  // Handle Grounded Q&A Chat Submit
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatError(null);
    setChatLoading(true);

    // Append user message
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);

    try {
      const payload = {
        question: userMsg,
        filters: {
          state: chatStateFilter || null,
          category: chatCategoryFilter || null,
          scheme_id: chatSchemeId || null
        }
      };

      const response = await fetch('http://localhost:8000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Chat API error! Status: ${response.status}`);
      }

      const data = await response.json();

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: data.answer,
          sentences: data.sentences,
          citations: data.citations,
          usage: data.usage,
          latency_ms: data.latency_ms
        }
      ]);
    } catch (err: any) {
      console.error("Chat generation failed:", err);
      setChatError(err.message || "Failed to generate cited response.");
    } finally {
      setChatLoading(false);
    }
  };

  const renderSentenceWithCitations = (
    sentText: string,
    citations: any[],
    groundedness?: { status: string; reasoning: string }
  ) => {
    const isUnsupported = groundedness?.status === 'unsupported';
    const isPartial = groundedness?.status === 'partial';

    const parts = sentText.split(/(\[[0-9]+\])/g);

    let sentenceClass = "";
    if (isUnsupported) {
      sentenceClass = "bg-rose-950/20 border-b border-rose-500/30 px-1 py-0.5 rounded";
    } else if (isPartial) {
      sentenceClass = "bg-amber-950/20 border-b border-amber-500/30 px-1 py-0.5 rounded";
    }

    return (
      <span className={`${sentenceClass} inline relative group mr-1`} key={sentText}>
        {parts.map((part, idx) => {
          const match = part.match(/^\[([0-9]+)\]$/);
          if (match) {
            const citationNum = parseInt(match[1]);
            const cit = citations?.find(c => c.n === citationNum);
            if (cit) {
              return (
                <button
                  key={idx}
                  onClick={() => setActiveCitation(cit)}
                  className="inline-flex items-center justify-center text-[9px] font-bold px-1.5 py-0.5 rounded mx-0.5 bg-sky-950 border border-sky-850 text-sky-400 hover:bg-sky-900 active:bg-sky-850 cursor-pointer transition-colors shadow-sm align-super"
                  title={`Citation [${citationNum}]: ${cit.heading_path}`}
                >
                  {citationNum}
                </button>
              );
            }
          }
          return part;
        })}

        {(isUnsupported || isPartial) && (
          <span className="inline-flex items-center ml-1 align-middle">
            <span
              className={`h-4.5 w-4.5 rounded-full inline-flex items-center justify-center text-[10px] font-extrabold cursor-help shadow-sm border ${
                isUnsupported
                  ? 'bg-rose-950 border-rose-800 text-rose-400'
                  : 'bg-amber-950 border-amber-800 text-amber-400'
              }`}
              title={`${isUnsupported ? 'Unsupported Claim' : 'Partially Supported'}: ${groundedness?.reasoning}`}
            >
              ⚠️
            </span>
            <span className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover:block bg-slate-900 border border-slate-800 text-slate-200 text-[11px] p-2.5 rounded-xl shadow-xl w-64 z-50 pointer-events-none leading-normal">
              <strong className={isUnsupported ? 'text-rose-400' : 'text-amber-400'}>
                {isUnsupported ? 'Claim Unsupported' : 'Claim Partially Supported'}
              </strong>
              <p className="mt-1 font-sans text-slate-400">{groundedness?.reasoning}</p>
            </span>
          </span>
        )}
      </span>
    );
  };

  // Inline citation renderer
  const renderMessageText = (msg: ChatMessage) => {
    const isRefusal = msg.text === "I don't have this information in the official documents I've indexed.";
    if (isRefusal) {
      return (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-950/20 border border-red-900/30 rounded-xl">
          <svg className="h-5 w-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-red-400 font-semibold text-sm">Refusal: Out of Corpus Question</p>
            <p className="text-xs text-red-300/80 mt-1 leading-normal">
              This request fell outside the scope of our verified government scheme index.
            </p>
          </div>
        </div>
      );
    }

    if (msg.sentences && msg.sentences.length > 0) {
      return (
        <div className="space-y-1.5">
          {msg.sentences.map((sent) =>
            renderSentenceWithCitations(sent.text, msg.citations || [], sent.groundedness)
          )}
        </div>
      );
    }

    if (!msg.citations || msg.citations.length === 0) {
      return (
        <p className="whitespace-pre-wrap leading-relaxed">
          {msg.text}
        </p>
      );
    }

    const parts = msg.text.split(/(\[[0-9]+\])/g);
    return (
      <p className="whitespace-pre-wrap leading-relaxed">
        {parts.map((part, idx) => {
          const match = part.match(/^\[([0-9]+)\]$/);
          if (match) {
            const citationNum = parseInt(match[1]);
            const cit = msg.citations?.find(c => c.n === citationNum);
            if (cit) {
              return (
                <button
                  key={idx}
                  onClick={() => setActiveCitation(cit)}
                  className="inline-flex items-center justify-center text-[10px] font-bold px-1.5 py-0.5 rounded mx-0.5 bg-sky-950 border border-sky-800 text-sky-400 hover:bg-sky-900 active:bg-sky-850 cursor-pointer transition-colors shadow-sm align-super"
                  title={`Citation [${citationNum}]: ${cit.heading_path}`}
                >
                  {citationNum}
                </button>
              );
            }
          }
          return part;
        })}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 md:p-6 relative overflow-hidden font-sans">
      {/* Decorative background glow elements */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Header Bar */}
      <header className="z-10 border-b border-slate-900 pb-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 text-xs font-semibold text-sky-400 mb-2.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            Sahayak Citizen Portal
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
            Sahayak Government Scheme Assistant
          </h1>
        </div>

        {/* Liveness Indicator */}
        <div className="bg-slate-900/50 border border-slate-850 px-4 py-2.5 rounded-xl flex items-center gap-4 text-xs shadow-lg backdrop-blur-md">
          <div>
            <div className="text-slate-500">API status:</div>
            <div className="font-semibold mt-0.5">
              {healthLoading ? (
                <span className="text-slate-400">Checking...</span>
              ) : healthError ? (
                <span className="text-red-400 font-bold">Offline</span>
              ) : (
                <span className="text-emerald-400 font-bold">Online</span>
              )}
            </div>
          </div>
          <div className="h-6 w-px bg-slate-850"></div>
          <div>
            <div className="text-slate-500">Database:</div>
            <div className="font-semibold mt-0.5">
              {healthLoading ? (
                <span className="text-slate-400">Checking...</span>
              ) : health?.database === "connected" ? (
                <span className="text-emerald-400 font-semibold">Connected</span>
              ) : (
                <span className="text-red-400 font-bold">Disconnected</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setCheckCount(prev => prev + 1)}
            disabled={healthLoading}
            className="p-1 bg-slate-850 hover:bg-slate-850 rounded border border-slate-800 text-slate-300 transition-colors"
          >
            <svg className={`h-3.5 w-3.5 ${healthLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18v3.582" />
            </svg>
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="z-10 flex gap-2 mb-6 border-b border-slate-900 pb-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'chat'
              ? 'bg-sky-950/60 border border-sky-900/60 text-sky-400 shadow-md'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          Grounded Q&A Chat
        </button>
        <button
          onClick={() => setActiveTab('explorer')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'explorer'
              ? 'bg-sky-950/60 border border-sky-900/60 text-sky-400 shadow-md'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          Citizen Dashboard & Scheme Explorer
        </button>
      </nav>

      {/* Main Container */}
      <main className="z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {activeTab === 'chat' ? (
          <>
            {/* Grounded Chat Panel */}
            <section className="lg:col-span-8 flex flex-col bg-slate-900/40 border border-slate-850 rounded-2xl backdrop-blur-xl shadow-xl overflow-hidden min-h-[500px]">
              {/* Top Banner Options */}
              <div className="bg-slate-950/40 border-b border-slate-850 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-medium mb-1.5">Focus Scheme</label>
                  <select
                    value={chatSchemeId}
                    onChange={(e) => setChatSchemeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- All Schemes --</option>
                    {schemes.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1.5">State Filter</label>
                  <select
                    value={chatStateFilter}
                    onChange={(e) => setChatStateFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- All States --</option>
                    <option value="Central">Central</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Telangana">Telangana</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Odisha">Odisha</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1.5">Category Filter</label>
                  <select
                    value={chatCategoryFilter}
                    onChange={(e) => setChatCategoryFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- All Categories --</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Welfare">Welfare</option>
                    <option value="Pension">Pension</option>
                    <option value="Education">Education</option>
                    <option value="Women & Child Development">Women & Child Development</option>
                  </select>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[500px]">
                {chatMessages.map((msg, idx) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={idx}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4.5 py-3 shadow-md border ${
                          isUser
                            ? 'bg-sky-650 border-sky-650 text-white rounded-br-none'
                            : 'bg-slate-950 border-slate-900 text-slate-200 rounded-bl-none'
                        }`}
                      >
                        {renderMessageText(msg)}
                        {!isUser && msg.latency_ms && (
                          <div className="mt-2.5 pt-1.5 border-t border-slate-900/60 flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                            <span>Latency: {msg.latency_ms.toFixed(0)}ms</span>
                            {msg.usage && (
                              <span>Tokens: In={msg.usage.input_tokens} Out={msg.usage.output_tokens}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-950 border border-slate-900 rounded-2xl rounded-bl-none px-4.5 py-3 flex items-center gap-3">
                      <svg className="animate-spin h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-xs text-slate-400 font-medium">Consulting official records...</span>
                    </div>
                  </div>
                )}
                {chatError && (
                  <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-xs text-red-400 font-medium">
                    Failed to query: {chatError}
                  </div>
                )}
                <div ref={chatEndRef}></div>
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="bg-slate-950/30 border-t border-slate-850 p-4 flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question about government scheme criteria..."
                  disabled={chatLoading}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-5 py-2.5 bg-sky-650 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-sky-950/25 flex items-center gap-1.5"
                >
                  Ask
                </button>
              </form>
            </section>

            {/* Right Side: Citations Panel */}
            <section className="lg:col-span-4 flex flex-col bg-slate-900/40 border border-slate-850 rounded-2xl backdrop-blur-xl shadow-xl p-5 overflow-hidden">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider pb-3 border-b border-slate-850 flex items-center gap-2 mb-4">
                <svg className="h-4.5 w-4.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Citation Inspector
              </h3>

              {activeCitation ? (
                <div className="space-y-5 overflow-y-auto flex-1 pr-1 scrollbar-thin">
                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-4">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">Citation Index:</span>
                    <span className="inline-flex items-center justify-center h-6 w-6 text-xs font-bold rounded bg-sky-950 border border-sky-800 text-sky-400">
                      [{activeCitation.n}]
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-4">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">Heading Hierarchy:</span>
                    <span className="text-xs font-semibold text-slate-200 leading-relaxed">
                      {activeCitation.heading_path}
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-4">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">Official Document Source:</span>
                    <a
                      href={activeCitation.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-400 hover:text-sky-300 font-medium underline flex items-center gap-1 leading-normal"
                    >
                      View Source Document
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex-1">
                    <span className="text-[10px] text-slate-500 font-bold block mb-2">Source Quote:</span>
                    <div className="bg-slate-900/60 p-3 rounded-lg text-xs leading-relaxed text-slate-300 font-mono overflow-auto max-h-[220px]">
                      {activeCitation.quote}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-slate-500 text-center py-20 px-4">
                  <svg className="h-10 w-10 opacity-30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <p className="text-sm font-semibold">No Citation Selected</p>
                  <p className="text-xs mt-1 max-w-[200px]">
                    Click on any citation badge in an assistant message (e.g. <span className="text-sky-400 font-bold">[1]</span>) to view official document excerpts and source links.
                  </p>
                </div>
              )}
            </section>
          </>
        ) : (
          /* Explorer Tab content (3-Column Layout) */
          <>
            {/* Column 1: Auditing Search Controls & Citizen Profile */}
            <section className="lg:col-span-4 flex flex-col gap-6">
              {/* Auditing Search Filters */}
              <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl backdrop-blur-xl shadow-xl">
                <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <svg className="h-4.5 w-4.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Auditing Filter
                </h2>
                
                <form onSubmit={handleSearchSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1.5">Keyword Match</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search document text..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 bg-sky-650 hover:bg-sky-600 active:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-sky-950/20"
                      >
                        Search
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-400">Limit:</span>
                    <div className="flex gap-1.5">
                      {[10, 20, 50].map((limitVal) => (
                        <button
                          key={limitVal}
                          type="button"
                          onClick={() => setSearchLimit(limitVal)}
                          className={`text-[10px] px-2.5 py-1 rounded-md border transition-colors ${
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

              {/* Citizen Eligibility Profile Card */}
              <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl backdrop-blur-xl shadow-xl">
                <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <svg className="h-4.5 w-4.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Eligibility Profile
                </h2>

                <div className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Age (Years)</label>
                      <input
                        type="number"
                        value={profileAge}
                        onChange={(e) => setProfileAge(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">State</label>
                      <select
                        value={profileState}
                        onChange={(e) => setProfileState(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                      >
                        <option value="Central">Central</option>
                        <option value="Bihar">Bihar</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Telangana">Telangana</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Odisha">Odisha</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Gender</label>
                      <select
                        value={profileGender}
                        onChange={(e) => setProfileGender(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Caste Category</label>
                      <select
                        value={profileCaste}
                        onChange={(e) => setProfileCaste(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                      >
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Annual Household Income (₹)</label>
                    <input
                      type="number"
                      value={profileIncome}
                      onChange={(e) => setProfileIncome(e.target.value)}
                      placeholder="e.g. 180000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Agricultural Land owned (Acres)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={profileLandholding}
                      onChange={(e) => setProfileLandholding(e.target.value)}
                      placeholder="e.g. 2.5"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Column 2: Schemes Directory Cards with Eligibility Badges */}
            <section className="lg:col-span-4 flex flex-col bg-slate-900/60 border border-slate-850 p-5 rounded-2xl backdrop-blur-xl shadow-xl min-h-[400px]">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 pb-2 border-b border-slate-850 uppercase tracking-wider flex items-center justify-between">
                <span>Verified Schemes ({schemes.length})</span>
                <span className="text-[10px] text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-900/50">Directory</span>
              </h3>

              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin">
                {schemes.map((s) => {
                  const elig = eligibilityMap[s.id];
                  const isSelected = selectedSchemeId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSchemeId(s.id)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative group/card ${
                        isSelected
                          ? 'bg-sky-950/40 border-sky-800/80 shadow-md'
                          : 'bg-slate-950 border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/30'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span className="text-xs font-bold text-slate-200 line-clamp-1">{s.name}</span>
                        {elig ? (
                          elig.eligible ? (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 tracking-wider shrink-0 uppercase">
                              Eligible
                            </span>
                          ) : (
                            <span
                              className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800/80 text-rose-400 shrink-0 uppercase cursor-help"
                              title={elig.failed_rules.join('\n')}
                            >
                              Ineligible ⚠️
                            </span>
                          )
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 shrink-0 uppercase">
                            No Rules
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2 text-[10px] text-slate-500 font-medium">
                        <span>State: {s.state}</span>
                        <span>•</span>
                        <span>Category: {s.category}</span>
                      </div>

                      {/* Display warning checklist if ineligible */}
                      {elig && !elig.eligible && (
                        <div className="mt-2.5 text-[10px] text-rose-300 bg-rose-950/20 border border-rose-900/30 p-2 rounded-lg leading-relaxed">
                          <strong className="block text-rose-400 mb-0.5">Failed Criteria:</strong>
                          <ul className="list-disc pl-3.5 space-y-0.5">
                            {elig.failed_rules.map((rule, idx) => (
                              <li key={idx}>{rule}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Column 3: Audited Chunks Listing & Inspector */}
            <section className="lg:col-span-4 flex flex-col gap-6">
              {/* Auditing Chunks list */}
              <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl flex-1 flex flex-col backdrop-blur-xl shadow-xl min-h-[300px]">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex justify-between items-center pb-2 border-b border-slate-850">
                  <span className="flex items-center gap-2">
                    Audited Chunks ({chunks.length})
                    {searchLoading && (
                      <svg className="animate-spin h-3.5 w-3.5 text-sky-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                  </span>
                  {selectedSchemeId && (
                    <button
                      onClick={() => setSelectedSchemeId('')}
                      className="text-[10px] text-sky-400 hover:text-sky-300 underline font-medium"
                    >
                      Clear Filter
                    </button>
                  )}
                </h3>

                {searchError ? (
                  <div className="text-center py-12 text-red-400 bg-red-950/10 border border-red-900/20 rounded-xl px-4">
                    <p className="font-semibold">Query Failed</p>
                    <p className="text-xs opacity-80 mt-1">{searchError}</p>
                  </div>
                ) : chunks.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 flex-1 flex flex-col justify-center">
                    <p className="text-sm font-semibold">No Chunks Found</p>
                    <p className="text-xs mt-1">Select a scheme on the left to load its text guidelines.</p>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[180px] pr-1 scrollbar-thin">
                    {chunks.map((c) => {
                      const isSelected = selectedChunk?.id === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedChunk(c)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-sky-950/40 border-sky-800/80 shadow-md'
                              : 'bg-slate-950 border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/30'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <span className="text-[10px] font-bold text-sky-400 bg-sky-950/80 border border-sky-900/50 rounded px-1.5 py-0.5">
                              Seq: {c.seq}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">ID: #{c.id}</span>
                          </div>
                          <div className="text-[11px] font-semibold text-slate-200 line-clamp-1 mb-1">
                            {c.heading_path || "Root Document"}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-mono">
                            {c.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Chunk Inspector */}
              <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl flex-1 flex flex-col backdrop-blur-xl shadow-xl min-h-[250px]">
                <h3 className="text-sm font-semibold text-slate-300 pb-2 border-b border-slate-850 uppercase tracking-wider mb-3">
                  Chunk Inspector
                </h3>
                {selectedChunk ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl text-[10px] mb-3 leading-normal">
                      <span className="text-slate-500 block mb-0.5">Heading Path:</span>
                      <span className="font-semibold text-slate-200">{selectedChunk.heading_path || "Root Document"}</span>
                    </div>
                    <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl p-3 text-[11px] font-mono leading-relaxed text-slate-300 overflow-y-auto max-h-[140px]">
                      {selectedChunk.text}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-center text-xs py-10">
                    Select a chunk above to inspect details
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="z-10 border-t border-slate-900 mt-6 pt-4 text-center text-slate-600 text-xs">
        Sahayak Government Scheme Assistant • Phase 5 Eligibility Engine
      </footer>
    </div>
  );
}

export default App;
