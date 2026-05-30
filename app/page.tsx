"use client";

import { useState, useEffect, useRef } from "react";

// --- Types based on our backend API payload ---
interface MarketData {
  question: string;
  predictionOdds: number;
  volume: string;
  liquidity: string;
  marketId: string;
}

interface NewsData {
  headline: string;
  telemetry: string;
}

interface AnalysisData {
  discrepancyIndex: number;
  status: "STABLE" | "WATCH" | "CRITICAL";
  analyticalThesis: string;
}

interface SignalPayload {
  topic: string;
  timestamp: string;
  marketData: MarketData;
  newsData: NewsData;
  analysis: AnalysisData;
  error?: string;
}

export default function DelphiDashboard() {
  // --- Core State ---
  const [isAgentEngaged, setIsAgentEngaged] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  
  // --- Data State ---
  const [activeSignal, setActiveSignal] = useState<SignalPayload | null>(null);
  const [memoryCache, setMemoryCache] = useState<SignalPayload[]>([]);
  const [manualQuery, setManualQuery] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  
  const watchlist = ["Fed rate cut", "Bitcoin", "Trump"];
  
  // --- Refs for interval management ---
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const bgSweepsRef = useRef(0); // Tracks background sweeps

  // --- LOCAL STORAGE PERSISTENCE ---
  // 1. Load archives from localStorage on initial boot
  useEffect(() => {
    const savedCache = localStorage.getItem("delphi_archive_cache");
    if (savedCache) {
      try {
        const parsed = JSON.parse(savedCache);
        if (parsed && parsed.length > 0) {
          setMemoryCache(parsed);
          setActiveSignal(parsed[0]); // Boot up showing the last saved signal
        }
      } catch (e) {
        console.error("Failed to parse archive cache", e);
      }
    }
  }, []);

  // 2. Automatically save to localStorage whenever memoryCache updates
  useEffect(() => {
    if (memoryCache.length > 0) {
      localStorage.setItem("delphi_archive_cache", JSON.stringify(memoryCache));
    }
  }, [memoryCache]);

  // Auto-scroll terminal
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  const addLog = (msg: string) => {
    setTerminalLogs((prev) => [...prev.slice(-49), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // --- Core Fetch Logic ---
  const triggerSignalAnalysis = async (topic: string) => {
    setIsFetching(true);
    addLog(`[AGENT] Initiating Multi-Source scan for: "${topic}"...`);
    
    try {
      const res = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      
      const data: SignalPayload = await res.json();
      
      if (data.error) throw new Error(data.error);

      setActiveSignal(data);
      setMemoryCache((prev) => {
        // Keep the newest data at the top, max 15 items in history
        const newCache = [data, ...prev].slice(0, 15);
        return newCache;
      });
      
      addLog(`[SYS] Scan complete for "${topic}". Discrepancy Index: ${data.analysis?.discrepancyIndex || 0}/100.`);
    } catch (err: any) {
      addLog(`[ERR] Scan failed for "${topic}": ${err.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  // --- Timer Management ---
  const stopAgentTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    intervalRef.current = null;
    countdownRef.current = null;
  };

  const startAgentTimers = () => {
    stopAgentTimers();
    setCountdown(60);

    // Visual countdown ticker
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);

    // Main 60s Agent Loop
    intervalRef.current = setInterval(() => {
      // Background limit logic: Halt after 3 sweeps while hidden
      if (document.hidden) {
        bgSweepsRef.current += 1;
        if (bgSweepsRef.current >= 3) {
          setIsAgentEngaged(false); // Turn off agent
          addLog("[SYS] Agent auto-hibernated after 3 background sweeps to conserve resources.");
          return; // Skip this sweep
        }
      } else {
        bgSweepsRef.current = 0; // Reset counter if tab is active
      }

      setCurrentTopicIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % watchlist.length;
        triggerSignalAnalysis(watchlist[nextIndex]);
        return nextIndex;
      });
    }, 60000);
  };

  // --- Lifecycle Trigger ---
  useEffect(() => {
    if (!isAgentEngaged) {
      stopAgentTimers();
      if (activeSignal) addLog("[SYS] Autonomous Agent Mode HALTED.");
      return;
    }

    bgSweepsRef.current = 0; // Reset BG sweeps on engage
    addLog("[SYS] Autonomous Agent Mode ENGAGED. Commencing sweep...");
    triggerSignalAnalysis(watchlist[currentTopicIndex]);
    startAgentTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAgentEngaged]);

  // --- Manual Watchlist Click Handler ---
  const handleWatchlistClick = (index: number, topic: string) => {
    setCurrentTopicIndex(index);
    addLog(`[USER] Manual focus shifted to target: "${topic}"`);
    triggerSignalAnalysis(topic);
    
    if (isAgentEngaged) {
      startAgentTimers();
    }
  };

  // --- Archive Click Handler ---
  const handleArchiveClick = (sig: SignalPayload) => {
    setActiveSignal(sig);
    addLog(`[USER] Accessed archive memory for: "${sig.topic}" [MDI: ${sig.analysis.discrepancyIndex}]`);
  };

  // --- Manual Override Handler ---
  const handleManualOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    addLog(`[USER] Manual override triggered for: "${manualQuery}"`);
    triggerSignalAnalysis(manualQuery);
    setManualQuery("");
  };

  // --- UI Helpers ---
  const getStatusColor = (status?: string) => {
    if (status === "CRITICAL") return "text-red-500 border-red-900";
    if (status === "WATCH") return "text-yellow-400 border-yellow-900";
    return "text-green-400 border-green-900";
  };

  const getStatusBg = (status?: string) => {
    if (status === "CRITICAL") return "bg-red-500";
    if (status === "WATCH") return "bg-yellow-400";
    return "bg-green-500";
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4 md:p-6 selection:bg-green-900 selection:text-green-100 flex flex-col h-screen overflow-hidden">
      
      {/* HEADER */}
      <header className="border border-green-900 p-4 flex flex-col md:flex-row justify-between items-center mb-6 bg-black/50 backdrop-blur shrink-0">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold tracking-widest text-green-500 flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${isAgentEngaged ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            DELPHI // ASYMMETRIC.AGENT
          </h1>
          <p className="text-xs text-green-700 tracking-widest mt-1">AUTONOMOUS SENTIMENT DISCREPANCY NETWORK V2.5</p>
        </div>
        
        <div className="flex items-center gap-4">
          {isAgentEngaged && (
            <div className="text-xs border border-green-900 px-3 py-2 bg-green-950/20 tracking-widest">
              NEXT UPDATE IN: <strong className="text-green-300 ml-2">{countdown}S</strong>
            </div>
          )}
          <button
            onClick={() => setIsAgentEngaged(!isAgentEngaged)}
            className={`px-6 py-2 text-xs uppercase font-bold tracking-widest border transition-all ${
              isAgentEngaged 
                ? "bg-red-950/20 border-red-900 text-red-500 hover:bg-red-900/40" 
                : "bg-green-950/20 border-green-700 text-green-400 hover:bg-green-900/40"
            }`}
          >
            {isAgentEngaged ? "Halt Autonomous Agent" : "Engage Autonomous Agent"}
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* LEFT COLUMN: Controls & Watchlist */}
        <div className="md:col-span-3 flex flex-col gap-6 min-h-0">
          {/* Manual Override */}
          <div className="border border-green-900 p-4 bg-black/40">
            <h3 className="text-xs text-green-700 tracking-widest mb-3">$ MANUAL_OVERRIDE_QUERY</h3>
            <form onSubmit={handleManualOverride}>
              <input 
                type="text" 
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                placeholder="Add to radar..."
                disabled={isFetching}
                className="w-full bg-black border border-green-900 p-2 text-sm text-green-300 focus:outline-none focus:border-green-500 placeholder-green-900 transition-colors disabled:opacity-50"
              />
            </form>
          </div>

          {/* Watchlist Matrix */}
          <div className="border border-green-900 p-4 bg-black/40 flex-1 flex flex-col min-h-0">
            <h3 className="text-xs text-green-700 tracking-widest mb-4">ACTIVE WATCHLIST MATRIX</h3>
            <div className="flex flex-col gap-2 overflow-y-auto pr-2">
              {watchlist.map((item, idx) => (
                <div 
                  key={item} 
                  onClick={() => handleWatchlistClick(idx, item)}
                  className={`p-2 text-sm border flex justify-between items-center transition-colors cursor-pointer hover:bg-green-900/20 hover:border-green-700 ${
                    idx === currentTopicIndex 
                      ? "border-green-500 bg-green-950/30 text-green-300" 
                      : "border-green-900/50 text-green-700"
                  }`}
                >
                  <span>{item}</span>
                  {isAgentEngaged && idx === currentTopicIndex && (
                    <span className="text-[10px] animate-pulse">SCANNING</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Terminal Logs */}
          <div className="border border-green-900 p-4 bg-black/60 h-48 flex flex-col font-mono text-[10px] leading-relaxed">
            <div className="overflow-y-auto flex-1 pr-2 flex flex-col gap-1 text-green-600/80">
              {terminalLogs.length === 0 ? (
                <span>System idle. Waiting for engagement...</span>
              ) : (
                terminalLogs.map((log, i) => (
                  <span key={i} className={log.includes('[ERR]') ? 'text-red-500/80' : log.includes('[USER]') ? 'text-blue-400/80' : ''}>
                    {log}
                  </span>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Active Analytics */}
        <div className="md:col-span-6 flex flex-col gap-6 min-h-0">
          {!activeSignal ? (
            <div className="flex-1 border border-green-900 flex items-center justify-center bg-black/20">
              <p className="text-green-800 tracking-widest text-sm animate-pulse">AWAITING TELEMETRY...</p>
            </div>
          ) : (
            <>
              {/* Top Analytical Thesis Box */}
              <div className={`border p-5 bg-black/60 transition-colors ${getStatusColor(activeSignal.analysis.status)}`}>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-sm tracking-widest uppercase">
                    [TARGET // {activeSignal.topic}]
                  </h2>
                  <span className="text-xs font-bold tracking-widest">{activeSignal.analysis.status}</span>
                </div>
                <p className="text-sm leading-relaxed text-green-100/90">
                  {activeSignal.analysis.analyticalThesis}
                </p>
              </div>

              {/* Discrepancy Index Bar */}
              <div className="border border-green-900 p-5 bg-black/40">
                <div className="flex justify-between text-xs tracking-widest mb-3 text-green-600">
                  <span>MARKET DISCREPANCY INDEX</span>
                  <span>{activeSignal.analysis.discrepancyIndex} / 100</span>
                </div>
                <div className="h-4 w-full border border-green-900 bg-black relative overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${getStatusBg(activeSignal.analysis.status)}`}
                    style={{ width: `${activeSignal.analysis.discrepancyIndex}%` }}
                  />
                </div>
              </div>

              {/* Data Sources Grid */}
              <div className="grid grid-cols-2 gap-4 flex-1">
                {/* Polymarket Segment */}
                <div className="border border-green-900 p-4 bg-black/40 flex flex-col">
                  <h3 className="text-xs text-green-700 tracking-widest mb-4">POLYMARKET DATA</h3>
                  <div className="flex flex-col gap-4">
                    <div>
                      <span className="text-[10px] text-green-700 block mb-1">PREDICTION ODDS</span>
                      <p className="text-2xl text-green-400 font-bold">{activeSignal?.marketData?.predictionOdds || 0}%</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-green-700 block mb-1">VOLUME TRANSACTED</span>
                      <span className="text-lg text-green-500">{activeSignal?.marketData?.volume || "$0.00"}</span>
                    </div>
                  </div>
                </div>

                {/* Reuters & Telemetry Segment */}
                <div className="border border-green-900 p-4 bg-black/40 flex flex-col">
                  <h3 className="text-xs text-green-700 tracking-widest mb-4">WIRE & TELEMETRY</h3>
                  <div className="flex flex-col gap-4 overflow-y-auto pr-2">
                    <div>
                      <span className="text-[10px] text-green-700 block mb-1">REUTERS FEED</span>
                      <p className="text-xs italic text-green-400">
                        {activeSignal?.newsData?.headline ? `"${activeSignal.newsData.headline}"` : "Awaiting wire signals..."}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-green-700 block mb-1">MOMENTUM & RETAIL</span>
                      <p className="text-sm text-green-500">{activeSignal?.newsData?.telemetry || "Flat / Stable"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Signal History */}
        <div className="md:col-span-3 flex flex-col gap-6 min-h-0">
          <div className="border border-green-900 p-4 bg-black/40 flex-1 flex flex-col min-h-0">
            <h3 className="text-xs text-green-700 tracking-widest mb-4">ARCHIVED SIGNALS</h3>
            <div className="flex flex-col gap-3 overflow-y-auto pr-2">
              {memoryCache.length === 0 ? (
                <span className="text-[10px] text-green-700">No sweeps archived yet.</span>
              ) : (
                memoryCache.map((sig, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleArchiveClick(sig)}
                    className="border border-green-900/50 p-3 flex flex-col gap-2 text-xs cursor-pointer hover:bg-green-900/20 hover:border-green-700 transition-colors"
                  >
                    <div className="flex justify-between items-center text-green-600">
                      <span>{sig.topic}</span>
                      <span className={getStatusColor(sig.analysis.status)}>{sig.analysis.status}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>MDI: {sig.analysis.discrepancyIndex}/100</span>
                      <span className="text-green-800">
                        {new Date(sig.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}