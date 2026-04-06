"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BinanceThSymbol {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  volume: string;
}

export default function BinanceTerminal() {
  const [symbols, setSymbols] = useState<BinanceThSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBinanceTh = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/binance-th", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSymbols(data.thbPairs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBinanceTh();
    const interval = setInterval(fetchBinanceTh, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1f] flex items-center justify-center">
        <div className="text-neon-cyan font-mono animate-pulse">LOADING BINANCE TH DATA...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1f] text-slate-200">
      <header className="border-b border-slate-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/binance-th.png" alt="Binance TH" className="h-8" />
            <h1 className="text-xl font-black text-white">BINANCE TH <span className="text-neon-cyan">TERMINAL</span></h1>
            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">Moved to tools/</span>
          </div>
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl">
            Error: {error}
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr className="text-slate-400 text-left">
                  <th className="p-4">Symbol</th>
                  <th className="p-4">Last Price</th>
                  <th className="p-4">24h Change</th>
                  <th className="p-4">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {symbols.map((s) => (
                  <tr key={s.symbol} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-white">{s.symbol}</td>
                    <td className="p-4 font-mono text-neon-cyan">{parseFloat(s.lastPrice).toLocaleString()}</td>
                    <td className={`p-4 font-mono ${parseFloat(s.priceChangePercent) >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {parseFloat(s.priceChangePercent) >= 0 ? "+" : ""}{s.priceChangePercent}%
                    </td>
                    <td className="p-4 font-mono text-slate-400">{parseFloat(s.volume).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
