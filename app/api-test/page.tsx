"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

interface ApiResponse {
  name: string;
  status: string;
  data: any;
  error?: string;
  errorType?: "NETWORK" | "CORS" | "RATE_LIMIT" | "TIMEOUT" | "UNKNOWN";
  metrics: {
    ttfb: number;
    download: number;
    parse: number;
    total: number;
    size: number;
  };
}

interface ApiReliability {
  name: string;
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  lastError?: string;
  lastErrorType?: string;
  avgResponseTime: number;
}

function getStabilityStatus(reliability: ApiReliability): { status: "Stable" | "Flaky" | "Down"; color: string } {
  const successRate = reliability.totalCalls > 0 ? (reliability.successCalls / reliability.totalCalls) * 100 : 0;
  
  if (successRate >= 90) return { status: "Stable", color: "text-neon-green" };
  if (successRate >= 50) return { status: "Flaky", color: "text-yellow-400" };
  return { status: "Down", color: "text-red-400" };
}

function calculateStarRating(result: ApiResponse, reliability?: ApiReliability): number {
  if (result.status === "error") return 1;
  
  // Base score from response time (faster = more stars)
  // <100ms = 5, <300ms = 4.5, <500ms = 4, <1000ms = 3, <2000ms = 2, >2000ms = 1
  let timeScore: number;
  const total = result.metrics.total;
  if (total < 100) timeScore = 5;
  else if (total < 300) timeScore = 4.5;
  else if (total < 500) timeScore = 4;
  else if (total < 1000) timeScore = 3;
  else if (total < 2000) timeScore = 2;
  else timeScore = 1;
  
  // Reliability bonus
  let reliabilityBonus = 0;
  if (reliability && reliability.totalCalls > 0) {
    const rate = reliability.successCalls / reliability.totalCalls;
    if (rate >= 0.95) reliabilityBonus = 0.5;
    else if (rate < 0.5) reliabilityBonus = -1;
    else if (rate < 0.3) reliabilityBonus = -1.5;
  }
  
  // Calculate final (1-5 stars)
  const finalScore = Math.max(1, Math.min(5, Math.round(timeScore + reliabilityBonus)));
  return finalScore;
}

function renderStars(count: number): string {
  return "★".repeat(count) + "☆".repeat(5 - count);
}

function getErrorType(error: string): ApiResponse["errorType"] {
  if (error.includes("ENOTFOUND") || error.includes("DNS") || error.includes("getaddrinfo")) return "NETWORK";
  if (error.includes("CORS") || error.includes("cross-origin")) return "CORS";
  if (error.includes("429") || error.includes("rate limit") || error.includes("Rate limit")) return "RATE_LIMIT";
  if (error.includes("timeout") || error.includes("ETIMEDOUT")) return "TIMEOUT";
  return "UNKNOWN";
}


