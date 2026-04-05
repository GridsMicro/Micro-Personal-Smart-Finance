"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from "recharts";
import Navbar from "../../components/Navbar";
import { IconWithFallback } from "./IconWithFallback";
import { QuantitySparkline } from "./QuantitySparkline";
import { 
  getTransactions, 
  getDailySnapshots, 
} from "../../actions/transactionActions";

// 🎨 Asset & Icon Definitions
export const SUPPORTED_ASSETS = ["THB", "USDT", "USDC", "BTC", "ETH", "BNB", "SOL", "AVAX", "ADA", "DOT", "DOGE", "XRP", "NEAR", "ORDI", "MOODENG", "GOAT", "AVEX", "SATS"];

const EXCHANGES_MAPPED = [
  { id: "BINANCE_TH", label: "Binance TH", icon: "/coins/BINANCE-EX.png" },
  { id: "BITKUB", label: "Bitkub", icon: "/coins/BITKUB-EX.png" },
  { id: "OKX", label: "OKX Global", icon: "/coins/OKX_logo.svg.png" }
];

interface Transaction {
  id: number;
  broker: string;
  asset: string;
  amount: string;
  type: "DEPOSIT" | "WITHDRAW";
}

interface DailySnapshot {
  date: string;
  totalValue: string;
  holdingsJson?: Record<string, number>;
  displayValue?: number;
}

interface PortfolioItem {
  broker: string;
  asset: string;
  amount: number;
}

interface MarketData {
  binance: Record<string, number>;
  bitkub: Record<string, number>;
  okx: Record<string, number>;
}

/**
 * DashboardContent - Main dashboard component
 * 
 * Displays portfolio tracking with:
 * - Exchange filter cards
 * - Portfolio performance chart
 * - Asset position ledger
 * - Real-time price updates
 */
