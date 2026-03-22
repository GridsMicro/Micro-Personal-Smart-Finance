"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getMarketHistory } from "../actions/marketActions";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export const dynamic = "force-dynamic";

const ASSETS = ["BTC", "ETH", "SOL", "USDT"];
const ASSET_THEMES: Record<string, { color: string, bg: string, border: string }> = {
  BTC: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.2)" },
  ETH: { color: "#6366f1", bg: "rgba(99, 102, 241, 0.1)", border: "rgba(99, 102, 241, 0.2)" },
  SOL: { color: "#14b8a6", bg: "rgba(20, 184, 166, 0.1)", border: "rgba(20, 184, 166, 0.2)" },
  USDT: { color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.2)" },
};

const PartnerLogos = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-items-center opacity-70">
    <a href="https://www.binance.th/th" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all duration-300 hover:opacity-100 hover:scale-105">
       <img src="/coins/BINANCE-EX.png" className="h-6 object-contain" alt="binance-th" />
       <span className="font-extrabold text-[10px] tracking-tighter text-white">Binance <span className="text-[#F3BA2F]">TH</span></span>
    </a>
    <a href="https://www.bitkub.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all duration-300 hover:opacity-100 hover:scale-105">
       <img src="/coins/BITKUB-EX.png" className="h-6 object-contain" alt="bitkub" />
       <span className="font-black text-[10px] tracking-tighter text-[#00E08F]">Bitkub</span>
    </a>
    <a href="https://www.okx.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all duration-300 hover:opacity-100 hover:scale-105">
       <img src="/coins/OKX_logo.svg.png" className="h-6 object-contain brightness-200 contrast-200" alt="okx" />
       <span className="font-black text-[10px] tracking-tighter text-white">OKX GLOBAL</span>
    </a>
    <a href="https://coinmarketcap.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all duration-300 hover:opacity-100 hover:scale-105">
       <div className="w-5 h-5 bg-[#3861fb] rounded-full flex items-center justify-center text-[8px] font-bold">M</div>
       <span className="font-black text-[10px] tracking-tighter text-white">CoinMarketCap</span>
    </a>
    <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all duration-300 hover:opacity-100 hover:scale-105">
       <div className="w-5 h-5 bg-[#8cc63f] rounded-full flex items-center justify-center text-[8px] font-bold">G</div>
       <span className="font-black text-[10px] tracking-tighter text-white">CoinGecko</span>
    </a>
  </div>
);