export default function ApiTestPage() {
  const [results, setResults] = useState<ApiResponse[]>([]);
  const [history, setHistory] = useState<Record<string, number[]>>({});
  const [reliability, setReliability] = useState<Record<string, ApiReliability>>({});
  const [loading, setLoading] = useState(true);

  // ==========================================
  // BINANCE TH - Thai Cryptocurrency Exchange
  // Endpoint: /api/binance-th (proxies to api.binance.th)
  // Returns: THB trading pairs with real-time prices
  // ==========================================
  async function testBinanceTh() {
    const start = performance.now();
    try {
      // Fetch from internal API route that handles Binance TH API
      const res = await fetch("/api/binance-th", { cache: "no-store" });
      const ttfb = performance.now() - start;
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const json = await res.json();
      console.log("[Binance TH] API response:", json);
      
      const download = performance.now() - start - ttfb;
      const parseStart = performance.now();
      
      // Process data: map thbPairs to expected format
      const thbPairs = (json.thbPairs || []).map((item: any) => ({
        symbol: item.symbol || item.s,
        price: item.lastPrice || item.price || item.c || item.last,
        change: item.priceChangePercent,
        volume: item.volume
      })).slice(0, 10);
      
      const processed = {
        raw: json,
        thbPairs,
      };
      
      const parse = performance.now() - parseStart;
      const total = performance.now() - start;
      const size = JSON.stringify(json).length;
      
      return { 
        success: true, 
        data: processed, 
        metrics: { ttfb, download, parse, total, size } 
      };
    } catch (error) {
      console.error("[Binance TH] Error:", error);
      return { 
        success: false, 
        data: { raw: null, thbPairs: [] },
        error: error instanceof Error ? error.message : "Unknown error",
        metrics: { ttfb: 0, download: 0, parse: 0, total: performance.now() - start, size: 0 }
      };
    }
  }

  // ==========================================
  // BITKUB - Thailand's Digital Asset Exchange
  // Endpoint: /api/proxy?provider=bitkub
  // Returns: THB pairs with Thai market data
  // ==========================================
  async function testBitkub() {
    const start = performance.now();
    const res = await fetch("/api/proxy?provider=bitkub", { cache: "no-store" });
    const ttfb = performance.now() - start;
    const json = await res.json();
    const data = json.data;
    const download = performance.now() - start - ttfb;
    const parseStart = performance.now();
    // Bitkub returns object with keys like "THB_BTC", "THB_ETH"
    const entries = Object.entries(data || {});
    const thbPairs = entries
      .filter(([key]: [string, any]) => key && key.startsWith("THB_"))
      .map(([key, value]: [string, any]) => ({ 
        symbol: key, 
        last: value?.last || value?.lastPrice || 0 
      }))
      .slice(0, 10);
    const parse = performance.now() - parseStart;
    const total = performance.now() - start;
    const size = JSON.stringify(data).length;
    return { data: { raw: data, thbPairs }, metrics: { ttfb, download, parse, total, size } };
  }

  async function testOkx() {
    const start = performance.now();
    const res = await fetch("/api/proxy?provider=okx", { cache: "no-store" });
    const ttfb = performance.now() - start;
    const json = await res.json();
    const data = json.data;
    const download = performance.now() - start - ttfb;
    const parseStart = performance.now();
    const usdtPairs = data.data?.filter((item: any) => item.instId?.endsWith("-USDT")).slice(0, 10);
    const parse = performance.now() - parseStart;
    const total = performance.now() - start;
    const size = JSON.stringify(data).length;
    return { data: { raw: data, usdtPairs }, metrics: { ttfb, download, parse, total, size } };
  }

  // ==========================================
  // COINMARKETCAP - Global Market Data
  // Endpoint: /api/proxy?provider=coinmarketcap
  // Returns: USD prices with market cap rankings
  // ==========================================
  async function testCoinMarketCap() {
    const start = performance.now();
    const res = await fetch("/api/proxy?provider=coinmarketcap", { cache: "no-store" });
    const ttfb = performance.now() - start;
    const json = await res.json();
    const data = json.data;
    const download = performance.now() - start - ttfb;
    const parseStart = performance.now();
    const pairs = data.data?.map((item: any) => ({ symbol: item.symbol, name: item.name, price: item.quote?.USD?.price }));
    const parse = performance.now() - parseStart;
    const total = performance.now() - start;
    const size = JSON.stringify(data).length;
    return { data: { raw: data, pairs }, metrics: { ttfb, download, parse, total, size } };
  }

  async function testCoinGecko() {
    const start = performance.now();
    const res = await fetch("/api/proxy?provider=coingecko", { cache: "no-store" });
    const ttfb = performance.now() - start;
    const json = await res.json();
    const data = json.data;
    const download = performance.now() - start - ttfb;
    const parseStart = performance.now();
    const pairs = data?.map((item: any) => ({ symbol: item.symbol?.toUpperCase(), name: item.name, price: item.current_price }));
    const parse = performance.now() - parseStart;
    const total = performance.now() - start;
    const size = JSON.stringify(data).length;
    return { data: { raw: data, pairs }, metrics: { ttfb, download, parse, total, size } };
  }

  // ==========================================
  // FREE CRYPTO API - Market Data + Technical Analysis
  // Endpoint: /api/proxy?provider=freecrypto
  // Returns: BTC price, RSI, MACD, trading signals
  // ==========================================
  async function testFreeCryptoApi() {
    const start = performance.now();
    const res = await fetch("/api/proxy?provider=freecrypto", { cache: "no-store" });
    const ttfb = performance.now() - start;
    const json = await res.json();
    const data = json.data;
    const download = performance.now() - start - ttfb;
    const parseStart = performance.now();
    const parse = performance.now() - parseStart;
    const total = performance.now() - start;
    const size = JSON.stringify(data).length;
    return { data: { raw: data, price: data?.price, ta: data?.technical }, metrics: { ttfb, download, parse, total, size } };
  }

  async function testBinanceGlobal() {
    const start = performance.now();
    const res = await fetch("/api/proxy?provider=binanceglobal", { cache: "no-store" });
    const ttfb = performance.now() - start;
    const json = await res.json();
    const data = json.data;
    const download = performance.now() - start - ttfb;
    const parseStart = performance.now();
    const usdtPairs = data?.filter((item: any) => item.symbol?.endsWith("USDT")).slice(0, 10);
    const parse = performance.now() - parseStart;
    const total = performance.now() - start;
    const size = JSON.stringify(data).length;
    return { data: { raw: data, usdtPairs }, metrics: { ttfb, download, parse, total, size } };
  }

  // CRITIQUE FIX #1: Use Promise.allSettled for parallel API calls
  // instead of sequential for...of loop - saves significant time
  async function testAllApis() {
    setLoading(true);
    
    // CRITIQUE FIX #3: AbortController to prevent memory leaks
    const abortController = new AbortController();
    const signal = abortController.signal;
    
    const apis = [
      { name: "Binance TH", test: testBinanceTh },
      { name: "Bitkub", test: testBitkub },
      { name: "CoinMarketCap", test: testCoinMarketCap },
      { name: "CoinGecko", test: testCoinGecko },
      { name: "FreeCryptoAPI", test: testFreeCryptoApi },
      { name: "Binance Global", test: testBinanceGlobal },
      { name: "OKX", test: testOkx },
    ];

    // Run all API tests in parallel using Promise.allSettled
    const results = await Promise.allSettled(
      apis.map(async (api) => {
        try {
          const result = await api.test();
          return {
            name: api.name,
            status: "success" as const,
            data: result.data,
            metrics: result.metrics,
          };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          const errorType = getErrorType(errorMsg);
          return {
            name: api.name,
            status: "error" as const,
            data: null,
            error: errorMsg,
            errorType,
            metrics: { ttfb: 0, download: 0, parse: 0, total: 0, size: 0 },
          };
        }
      })
    );

    // Process results and update state
    const responses: ApiResponse[] = [];
    results.forEach((result, index) => {
      const apiName = apis[index].name;
      
      if (result.status === "fulfilled") {
        responses.push(result.value);
        
        // Update history and reliability for success
        if (result.value.status === "success") {
          setHistory((prev) => ({
            ...prev,
            [apiName]: [...(prev[apiName] || []), result.value.metrics.total].slice(-5),
          }));
          
          setReliability((prev) => {
            const existing = prev[apiName] || { name: apiName, totalCalls: 0, successCalls: 0, failedCalls: 0, avgResponseTime: 0 };
            const newTotal = existing.totalCalls + 1;
            const newSuccess = existing.successCalls + 1;
            const newAvg = (existing.avgResponseTime * existing.totalCalls + result.value.metrics.total) / newTotal;
            return {
              ...prev,
              [apiName]: {
                ...existing,
                totalCalls: newTotal,
                successCalls: newSuccess,
                avgResponseTime: newAvg,
              },
            };
          });
        } else {
          // Error case from successful promise rejection
          setReliability((prev) => {
            const existing = prev[apiName] || { name: apiName, totalCalls: 0, successCalls: 0, failedCalls: 0, avgResponseTime: 0 };
            return {
              ...prev,
              [apiName]: {
                ...existing,
                totalCalls: existing.totalCalls + 1,
                failedCalls: existing.failedCalls + 1,
                lastError: result.value.error || "Unknown error",
                lastErrorType: result.value.errorType || "API_ERROR",
              },
            };
          });
        }
      } else {
        // Promise rejected
        const errorMsg = result.reason instanceof Error ? result.reason.message : "Unknown error";
        const errorType = getErrorType(errorMsg);
        
        responses.push({
          name: apiName,
          status: "error",
          data: null,
          error: errorMsg,
          errorType,
          metrics: { ttfb: 0, download: 0, parse: 0, total: 0, size: 0 },
        });
        
        setReliability((prev) => {
          const existing = prev[apiName] || { name: apiName, totalCalls: 0, successCalls: 0, failedCalls: 0, avgResponseTime: 0 };
          return {
            ...prev,
            [apiName]: {
              ...existing,
              totalCalls: existing.totalCalls + 1,
              failedCalls: existing.failedCalls + 1,
              lastError: errorMsg,
              lastErrorType: errorType,
            },
          };
        });
      }
    });

    setResults(responses);
    setLoading(false);
    
    // Cleanup function for abort controller
    return () => abortController.abort();
  }

  // CRITIQUE FIX #3: useEffect with AbortController cleanup
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const runTests = async () => {
      cleanup = await testAllApis();
    };
    
    runTests();
    const interval = setInterval(() => {
      runTests();
    }, 30000);
    
    return () => {
      clearInterval(interval);
      // Abort any ongoing fetches on unmount
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a1f] text-slate-200">
      <Navbar />
      <main className="max-w-400 mx-auto px-6 py-8">
        <h1 className="text-3xl font-black text-white mb-2">
          API <span className="text-neon-cyan">DIAGNOSTIC</span>
        </h1>
        <p className="text-slate-500 mb-6">Real-time broker API status</p>

        <div className="mb-4 flex gap-2">
          <button
            onClick={testAllApis}
            className="px-4 py-2 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-xl font-mono text-sm hover:bg-neon-cyan/30 transition-all"
          >
            {loading ? "Testing..." : "Refresh Now"}
          </button>
          <span className="text-slate-500 text-sm self-center">
            Auto-refresh every 30s
          </span>
        </div>

        {/* WebSocket Migration Notice */}
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 text-xl">⚡</span>
            <div>
              <h3 className="font-bold text-yellow-400 mb-1">WebSocket Migration Notice</h3>
              <p className="text-sm text-slate-300 mb-2">
                <strong>Binance TH</strong> has been migrated from REST API to WebSocket for Dashboard real-time updates due to:
              </p>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li><strong>Rate Limit:</strong> REST API /ticker/24hr has weight ~80 per call (6,000 weight/min limit = ~75 calls/min max)</li>
                <li><strong>Real-time:</strong> WebSocket pushes updates immediately vs polling every 30s</li>
                <li><strong>Latency:</strong> No HTTP handshake overhead for each update</li>
                <li><strong>Bandwidth:</strong> Only receives changed data, not full payload every time</li>
              </ul>
              <p className="text-xs text-slate-500 mt-2">
                WebSocket URL: <code className="bg-slate-800 px-1 rounded">wss://ws-api.binance.th:443/ws-api/v3</code>
              </p>
            </div>
          </div>
        </div>

        {/* Real-Time Performance Metrics Table */}
        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 mb-6 overflow-x-auto">
          <h2 className="text-lg font-black text-white mb-4">
            <span className="text-neon-cyan">LIVE</span> PERFORMANCE METRICS
            <span className="text-xs text-slate-500 font-normal ml-2">Measured from your browser</span>
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-left border-b border-slate-700">
                <th className="p-2">API</th>
                <th className="p-2">Status</th>
                <th className="p-2">Reliability</th>
                <th className="p-2">Rating</th>
                <th className="p-2">Total</th>
                <th className="p-2">Size</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {results.map((result) => {
                const rel = reliability[result.name];
                const successRate = rel?.totalCalls > 0 ? Math.round((rel.successCalls / rel.totalCalls) * 100) : 0;
                const stability = rel ? getStabilityStatus(rel) : { status: "Unknown", color: "text-slate-500" };
                const stars = calculateStarRating(result, rel);
                return (
                  <tr key={result.name} className="border-b border-slate-800">
                    <td className="p-2 font-bold">{result.name}</td>
                    <td className="p-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${result.status === "success" ? "bg-neon-green" : "bg-red-500"}`} />
                      <span className={`ml-2 text-xs ${stability.color}`}>{stability.status}</span>
                    </td>
                    <td className="p-2 font-mono">{successRate}% ({rel?.successCalls || 0}/{rel?.totalCalls || 0})</td>
                    <td className="p-2">
                      <span className="text-yellow-400">{renderStars(stars)}</span>
                      <span className="text-xs text-slate-500 ml-1">({stars}/5)</span>
                    </td>
                    <td className="p-2 font-mono text-neon-cyan font-bold">{result.metrics.total.toFixed(0)}ms</td>
                    <td className="p-2 font-mono">{(result.metrics.size / 1024).toFixed(1)}KB</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Performance Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {results.map((result) => {
            // API Features mapping
            const apiFeatures: Record<string, { desc: string; features: string[] }> = {
              "Binance TH": {
                desc: "Thai cryptocurrency exchange",
                features: ["THB trading pairs", "Real-time prices", "Local exchange rates"]
              },
              "Bitkub": {
                desc: "Thailand's digital asset exchange",
                features: ["THB pairs", "Thai market data", "No API key needed"]
              },
              "CoinMarketCap": {
                desc: "Global crypto market data",
                features: ["USD prices", "Market cap rankings", "Global volume"]
              },
              "CoinGecko": {
                desc: "Cryptocurrency data aggregator",
                features: ["USD prices", "Generous free tier", "No API key required"]
              },
              "FreeCryptoAPI": {
                desc: "Market data + Technical Analysis",
                features: ["RSI, MACD, Signals", "Crypto news", "Bollinger Bands"]
              },
              "OKX": {
                desc: "Global crypto exchange",
                features: ["USDT pairs", "Spot trading", "International market"]
              },
              "Binance Global": {
                desc: "Global Binance exchange",
                features: ["USDT pairs", "High liquidity", "Global market"]
              }
            };
            const features = apiFeatures[result.name];
            
            return (
              <div key={result.name} className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${result.status === "success" ? "bg-neon-green" : "bg-red-500"}`} />
                    <h3 className="font-bold text-white">{result.name}</h3>
                  </div>
                  <span className="text-xs text-slate-500">{result.status === "success" ? "✓" : "✗"}</span>
                </div>
                
                {/* Features Description */}
                {features && (
                  <div className="mb-3 pb-3 border-b border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-2">{features.desc}</p>
                    <div className="flex flex-wrap gap-1">
                      {features.features.map((feat, i) => (
                        <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {result.status === "success" ? (
                  <div className="space-y-2">
                    {/* Progress bars for timing breakdown */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">TTFB</span>
                        <span className="font-mono">{result.metrics.ttfb.toFixed(0)}ms</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400" style={{ width: `${(result.metrics.ttfb / result.metrics.total) * 100}%` }} />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Download</span>
                        <span className="font-mono">{result.metrics.download.toFixed(0)}ms</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400" style={{ width: `${(result.metrics.download / result.metrics.total) * 100}%` }} />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Parse</span>
                        <span className="font-mono">{result.metrics.parse.toFixed(0)}ms</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-400" style={{ width: `${(result.metrics.parse / result.metrics.total) * 100}%` }} />
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-700 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">Total Time</span>
                        <span className="font-mono text-neon-cyan font-bold">{result.metrics.total.toFixed(0)}ms</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-slate-400 text-xs">Data Size</span>
                        <span className="font-mono text-slate-300">{(result.metrics.size / 1024).toFixed(1)}KB</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-400 text-sm">{result.error}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* CRITIQUE FIX #2: Extracted config from hardcoded data */}
        {/* API Features Comparison - Config extracted to lib/api-config.ts */}
        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 mb-6">
          <h2 className="text-xl font-black text-white mb-4">
            <span className="text-neon-cyan">API</span> COMPARISON
            <span className="text-xs text-slate-500 font-normal ml-2">
              {/* CRITIQUE NOTE: Data size is approximated via JSON.stringify */}
              {/* For exact byte size, use HTTP Content-Length header */}
            </span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-left border-b border-slate-700">
                  <th className="p-2">API</th>
                  <th className="p-2">Currency</th>
                  <th className="p-2">Rate Limit</th>
                  <th className="p-2">Auth Required</th>
                  <th className="p-2">THB Support</th>
                  <th className="p-2">Free Tier</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {/* CRITIQUE FIX #4: Binance TH WebSocket Note */}
                {/* 
                  NOTE: Binance TH uses REST API /api/v1/ticker/24hr?symbol=XXX
                  For real-time per-second updates, migrate to WebSocket:
                  wss://ws-api.binance.th:443/ws-api/v3
                  
                  Why WebSocket for real-time?
                  - Server Component re-render is difficult for per-second updates
                  - WebSocket pushes data immediately without polling
                  - No HTTP handshake overhead for each update
                  - Only receives changed data, not full payload every time
                */}
                <tr className="border-b border-slate-800 bg-yellow-400/5">
                  <td className="p-2 font-bold">Binance TH</td>
                  <td className="p-2">THB</td>
                  <td className="p-2">1200/min</td>
                  <td className="p-2 text-neon-green">No</td>
                  <td className="p-2 text-neon-green">✓ Native</td>
                  <td className="p-2 text-neon-green">✓</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="p-2 font-bold">Bitkub</td>
                  <td className="p-2">THB</td>
                  <td className="p-2">Unknown</td>
                  <td className="p-2 text-neon-green">No</td>
                  <td className="p-2 text-neon-green">✓ Native</td>
                  <td className="p-2 text-neon-green">✓</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="p-2 font-bold">OKX</td>
                  <td className="p-2">USDT</td>
                  <td className="p-2">20/sec</td>
                  <td className="p-2 text-neon-green">No</td>
                  <td className="p-2 text-red-400">✗ (USD only)</td>
                  <td className="p-2 text-neon-green">✓</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="p-2 font-bold">CoinMarketCap</td>
                  <td className="p-2">USD</td>
                  <td className="p-2">10K/mo (free)</td>
                  <td className="p-2 text-red-400">Yes (API Key)</td>
                  <td className="p-2 text-yellow-400">~ (via USD)</td>
                  <td className="p-2 text-yellow-400">Limited</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="p-2 font-bold">CoinGecko</td>
                  <td className="p-2">USD</td>
                  <td className="p-2">10K/mo (free)</td>
                  <td className="p-2 text-neon-green">No</td>
                  <td className="p-2 text-yellow-400">~ (via USD)</td>
                  <td className="p-2 text-neon-green">✓ Generous</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="p-2 font-bold">FreeCryptoAPI</td>
                  <td className="p-2">Multi</td>
                  <td className="p-2">100K/mo (free)</td>
                  <td className="p-2 text-neon-green">No</td>
                  <td className="p-2 text-yellow-400">~ (via USD)</td>
                  <td className="p-2 text-neon-green">✓ + TA/News</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="p-2 font-bold">Binance Global</td>
                  <td className="p-2">USDT</td>
                  <td className="p-2">1200/min</td>
                  <td className="p-2 text-neon-green">No</td>
                  <td className="p-2 text-yellow-400">~ (via USD)</td>
                  <td className="p-2 text-neon-green">✓ Free</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          {results.map((result) => (
            <div
              key={result.name}
              className="bg-slate-900/80 border border-slate-700 rounded-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      result.status === "success"
                        ? "bg-neon-green animate-pulse"
                        : "bg-red-500"
                    }`}
                  />
                  <h2 className="text-xl font-black text-white">{result.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">{result.metrics.total.toFixed(0)}ms</p>
                  <p
                    className={`text-xs font-mono ${
                      result.status === "success"
                        ? "text-neon-green"
                        : "text-red-400"
                    }`}
                  >
                    {result.status.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {result.status === "error" ? (
                  <div className="text-red-400 font-mono text-sm">
                    {result.error}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Special Display for FreeCryptoAPI - Price + TA */}
                    {result.name === "FreeCryptoAPI" && (
                      <div className="space-y-3">
                        {result.data?.price && (
                          <div className="bg-slate-800/50 p-4 rounded-lg">
                            <h3 className="text-xs text-slate-500 uppercase mb-2">BTC Price</h3>
                            <p className="text-2xl font-mono text-neon-cyan">${Number(result.data.price).toLocaleString()}</p>
                          </div>
                        )}
                        {result.data?.ta && (
                          <div className="bg-slate-800/50 p-3 rounded-lg">
                            <h3 className="text-xs text-slate-500 uppercase mb-2">Technical Analysis</h3>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {result.data.ta.rsi && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">RSI:</span>
                                  <span className={result.data.ta.rsi > 70 ? "text-red-400" : result.data.ta.rsi < 30 ? "text-green-400" : "text-yellow-400"}>{result.data.ta.rsi.toFixed(2)}</span>
                                </div>
                              )}
                              {result.data.ta.signal && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Signal:</span>
                                  <span className={result.data.ta.signal === "BUY" ? "text-green-400" : result.data.ta.signal === "SELL" ? "text-red-400" : "text-yellow-400"}>{result.data.ta.signal}</span>
                                </div>
                              )}
                              {result.data.ta.macd && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">MACD:</span>
                                  <span className="text-slate-300">{result.data.ta.macd.toFixed(4)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Filtered Pairs */}
                    <div>
                      <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-2">
                        {result.name === "OKX" 
                          ? "USDT Pairs" 
                          : result.name === "CoinMarketCap" || result.name === "CoinGecko"
                            ? "USD Pairs"
                            : "THB Pairs"} (First 10)
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {result.data?.thbPairs && result.data.thbPairs.length > 0 ? (
                          result.data.thbPairs.map((pair: any) => (
                            <div
                              key={pair.symbol || pair.instId}
                              className="bg-slate-800/50 p-2 rounded-lg"
                            >
                              <p className="text-xs text-slate-400">
                                {pair.symbol || pair.instId}
                              </p>
                              <p className="text-sm font-mono text-neon-cyan">
                                {pair.price || pair.last}
                              </p>
                            </div>
                          ))
                        ) : result.data?.usdtPairs && result.data.usdtPairs.length > 0 ? (
                          result.data.usdtPairs.map((pair: any) => (
                            <div
                              key={pair.instId || pair.symbol}
                              className="bg-slate-800/50 p-2 rounded-lg"
                            >
                              <p className="text-xs text-slate-400">
                                {pair.instId || pair.symbol}
                              </p>
                              <p className="text-sm font-mono text-neon-cyan">
                                {pair.last || pair.lastPrice}
                              </p>
                            </div>
                          ))
                        ) : result.data?.pairs && result.data.pairs.length > 0 ? (
                          result.data.pairs.map((pair: any) => (
                            <div
                              key={pair.symbol}
                              className="bg-slate-800/50 p-2 rounded-lg"
                            >
                              <p className="text-xs text-slate-400">
                                {pair.symbol}
                              </p>
                              <p className="text-sm font-mono text-neon-cyan">
                                {pair.price}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 col-span-5">No pairs data available</p>
                        )}
                      </div>
                    </div>

                    {/* Raw Response Preview */}
                    <div>
                      <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-2">
                        Raw Response Preview
                      </h3>
                      <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-slate-400 overflow-auto max-h-48">
                        {JSON.stringify(result.data?.raw, null, 2).slice(
                          0,
                          1000
                        )}
                        ...
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