export default function DashboardContent() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [marketData, setMarketData] = useState<MarketData>({ binance: {}, bitkub: {}, okx: {} });
  const [exchangeRateUSDTHB, setExchangeRateUSDTHB] = useState(36);
  const [dailyData, setDailyData] = useState<DailySnapshot[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  // Load transactions and snapshots
  useEffect(() => {
    const loadData = async () => {
      try {
        const [txs, snapshots] = await Promise.all([
          getTransactions(), 
          getDailySnapshots()
        ]);
        setTransactions(txs as Transaction[]);
        setDailyData(snapshots as DailySnapshot[]);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    };
    if (session) loadData();
  }, [session]);

  // Fetch market prices and exchange rate
  useEffect(() => {
    const fetchRates = async () => { 
      try { 
        const res = await fetch("https://open.er-api.com/v6/latest/USD"); 
        const data = await res.json(); 
        if (data?.rates?.THB) setExchangeRateUSDTHB(data.rates.THB); 
      } catch (e) {
        console.error("Failed to fetch exchange rate:", e);
      } 
    };
    
    const fetchPrices = async () => { 
      try { 
        const res = await fetch("/api/ticker"); 
        const data = await res.json(); 
        setMarketData(data as MarketData); 
      } catch (e) {
        console.error("Failed to fetch prices:", e);
      } 
    };
    
    fetchRates();
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  // Get reference price for an asset
  const getReferencePrice = useMemo(() => (asset: string, brokerHint?: string): number => {
    const sources = [
      brokerHint?.toLowerCase().replace("_th", ""), 
      "binance", 
      "bitkub", 
      "okx"
    ].filter(Boolean) as string[];
    
    for (const src of sources) {
      if (marketData[src as keyof MarketData] && marketData[src as keyof MarketData][asset]) {
        return src === "okx" 
          ? marketData[src as keyof MarketData][asset] * exchangeRateUSDTHB 
          : marketData[src as keyof MarketData][asset];
      }
    }
    
    if (asset === "THB") return 1;
    if (asset === "USDT" || asset === "USDC") return exchangeRateUSDTHB;
    return 0;
  }, [marketData, exchangeRateUSDTHB]);

  // Calculate portfolio by broker and asset
  const portfolioByBrokerAsset = useMemo(() => {
    return transactions.reduce<Record<string, PortfolioItem>>((acc, tx) => {
      const amount = parseFloat(tx.amount);
      const broker = tx.broker === "BINANCE" || tx.broker === "BINANCE-EX" 
        ? "BINANCE_TH" 
        : tx.broker;
      const key = `${broker}_${tx.asset}`;
      
      if (!acc[key]) {
        acc[key] = { broker, asset: tx.asset, amount: 0 };
      }
      
      if (tx.type === "DEPOSIT") {
        acc[key].amount += amount;
      } else {
        acc[key].amount -= amount;
      }
      
      return acc;
    }, {});
  }, [transactions]);

  // Calculate totals per broker
  const brokerTotals = useMemo(() => {
    const totals: Record<string, number> = { BINANCE_TH: 0, BITKUB: 0, OKX: 0 };
    
    Object.values(portfolioByBrokerAsset).forEach((item) => {
      const price = getReferencePrice(item.asset, item.broker);
      const val = item.amount * price;
      if (totals[item.broker] !== undefined) {
        totals[item.broker] += val;
      }
    });
    
    return totals;
  }, [portfolioByBrokerAsset, getReferencePrice]);

  const totalPortfolioValue = useMemo(() => 
    Object.values(brokerTotals).reduce((a, b) => a + b, 0),
    [brokerTotals]
  );

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    return Object.values(portfolioByBrokerAsset)
      .filter((item) => {
        if (selectedExchange && item.broker !== selectedExchange) return false;
        if (item.broker === "SYSTEM_RECONCILE") return false;
        return Math.abs(item.amount) > 0.00000001;
      })
      .sort((a, b) => b.amount - a.amount);
  }, [portfolioByBrokerAsset, selectedExchange]);

  const handlePrint = () => { window.print(); };

  // Process daily data with display values
  const processedDailyData = useMemo(() => {
    return dailyData.map(snap => ({
      ...snap,
      displayValue: selectedAsset 
        ? (snap.holdingsJson?.[selectedAsset] || 0)
        : parseFloat(snap.totalValue || '0')
    }));
  }, [dailyData, selectedAsset]);

  // Don't render if no session (AuthGuard should handle this)
  if (!session) return null;

  return (
    <div className="min-h-screen bg-dashboard-bg text-white font-sans selection:bg-cyan-600/30 pb-20 overflow-x-hidden">
      
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .bg-zinc-900, .bg-zinc-900\/40 { background: #f9fafb !important; border: 1px solid #e5e7eb !important; }
          .text-white { color: black !important; }
          .text-zinc-600, .text-zinc-700 { color: #4b5563 !important; }
          .text-blue-500, .text-blue-400 { color: #1e40af !important; font-weight: 800; }
          .rounded-3xl { border-radius: 12px !important; }
          main { padding: 0 !important; gap: 20px !important; }
        }
      `}</style>
      
      <Navbar />

      <main className="max-w-400 mx-auto px-6 py-10 flex flex-col gap-12">
        
        {/* Exchange Selector Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-5 no-print">
          <button 
            onClick={() => setSelectedExchange(null)} 
            className={`p-8 rounded-3xl border transition-all text-left flex flex-col justify-center min-h-35 ${!selectedExchange ? "bg-white border-white text-black shadow-2xl scale-[1.02]" : "bg-zinc-900/40 border-white/5 text-zinc-600 hover:border-white/10"}`}
          >
            <p className="text-[8px] font-black uppercase tracking-widest mb-2 opacity-50">Global Valuation</p>
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">Net Worth</h2>
            <p className="text-xl font-black mt-3">
              ฿{totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </button>
          
          {EXCHANGES_MAPPED.map(ex => (
            <button 
              key={ex.id} 
              onClick={() => setSelectedExchange(ex.id === selectedExchange ? null : ex.id)} 
              className={`p-8 rounded-3xl border transition-all text-left flex flex-col justify-center min-h-35 ${selectedExchange === ex.id ? "bg-white border-white text-black shadow-2xl scale-[1.02]" : "bg-zinc-900/40 border-white/5 text-zinc-600 hover:border-white/10"}`}
            >
              <p className="text-[8px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <img src={ex.icon} className={`h-3.5 object-contain ${selectedExchange === ex.id ? "" : "grayscale"}`} alt="" />
                {ex.label}
              </p>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">{ex.label.split(' ')[0]}</h2>
              <p className="text-xl font-black mt-3">
                ฿{brokerTotals[ex.id].toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </button>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            
            {/* Portfolio Chart */}
            <div className="bg-zinc-900 border border-white/5 rounded-4xl p-10 h-105 relative flex flex-col shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] pointer-events-none"></div>
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">
                    {selectedAsset ? `Performance: ${selectedAsset}` : "Portfolio Accumulation Track"}
                  </h3>
                </div>
                {selectedAsset && (
                  <button 
                    onClick={() => setSelectedAsset(null)} 
                    className="no-print px-4 py-1.5 bg-cyan-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-cyan-900/40"
                  >
                    Consolidated View
                  </button>
                )}
              </div>
              <div className="flex-1 w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processedDailyData}>
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ background: '#000', border: '1px solid rgba(8,145,178,0.2)', borderRadius: '20px', padding: '16px' }} 
                      itemStyle={{ color: '#06b6d4', fontSize: '12px', fontWeight: '900' }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="displayValue"
                      stroke="#22d3ee" 
                      fillOpacity={1} 
                      fill="url(#g)" 
                      strokeWidth={4} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Asset Table */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-4xl overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-[11px] font-black uppercase italic tracking-[0.25em] text-zinc-500">
                  Asset Position Ledger {selectedExchange ? `[${selectedExchange}]` : "[Combined]"}
                </h3>
                <div className="text-[9px] font-black text-cyan-500 uppercase tracking-widest animate-pulse">● Live Tracking</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em] italic border-b border-white/5">
                      <th className="py-6 px-12">Identifier / Source</th>
                      <th className="py-6 px-6 text-right">Volume</th>
                      <th className="py-6 px-6 text-center no-print">Momentum</th>
                      <th className="py-6 px-12 text-right text-cyan-500">Est. Balance (THB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/3">
                    {filteredAssets.map((item) => {
                      const price = getReferencePrice(item.asset, item.broker);
                      const val = item.amount * price;
                      return (
                        <tr 
                          key={`${item.broker}_${item.asset}`} 
                          onClick={() => setSelectedAsset(item.asset)} 
                          className="group hover:bg-cyan-500/3 transition-all cursor-pointer"
                        >
                          <td className="py-6 px-12 flex items-center gap-6">
                            <IconWithFallback asset={item.asset} className="w-12 h-12" />
                            <div>
                              <p className="text-sm font-black text-white italic tracking-tight">{item.asset}</p>
                              <p className="text-[9px] font-bold text-zinc-600 uppercase mt-1 tracking-widest">@{item.broker.replace('_TH', '')}</p>
                            </div>
                          </td>
                          <td className="py-6 px-6 text-right font-mono text-xs font-black text-zinc-300 tracking-tighter">
                            {item.amount.toLocaleString(undefined, { maximumFractionDigits: (item.asset === "THB" ? 2 : 8) })}
                          </td>
                          <td className="py-6 px-6 flex justify-center no-print">
                            <QuantitySparkline data={dailyData} asset={item.asset} />
                          </td>
                          <td className="py-6 px-12 text-right">
                            <p className="text-lg font-black italic text-cyan-400 font-mono tracking-tighter">
                              ฿{val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-10">
            <div className="bg-zinc-900 border border-white/5 rounded-4xl p-10 shadow-3xl space-y-10 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em]">Accumulated Balance</h3>
                <h2 className="text-5xl font-black italic tracking-tighter text-white">
                  ฿{totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </h2>
              </div>
              <div className="space-y-4 no-print">
                <button 
                  onClick={handlePrint} 
                  className="w-full py-6 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-cyan-500 hover:text-black transition-all border border-white active:scale-[0.98]"
                >
                  GENERATE SUMMARY 🖨️
                </button>
                <p className="text-[8px] text-zinc-700 font-black italic leading-relaxed text-center px-6 uppercase tracking-[0.3em] opacity-40">
                  System-wide Reporting v4.0 Active
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