export default function MarketPage() {
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const theme = ASSET_THEMES[selectedAsset] || ASSET_THEMES.BTC;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await getMarketHistory(selectedAsset);
      setHistory(data);
      setLoading(false);
    };
    loadData();
  }, [selectedAsset]);

  // DCA Logic Calculation (฿100 Monthly per month)
  const calculateDCA = () => {
    if (history.length === 0) return [];
    const yearlyData: Record<number, { cost: number, btc: number, lastPrice: number }> = {};
    
    history.forEach(point => {
      const date = new Date(point.date);
      const year = date.getFullYear();
      if (!yearlyData[year]) yearlyData[year] = { cost: 0, btc: 0, lastPrice: 0 };
      
      const priceTHB = parseFloat(point.priceTHB);
      yearlyData[year].cost += 100;
      yearlyData[year].btc += (100 / priceTHB);
      yearlyData[year].lastPrice = priceTHB;
    });

    return Object.entries(yearlyData).map(([year, data]) => {
      const value = data.btc * data.lastPrice;
      const profit = value - data.cost;
      const profitPercent = (profit / data.cost) * 100;
      return {
        year: parseInt(year),
        cost: data.cost,
        value: Math.round(value),
        profit: Math.round(profit),
        profitPercent: profitPercent.toFixed(2),
        units: data.btc.toFixed(6)
      };
    }).sort((a, b) => b.year - a.year);
  };

  const dcaReport = calculateDCA();

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#27272a] text-white font-black tracking-widest text-sm animate-pulse">SYNCING {selectedAsset} MARKET...</div>;

  return (
    <div className="min-h-screen bg-[#27272a] text-white font-sans pb-20 overflow-x-hidden">
      
      <header className="sticky top-0 z-[100] border-b border-white/5 bg-[#27272a]/90 backdrop-blur-xl h-20">
        <div className="max-w-[1400px] mx-auto px-6 h-full flex justify-between items-center gap-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl shadow-2xl">💡</div>
              <div>
                 <h1 className="font-black text-lg tracking-tighter uppercase leading-none">SMART MARKET</h1>
                 <p className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5">PUBLIC TREND TRACKER</p>
              </div>
           </div>

           {/* Asset Selector Tabs */}
           <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              {ASSETS.map(asset => (
                <button 
                  key={asset} 
                  onClick={() => setSelectedAsset(asset)}
                  className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${selectedAsset === asset ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"}`}
                >
                   {asset}
                </button>
              ))}
           </div>

           <div className="hidden sm:block">
              <Link href="/dashboard" className="px-5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">My Portfolio</Link>
           </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-10">
        
        {/* Trend Visualization Section */}
        <section className="mb-12">
           <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-[3rem] shadow-2xl">
              <div className="flex justify-between items-end mb-8">
                 <div>
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em] mb-3">{selectedAsset} Valuation Trend (5-Year)</h3>
                    <h2 className="text-4xl font-black tracking-tighter">{selectedAsset} History <span className="text-zinc-700 text-sm">/ Monthly Snapshot</span></h2>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-1 inline-block border" style={{ color: theme.color, backgroundColor: theme.bg, borderColor: theme.border }}>Market Node Active</p>
                 </div>
              </div>
              <div className="h-[450px] w-full mt-10">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={history}>
                      <defs>
                        <linearGradient id="colorAsset" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.color} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={theme.color} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                      <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} orientation="right" tickFormatter={(val) => `฿${parseFloat(val).toLocaleString()}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.5rem" }}
                        itemStyle={{ color: theme.color, fontSize: "12px", fontWeight: "900" }}
                        labelStyle={{ color: "#666", fontSize: "10px", fontWeight: "black", marginBottom: "4px" }}
                      />
                      <Area type="monotone" dataKey="priceTHB" stroke={theme.color} strokeWidth={4} fillOpacity={1} fill="url(#colorAsset)" />
                   </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           
           {/* DCA Simulator Performance */}
           <div className="lg:col-span-12">
              <div className="flex items-center gap-4 mb-8">
                 <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em]">Monthly Simulation: {selectedAsset} DCA (฿100/mo)</h3>
                 <div className="h-px flex-1 bg-white/5"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                 {dcaReport.map(report => (
                   <div key={report.year} className="p-8 bg-zinc-900 border border-white/5 rounded-[2.5rem] shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
                      <div className="flex justify-between items-start mb-6">
                         <span className="text-sm font-black text-white/20 tracking-widest">{report.year} REPORT</span>
                         <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${parseFloat(report.profitPercent) >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                           {parseFloat(report.profitPercent) >= 0 ? "Profit" : "Drawdown"}
                         </span>
                      </div>
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Portfolio Appraisal</p>
                      <h4 className="text-3xl font-black tracking-tighter mb-4">฿{report.value.toLocaleString()}</h4>
                      
                      <div className="space-y-4 pt-4 border-t border-white/5">
                         <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-zinc-600">Total Basis</span>
                            <span className="text-white">฿{report.cost.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-zinc-600">Held Units</span>
                            <span className="text-white">{report.units} {selectedAsset}</span>
                         </div>
                         <div className="flex justify-between text-[11px] font-bold items-center">
                            <span className="text-zinc-600">Annual Return</span>
                            <span className={`px-2 py-0.5 rounded-lg font-black ${parseFloat(report.profitPercent) >= 0 ? "text-green-500 bg-green-500/5" : "text-red-500 bg-red-500/5"}`}>
                               {parseFloat(report.profitPercent) >= 0 ? "+" : ""}{report.profitPercent}%
                            </span>
                         </div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-1 opacity-40 transition-all group-hover:h-2" style={{ backgroundColor: theme.color }}></div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Detailed Log Table */}
           <div className="lg:col-span-12 mt-12">
              <div className="flex items-center gap-4 mb-8">
                 <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em]">Audit Trail: {selectedAsset} Snapshots</h3>
                 <div className="h-px flex-1 bg-white/5"></div>
              </div>
              <div className="p-8 bg-zinc-900 border border-white/5 rounded-[3rem] overflow-hidden">
                 <div className="overflow-x-auto overflow-y-auto max-h-[800px] custom-scrollbar">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-white/5 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                             <th className="pb-6">Snapshot Point</th>
                             <th className="pb-6">Valuation (USD)</th>
                             <th className="pb-6">Valuation (THB)</th>
                             <th className="pb-6">Node Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/[0.03]">
                          {history.slice().reverse().map(point => (
                             <tr key={point.id} className="group hover:bg-white/[0.01] transition-all">
                                <td className="py-6 text-sm font-black text-white">{new Date(point.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                <td className="py-6 text-sm font-mono text-zinc-400">${parseFloat(point.priceUSD).toLocaleString()}</td>
                                <td className="py-6 text-sm font-black" style={{ color: theme.color }}>฿{parseFloat(point.priceTHB).toLocaleString()}</td>
                                <td className="py-6">
                                   <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.color }}></div>
                                      <span className="text-[9px] font-black text-zinc-700 uppercase">Synchronized</span>
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </div>
      </main>

      {/* 🏁 Footer */}
      <footer className="mt-20 border-t border-white/5 py-12 px-6 bg-black/10">
         <div className="max-w-[1400px] mx-auto flex flex-col items-center gap-8">
            <div className="text-center">
               <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.5em] mb-6">Real-time Data Sourced Via</h3>
               <PartnerLogos />
            </div>
            <p className="text-[9px] font-black text-zinc-800 uppercase tracking-widest">© 2026 SMART PLANNER • Official Market Terminal</p>
         </div>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
      `}</style>
    </div>
  );
}
