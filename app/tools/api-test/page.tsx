"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";

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
  
  let timeScore: number;
  const total = result.metrics.total;
  if (total < 100) timeScore = 5;
  else if (total < 300) timeScore = 4.5;
  else if (total < 500) timeScore = 4;
  else if (total < 1000) timeScore = 3;
  else if (total < 2000) timeScore = 2;
  else timeScore = 1;
  
  let reliabilityBonus = 0;
  if (reliability && reliability.totalCalls > 0) {
    const rate = reliability.successCalls / reliability.totalCalls;
    if (rate >= 0.95) reliabilityBonus = 0.5;
    else if (rate < 0.5) reliabilityBonus = -1;
    else if (rate < 0.3) reliabilityBonus = -1.5;
  }
  
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

  async function testBinanceTh() {
    const start = performance.now();
    try {
      const res = await fetch("/api/binance-th", { cache: "no-store" });
      const ttfb = performance.now() - start;
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const json = await res.json();
      const download = performance.now() - start - ttfb;
      const parseStart = performance.now();
      
      const thbPairs = (json.thbPairs || []).map((item: any) => ({
        symbol: item.symbol || item.s,
        price: item.lastPrice || item.price || item.c || item.last,
        change: item.priceChangePercent,
        volume: item.volume
      })).slice(0, 10);
      
      const parse = performance.now() - parseStart;
      const total = performance.now() - start;
      const size = JSON.stringify(json).length;
      
      return { 
        success: true, 
        data: { raw: json, thbPairs }, 
        metrics: { ttfb, download, parse, total, size } 
      };
    } catch (error) {
      return { 
        success: false, 
        data: { raw: null, thbPairs: [] },
        error: error instanceof Error ? error.message : "Unknown error",
        metrics: { ttfb: 0, download: 0, parse: 0, total: performance.now() - start, size: 0 }
      };
    }
  }

  async function testBitkub() {
    const start = performance.now();
    const res = await fetch("/api/proxy?provider=bitkub", { cache: "no-store" });
    const ttfb = performance.now() - start;
    const json = await res.json();
    const data = json.data;
    const download = performance.now() - start - ttfb;
    const parseStart = performance.now();
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

  async function testAllApis() {
    setLoading(true);
    const abortController = new AbortController();
    
    const apis = [
      { name: "Binance TH", test: testBinanceTh },
      { name: "Bitkub", test: testBitkub },
      { name: "CoinMarketCap", test: testCoinMarketCap },
      { name: "CoinGecko", test: testCoinGecko },
      { name: "FreeCryptoAPI", test: testFreeCryptoApi },
      { name: "Binance Global", test: testBinanceGlobal },
      { name: "OKX", test: testOkx },
    ];

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

    const responses: ApiResponse[] = [];
    results.forEach((result, index) => {
      const apiName = apis[index].name;
      
      if (result.status === "fulfilled") {
        responses.push(result.value);
        
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
    
    return () => abortController.abort();
  }

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
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a1f] text-slate-200">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-black text-white mb-2">
          API <span className="text-neon-cyan">DIAGNOSTIC</span>
        </h1>
        <p className="text-slate-500 mb-6">Real-time broker API status (Moved to tools/)</p>

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

        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 mb-6 overflow-x-auto">
          <h2 className="text-lg font-black text-white mb-4">
            <span className="text-neon-cyan">LIVE</span> PERFORMANCE METRICS
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
      </main>
    </div>
  );
}
