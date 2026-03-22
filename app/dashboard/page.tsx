"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  getTransactions,
  saveTransaction,
  deleteTransaction,
  getDailySnapshots,
} from "../actions/transactionActions";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

const FIAT_CURRENCIES = [
  { symbol: "฿", code: "THB", name: "Thai Baht" },
  { symbol: "$", code: "USD", name: "US Dollar" },
];

const SUPPORTED_ASSETS = ["BTC", "ETH", "SOL", "USDT", "XRP", "DOGE", "ADA", "BNB", "USDC", "ORDI", "MOODENG", "GOAT", "AVAX", "SATS"];

const ASSET_LOGOS: Record<string, string> = {
  BTC: "/coins/BTC.svg",
  ETH: "/coins/ETH.svg",
  SOL: "/coins/SOL.svg",
  USDT: "/coins/USDT.svg",
  XRP: "/coins/XRP.svg",
  DOGE: "/coins/DOGE.svg",
  ADA: "/coins/ADA.svg",
  BNB: "/coins/BNB.svg",
  USDC: "/coins/USDC.svg",
  ORDI: "/coins/ORDI.svg",
  MOODENG: "/coins/MOODENG.png",
  GOAT: "/coins/GOAT.jpg",
  AVAX: "/coins/AVAX.png",
  SATS: "/coins/SATS.png",
};

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];

// Official Partner Logos Component
const PartnerLogos = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-items-center opacity-70">
    <a href="https://www.binance.th/th" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all duration-300 hover:opacity-100 hover:scale-105">
       <img src="/coins/BINANCE-EX.png" className="h-6 object-contain" alt="binance-th" />
       <span className="font-extrabold text-sm tracking-tighter text-white">Binance <span className="text-[#F3BA2F]">TH</span></span>
    </a>
    <a href="https://www.bitkub.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all duration-300 hover:opacity-100 hover:scale-105">
       <img src="/coins/BITKUB-EX.png" className="h-6 object-contain" alt="bitkub" />
       <span className="font-black text-sm tracking-tighter text-[#00E08F]">Bitkub</span>
    </a>
    <a href="https://www.okx.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all duration-300 hover:opacity-100 hover:scale-105">
       <img src="/coins/OKX_logo.svg.png" className="h-6 object-contain brightness-200 contrast-200" alt="okx" />
       <span className="font-black text-sm tracking-tighter text-white">OKX GLOBAL</span>
    </a>
    <a href="https://coinmarketcap.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all duration-300 hover:opacity-100 hover:scale-105">
       <div className="w-6 h-6 bg-[#3861fb] rounded-full flex items-center justify-center text-[10px] font-bold">M</div>
       <span className="font-black text-sm tracking-tighter text-white">CoinMarketCap</span>
    </a>
    <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-all duration-300 hover:opacity-100 hover:scale-105">
       <div className="w-6 h-6 bg-[#8cc63f] rounded-full flex items-center justify-center text-[10px] font-bold">G</div>
       <span className="font-black text-sm tracking-tighter text-white">CoinGecko</span>
    </a>
  </div>
);

const IconWithFallback = ({ asset, className = "w-10 h-10" }: { asset: string, className?: string }) => {
  const [error, setError] = useState(false);
  const src = ASSET_LOGOS[asset];
  if (error || !src) {
    return (
      <div className={`${className} bg-zinc-800 rounded-full flex items-center justify-center font-bold text-[10px] text-zinc-400 border border-zinc-700 uppercase`}>
        {asset.substring(0, 2)}
      </div>
    );
  }
  return <img src={src} alt={asset} className={`${className} object-contain`} onError={() => setError(true)} />;
};

export default function Home() {
  const { data: session } = useSession();
  const [baseFiat, setBaseFiat] = useState(FIAT_CURRENCIES[0]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<{ binance: Record<string, number>, bitkub: Record<string, number>, okx: Record<string, number> }>({
    binance: {}, bitkub: {}, okx: {}
  });
  const [exchangeRateUSDTHB, setExchangeRateUSDTHB] = useState(35);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<string | null>(null);

  const [inputBroker, setInputBroker] = useState("BINANCE_TH");
  const [inputAsset, setInputAsset] = useState("BTC");
  const [inputAmount, setInputAmount] = useState("");
  const [inputType, setInputType] = useState("DEPOSIT");
  const [inputDate, setInputDate] = useState(new Date().toISOString().split("T")[0]);
  const [editingTxId, setEditingTxId] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await getTransactions();
      setTransactions(data);
      const snapshots = await getDailySnapshots();
      setDailyData(snapshots);
    };
    if (session) loadData();
  }, [session]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await res.json();
        if (data?.rates?.THB) setExchangeRateUSDTHB(data.rates.THB);
      } catch (e) {}
    };
    fetchRates();

    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/ticker");
        const data = await res.json();
        setMarketData({ 
          binance: data.binance || {}, 
          bitkub: data.bitkub || {}, 
          okx: data.okx || {} 
        });
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (e) {}
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  const getMovement = (asset: string) => {
    if (dailyData.length === 0) return { daily: "stable", monthly: "stable" };
    
    // Latest snapshot (Today at 6:00 AM)
    const latest = dailyData[dailyData.length - 1]?.holdingsJson || {};
    // Oldest snapshot in current view (up to 30 days if available)
    const monthly = dailyData[0]?.holdingsJson || latest;

    const currentQty = aggregatedPortfolio[asset] || 0;
    const snapshotQty = latest[asset] || 0;
    const monthQty = monthly[asset] || 0;

    const d = currentQty > snapshotQty ? "up" : currentQty < snapshotQty ? "down" : "stable";
    const m = currentQty > monthQty ? "up" : currentQty < monthQty ? "down" : "stable";
    
    return { daily: d, monthly: m };
  };

  const getReferencePrice = (asset: string, brokerHint?: string) => {
    const rate = exchangeRateUSDTHB || 35;
    const sources = [brokerHint?.toLowerCase().replace("_th", ""), "bitkub", "binance", "okx"] as any[];
    
    let priceInUSD = 0, priceInTHB = 0;
    const mData = marketData as any;

    for (const src of sources) {
       if (mData[src] && mData[src][asset]) {
         if (src === "okx") priceInUSD = mData[src][asset];
         else priceInTHB = mData[src][asset];
         break;
       }
    }

    if (priceInTHB > 0) return baseFiat.code === "THB" ? priceInTHB : priceInTHB / rate;
    if (priceInUSD > 0) return baseFiat.code === "THB" ? priceInUSD * rate : priceInUSD;
    if (asset === "USDT" || asset === "USDC") return baseFiat.code === "THB" ? rate : 1;
    return 0;
  };

  const getAssetValueInFiat = (asset: string, amount: number, brokerHint?: string) => {
    const price = getReferencePrice(asset, brokerHint);
    return amount * price;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAmount || Number(inputAmount) <= 0) return;
    setIsSaving(true);
    try {
      await saveTransaction({ id: editingTxId || undefined, broker: inputBroker, asset: inputAsset, amount: inputAmount, type: inputType, date: inputDate });
      const data = await getTransactions();
      setTransactions(data);
      setEditingTxId(null);
      setInputAmount("");
    } catch (e) {}
    setIsSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ลบรายการนี้?")) return;
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter((tx) => tx.id !== id));
    } catch (e) {}
  };

  const portfolioWithBroker = (transactions as any[]).reduce((acc, tx) => {
    const amount = parseFloat(tx.amount);
    const key = `${tx.broker}_${tx.asset}`;
    if (!acc[key]) acc[key] = { broker: tx.broker, asset: tx.asset, amount: 0 };
    if (tx.type === "DEPOSIT") acc[key].amount += amount;
    else acc[key].amount -= amount;
    return acc;
  }, {} as Record<string, { broker: string, asset: string, amount: number }>);

  const aggregatedPortfolio = (Object.values(portfolioWithBroker) as any[]).reduce((acc: Record<string, number>, item) => {
    if (!acc[item.asset]) acc[item.asset] = 0;
    acc[item.asset] += item.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalValue = (Object.values(portfolioWithBroker) as any[]).reduce((total: number, item) => {
    return total + getAssetValueInFiat(item.asset, item.amount, item.broker);
  }, 0);

  const brokerStats = (Object.values(portfolioWithBroker) as any[]).reduce((acc: Record<string, number>, item) => {
    const val = getAssetValueInFiat(item.asset, item.amount, item.broker);
    if (!acc[item.broker]) acc[item.broker] = 0;
    acc[item.broker] += val;
    return acc;
  }, {} as Record<string, number>);

  if (!session) return <div className="h-screen flex items-center justify-center bg-[#27272a] text-white">Initializing Grids Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#27272a] text-white font-sans selection:bg-blue-600/30 pb-20 overflow-x-hidden">
      
      {/* 🚀 Pro Navigation */}
      <header className="sticky top-0 z-[100] border-b border-white/5 bg-[#27272a]/90 backdrop-blur-xl h-20">
        <div className="max-w-[1600px] mx-auto px-6 h-full flex justify-between items-center gap-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-700 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center text-xl shadow-2xl">💡</div>
              <div className="hidden sm:block">
                 <h1 className="font-black text-lg tracking-tighter uppercase leading-none">SMART PLANNER</h1>
                 <p className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5">Automated Asset Management</p>
              </div>
           </div>

           <div className="hidden lg:flex items-center gap-10 px-8 border-l border-white/5 h-10">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Global Assets Terminal</span>
           </div>

           <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                 {FIAT_CURRENCIES.map(f => (
                   <button key={f.code} onClick={() => setBaseFiat(f)} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${baseFiat.code === f.code ? "bg-zinc-100 text-black shadow-lg" : "text-zinc-500 hover:text-white"}`}>
                      {f.code}
                   </button>
                 ))}
              </div>
              <button onClick={() => signOut()} className="px-5 py-2.5 bg-red-600/30 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/40 font-black text-[10px] tracking-widest uppercase shadow-xl shadow-red-500/20">
                 ออกจากระบบ 🚪
              </button>
           </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        
        {/* 📊 High-Level Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
           <div className="p-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] border border-white/10 relative overflow-hidden group shadow-2xl shadow-blue-500/10">
              <div className="relative z-10">
                <p className="text-[10px] font-black text-blue-200/60 uppercase tracking-widest mb-2">Portfolio Valuation</p>
                <h2 className="text-4xl font-black text-white tracking-tighter">{baseFiat.symbol}{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h2>
                <div className="mt-4 flex items-center gap-3">
                   <span className="text-[9px] font-black bg-white/10 px-3 py-1 rounded-full text-white uppercase tracking-widest">Active</span>
                   <span className="text-[9px] text-blue-200/40 font-bold uppercase">Synced: {lastUpdate}</span>
                </div>
              </div>
           </div>
           
           <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-[2.5rem] shadow-xl">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Holdings Count</p>
              <h2 className="text-4xl font-black">{Object.keys(aggregatedPortfolio).length} <span className="text-sm font-medium text-zinc-800 uppercase">Assets</span></h2>
              <p className="text-[10px] text-zinc-500 font-bold mt-4 uppercase">Direct Market Aggregation</p>
           </div>

           <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-[2.5rem] shadow-xl">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Live FX Rate</p>
              <h2 className="text-4xl font-black">฿{exchangeRateUSDTHB.toFixed(2)}</h2>
              <p className="text-[10px] text-zinc-500 font-bold mt-4 uppercase">USD to THB (Official Central API)</p>
           </div>

           <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-[2.5rem] shadow-xl flex flex-col justify-center items-center group hover:bg-white/5 transition-all cursor-pointer" onClick={() => window.print()}>
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">📄</div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Export Monthly<br />Summary Report</p>
           </div>
        </div>

        {/* 📈 Daily Wealth Engine: Equity Curve Chart */}
        <section className="mb-12">
           <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 min-h-[420px] shadow-2xl relative overflow-hidden group">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] -z-10 group-hover:bg-blue-600/10 transition-all duration-1000"></div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                 <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-xl border border-blue-500/20">📈</div>
                    <div>
                       <h2 className="text-xl font-black tracking-tight text-white">กราฟการเติบโตรายวัน</h2>
                       <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Daily Equity Growth Curve (System Snapshot at 6:00 AM)</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-zinc-900 border border-white/5 rounded-xl flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                       <span className="text-[9px] font-black text-white uppercase tracking-widest">Growth Engine Active</span>
                    </div>
                    <button onClick={() => window.print()} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all group-hover:scale-110 active:scale-95 border border-white/5">
                       📄
                    </button>
                 </div>
              </div>

              <div className="h-[300px] w-full mt-6 relative z-10">
                 {dailyData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#52525b" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false} 
                          dy={10}
                          tickFormatter={(str) => {
                             const date = new Date(str);
                             return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
                          }}
                        />
                        <YAxis 
                          stroke="#52525b" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false} 
                          dx={-10}
                          tickFormatter={(val) => `฿${(val / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                             background: 'rgba(24, 24, 27, 0.95)', 
                             backdropFilter: 'blur(10px)',
                             border: '1px solid rgba(255,255,255,0.1)', 
                             borderRadius: '16px', 
                             padding: '12px 16px',
                             boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)'
                          }}
                          itemStyle={{ color: '#white', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase' }}
                          labelStyle={{ color: '#71717a', fontWeight: 'bold', fontSize: '9px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                          formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, 'PORTFOLIO VALUE']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="totalValue" 
                          stroke="#3B82F6" 
                          strokeWidth={4}
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                          animationDuration={2500}
                          activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#18181b' }}
                        />
                      </AreaChart>
                   </ResponsiveContainer>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-zinc-600 bg-white/#[0.02] border border-dashed border-white/5 rounded-3xl">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-3xl mb-4 border border-white/5 opacity-40">📊</div>
                      <h4 className="font-black text-zinc-400 uppercase tracking-widest text-xs mb-2">ยังไม่มีประวัติการเติบโต</h4>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] text-center px-8 leading-relaxed">
                        ระบบกำลังรอคิว Snapshot แรกของคุณในเวลา 06:00 น. พรุ่งนี้ครับ<br />
                        หลังจากนั้นคุณจะเห็นกราฟความมั่งคั่งนี้พุ่งทะยานขึ้นครับ!
                      </p>
                   </div>
                 )}
              </div>
           </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
           
           {/* 🏦 Main Area: Consolidated Assets & Broker Grid */}
           <div className="lg:col-span-8 flex flex-col gap-12">
              
              {/* Aggregated Portfolio (Consolidated) */}
              <section>
                 <div className="flex items-center justify-between px-2 mb-8">
                    <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.4em]">Asset Consolidation (สินทรัพย์รวม)</h3>
                    <div className="h-px flex-1 bg-white/5 mx-8"></div>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    {Object.entries(aggregatedPortfolio).sort((a,b) => b[1] - a[1]).map(([asset, amount]) => {
                      const val = getAssetValueInFiat(asset, amount as number);
                      if (Math.abs(amount) < 0.00000001) return null;
                      return (

                           <div 
                             key={asset} 
                             onClick={() => setSelectedAssetDetail(asset)}
                             className="p-6 bg-zinc-900/30 border border-white/5 rounded-3xl hover:bg-white/[0.04] transition-all group cursor-pointer border-b-2 border-b-blue-600/10 active:scale-95 hover:shadow-2xl hover:shadow-blue-500/5 relative overflow-hidden"
                           >
                              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-600/5 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-blue-600/10 transition-all"></div>
                              <div className="flex justify-between items-start mb-5 relative z-10">
                                 <IconWithFallback asset={asset} className="w-10 h-10 shadow-lg group-hover:scale-110 transition-transform" />
                                 <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter group-hover:text-blue-500 transition-colors">{asset}</span>
                              </div>
                              <p className="font-black text-sm text-gray-200 mb-1 relative z-10">{amount.toLocaleString(undefined, { maximumFractionDigits: (amount < 1 ? 8 : 4) })}</p>
                              <div className="flex items-center justify-between relative z-10">
                                 <p className="text-[11px] font-black text-blue-500/80">{baseFiat.symbol}{val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                 <div className="flex gap-1.5">
                                    {/* Daily Trend */}
                                    <span title="Daily Qty Change" className={`text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center justify-center min-w-[18px] ${getMovement(asset).daily === 'up' ? 'text-blue-400 bg-blue-400/10' : getMovement(asset).daily === 'down' ? 'text-red-400 bg-red-400/10' : 'text-zinc-600 bg-white/5'}`}>
                                      {getMovement(asset).daily === 'up' ? '▲' : getMovement(asset).daily === 'down' ? '▼' : '▬'}
                                    </span>
                                    {/* Monthly Trend */}
                                    <span title="Monthly Qty Change" className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border flex items-center justify-center min-w-[24px] ${getMovement(asset).monthly === 'up' ? 'text-blue-400 border-blue-400/30' : getMovement(asset).monthly === 'down' ? 'text-red-400 border-red-400/30' : 'text-zinc-600 border-white/10'}`}>
                                      {getMovement(asset).monthly === 'up' ? 'M▲' : getMovement(asset).monthly === 'down' ? 'M▼' : 'M▬'}
                                    </span>
                                 </div>
                              </div>
                           </div>
                      );
                    })}
                 </div>
              </section>

              {/* Broker Individual Breakdown Cards - FIXED HEIGHT SYMMETRY */}
              <section>
                 <div className="flex items-center justify-between px-2 mb-8">
                    <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.4em]">Broker Accounts (แยกตามโบรกเกอร์)</h3>
                    <div className="h-px flex-1 bg-white/5 mx-8"></div>
                 </div>
                 {/* Flex Row with Items-Stretch for Equal Heights */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                    {["BINANCE_TH", "BITKUB", "OKX"].map(broker => {
                       const items = (Object.values(portfolioWithBroker) as any[]).filter(i => i.broker === broker && Math.abs(i.amount) > 0.00000001);
                       if (items.length === 0) return null;
                       return (
                         <div key={broker} className="flex flex-col h-full bg-zinc-900/60 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative">
                            <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center group">
                               <div className="flex items-center gap-4">
                                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                                  <span className="text-xs font-black tracking-[0.2em] text-white uppercase">{broker.replace("_", " ")}</span>
                               </div>
                               <span className="text-base font-black text-blue-400 tracking-tight">{baseFiat.symbol}{brokerStats[broker]?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="flex-1 p-6 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                               {items.map(it => (
                                 <div key={it.asset} className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-[1.8rem] transition-all border border-transparent hover:border-white/5">
                                    <div className="flex items-center gap-5">
                                       <IconWithFallback asset={it.asset} className="w-10 h-10" />
                                       <div>
                                          <p className="font-black text-sm text-zinc-100 uppercase">{it.amount.toLocaleString(undefined, { maximumFractionDigits: (it.amount < 1 ? 8 : 4) })} {it.asset}</p>
                                          <p className="text-[10px] font-bold text-zinc-700 mt-1 uppercase tracking-tighter">Market Price: {baseFiat.symbol}{getReferencePrice(it.asset, broker).toLocaleString(undefined, { maximumFractionDigits: (getReferencePrice(it.asset, broker) < 0.1 ? 8 : 2) })}</p>
                                       </div>
                                    </div>
                                    <span className="text-xs font-black text-zinc-500/80">{baseFiat.symbol}{getAssetValueInFiat(it.asset, it.amount, broker).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                 </div>
                               ))}
                               {items.length < 3 && <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/5 rounded-3xl mt-4 opacity-20"><span className="text-[10px] font-black uppercase text-zinc-800 tracking-widest">Balanced Portfolio</span></div>}
                            </div>
                         </div>
                       );
                    })}
                 </div>
              </section>
           </div>

           {/* 📋 Control Sidebar (Column 9-12) */}
           <div className="lg:col-span-4 flex flex-col gap-10">
              
              {/* Transaction Control Unit */}
              <section className="bg-zinc-900 border border-white/10 rounded-[3rem] p-8 shadow-2xl sticky top-28">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">{editingTxId ? "Update Transaction" : "New Portfolio Record"}</h3>
                 </div>
                 <form onSubmit={handleSave} className="flex flex-col gap-5">
                    <div className="flex bg-[#27272a]/50 p-1.5 rounded-2xl border border-white/5">
                       <button type="button" onClick={() => setInputType("DEPOSIT")} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${inputType === "DEPOSIT" ? "bg-zinc-100 text-black shadow-2xl" : "text-zinc-600 opacity-60"}`}>DEPOSIT</button>
                       <button type="button" onClick={() => setInputType("WITHDRAW")} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${inputType === "WITHDRAW" ? "bg-red-600/50 text-white" : "text-zinc-600 opacity-60"}`}>WITHDRAW</button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                       {["BINANCE_TH", "BITKUB", "OKX"].map(b => (
                         <button key={b} type="button" onClick={() => setInputBroker(b)} className={`py-3 text-[8px] font-black rounded-xl border transition-all ${inputBroker === b ? "bg-blue-600 border-blue-400 text-white shadow-xl" : "bg-[#27272a]/20 border-white/5 text-zinc-800"}`}>{b.replace("_", " ")}</button>
                       ))}
                    </div>

                    <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black text-zinc-700 uppercase ml-2 tracking-widest">Select Asset</label>
                       <select value={inputAsset} onChange={(e) => setInputAsset(e.target.value)} className="w-full bg-[#27272a]/60 border border-white/10 rounded-2xl p-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-600/20 appearance-none">
                          {SUPPORTED_ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
                       </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black text-zinc-700 uppercase ml-2 tracking-widest">Amount Units</label>
                       <input type="number" step="any" placeholder="0.00000000" value={inputAmount} onChange={(e) => setInputAmount(e.target.value)} className="w-full bg-[#27272a]/60 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/20 text-blue-500 placeholder:text-zinc-800" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black text-zinc-700 uppercase ml-2 tracking-widest">Entry Date</label>
                       <input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} className="w-full bg-[#27272a]/60 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none text-zinc-500" />
                    </div>

                    <button type="submit" disabled={isSaving} className="w-full py-5 bg-gradient-to-r from-blue-700 to-indigo-600 text-white rounded-[2rem] font-black text-[11px] tracking-[0.4em] uppercase shadow-2xl active:scale-95 transition-all mt-4 border-t border-white/20">
                       {isSaving ? "INJECTING..." : (editingTxId ? "UPDATE LOG" : "RECORD TO PORTFOLIO")}
                    </button>
                 </form>
              </section>

              {/* Execution Audit Trail */}
              <section className="bg-zinc-900 border border-white/10 rounded-[3rem] p-8 shadow-2xl max-h-[600px] flex flex-col">
                 <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-6">Recent History (20)</h3>
                 <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar flex flex-col gap-4">
                    {transactions.slice(0, 20).map(tx => (
                      <div key={tx.id} className="p-5 bg-[#27272a]/40 rounded-3xl border border-white/5 flex flex-col gap-3 group group relative overflow-hidden">
                         <div className="flex justify-between items-center relative z-10">
                            <div>
                               <p className={`text-xs font-black tracking-tight ${tx.type === "DEPOSIT" ? "text-green-500" : "text-red-500"}`}>{tx.type === "DEPOSIT" ? "+" : "-"}{parseFloat(tx.amount).toLocaleString()} {tx.asset}</p>
                               <p className="text-[9px] font-bold text-zinc-700 mt-1 uppercase tracking-widest">{tx.broker} • {tx.date}</p>
                            </div>
                            <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => { setEditingTxId(tx.id); setInputBroker(tx.broker); setInputAsset(tx.asset); setInputAmount(tx.amount); setInputType(tx.type); setInputDate(tx.date); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-[10px] font-black text-blue-500 hover:text-white">EDIT</button>
                               <button onClick={() => handleDelete(tx.id)} className="text-[10px] font-black text-red-600 hover:text-white">DEL</button>
                            </div>
                         </div>
                         <div className={`absolute left-0 top-0 bottom-0 w-1 ${tx.type === "DEPOSIT" ? "bg-green-500" : "bg-red-500"} opacity-30`}></div>
                      </div>
                    ))}
                 </div>
              </section>
           </div>
        </div>
      </main>

      {/* 🏁 World-Class Footer */}
      <footer className="mt-20 border-t border-white/5 py-12 px-6">
         <div className="max-w-[1600px] mx-auto flex flex-col items-center gap-10">
            <div className="text-center">
               <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] mb-4">Official Project Data Partners</h3>
               <PartnerLogos />
            </div>
            <div className="h-px w-20 bg-white/5"></div>
            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">© 2026 SMART PLANNER • Excellence in Automated Management</p>
         </div>
      </footer>

      {/* 🔍 Asset Detail Insight Console */}
      {selectedAssetDetail && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={() => setSelectedAssetDetail(null)}></div>
            <div className="bg-[#18181b] w-full max-w-5xl max-h-[90vh] rounded-[3rem] border border-white/10 relative z-10 overflow-hidden flex flex-col shadow-[0_0_100px_rgba(59,130,246,0.1)]">
               
               {/* Modal Header */}
               <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <div className="flex items-center gap-6">
                     <IconWithFallback asset={selectedAssetDetail} className="w-16 h-16 shadow-2xl" />
                     <div>
                        <h2 className="text-4xl font-black tracking-tighter text-white">{selectedAssetDetail} <span className="text-sm font-medium text-zinc-500 uppercase tracking-widest ml-2">Deep Insight Node</span></h2>
                        <div className="flex gap-4 mt-2">
                           <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-400/20">Active Asset</span>
                           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Quantity Analysis System</span>
                        </div>
                     </div>
                  </div>
                  <button onClick={() => setSelectedAssetDetail(null)} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-xl transition-all border border-white/5">✕</button>
               </div>

               {/* Modal Body */}
               <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gradient-to-b from-transparent to-blue-600/[0.02]">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                     
                     {/* Left: Trend & History */}
                     <div className="lg:col-span-7 flex flex-col gap-10">
                        {/* Quantity Chart */}
                        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8">
                           <div className="flex justify-between items-center mb-8">
                              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em]">ปริมาณเหรียญย้อนหลัง (Quantity Trend)</h3>
                              <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-md">Live Delta Support</div>
                           </div>
                           <div className="h-[250px] w-full">
                              {dailyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip 
                                       contentStyle={{ background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                                       formatter={(value) => [Number(value).toLocaleString(), 'Quantity']}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey={(d) => d.holdingsJson?.[selectedAssetDetail] || 0} 
                                      stroke="#3B82F6" 
                                      strokeWidth={4} 
                                      dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }}
                                      activeDot={{ r: 8, strokeWidth: 0 }}
                                      animationDuration={2000}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="h-full flex items-center justify-center text-zinc-700 text-[10px] font-black uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">
                                   รอระบบ Snapshot ข้อมูลรายวัน...
                                </div>
                              )}
                           </div>
                        </div>

                        {/* Specific Transaction History */}
                        <div>
                           <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.4em] mb-6 pl-2">ประวัติธุรกรรม ({selectedAssetDetail})</h3>
                           <div className="flex flex-col gap-3">
                              {transactions.filter(t => t.asset === selectedAssetDetail).slice(0, 10).map((tx) => (
                                <div key={tx.id} className="p-5 bg-zinc-900/30 border border-white/5 rounded-2xl flex justify-between items-center hover:bg-white/[0.02] transition-colors">
                                  <div className="flex items-center gap-4">
                                     <div className={`w-1.5 h-8 rounded-full ${tx.type === 'DEPOSIT' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                                     <div>
                                        <p className="text-xs font-black text-white">{tx.broker.replace("_", " ")}</p>
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase mt-0.5">{new Date(tx.date).toLocaleDateString('th-TH')}</p>
                                     </div>
                                  </div>
                                  <div className="text-right">
                                     <p className={`text-sm font-black ${tx.type === 'DEPOSIT' ? 'text-blue-400' : 'text-red-400'}`}>
                                        {tx.type === 'DEPOSIT' ? '+' : '-'}{parseFloat(tx.amount).toLocaleString()}
                                     </p>
                                     <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mt-0.5">{tx.type}</p>
                                  </div>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* Right: Asset Market Stats */}
                     <div className="lg:col-span-5 flex flex-col gap-8">
                        <div className="p-8 bg-zinc-900/60 border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] -z-10"></div>
                           <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">Market Valuation (THB)</h3>
                           <div className="flex flex-col gap-6">
                              <div className="flex justify-between items-end">
                                 <span className="text-xs font-bold text-zinc-400">จำนวนที่ถือครอง</span>
                                 <span className="text-2xl font-black">{(aggregatedPortfolio[selectedAssetDetail] || 0).toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>
                              </div>
                              <div className="flex justify-between items-end border-t border-white/5 pt-6">
                                 <span className="text-xs font-bold text-zinc-400">ราคาตลาดโดยประมาณ</span>
                                 <span className="text-2xl font-black">฿{(getReferencePrice(selectedAssetDetail)).toLocaleString()}</span>
                              </div>
                              <div className="mt-4 p-6 bg-blue-600 rounded-3xl shadow-xl shadow-blue-500/20">
                                 <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Total Asset Value</span>
                                 <h4 className="text-3xl font-black text-white mt-1">฿{(getAssetValueInFiat(selectedAssetDetail, aggregatedPortfolio[selectedAssetDetail] || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h4>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <a 
                             href={`https://coinmarketcap.com/currencies/${selectedAssetDetail.toLowerCase() === 'btc' ? 'bitcoin' : selectedAssetDetail.toLowerCase() === 'eth' ? 'ethereum' : selectedAssetDetail.toLowerCase() === 'sol' ? 'solana' : selectedAssetDetail.toLowerCase()}`}
                             target="_blank"
                             className="p-6 bg-white/5 border border-white/5 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all group"
                           >
                              <div className="w-10 h-10 bg-[#3861fb]/20 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📊</div>
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Market Cap</span>
                           </a>
                           <a 
                             href="/market"
                             className="p-6 bg-white/5 border border-white/5 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all group"
                           >
                              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">⚡</div>
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Trade View</span>
                           </a>
                        </div>
                     </div>

                  </div>
               </div>

            </div>
         </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        
        @media print {
          header, footer, section:has(form), button, select, .hidden-print {
            display: none !important;
          }
          body, .min-h-screen {
            background: white !important;
            color: black !important;
            padding: 0 !important;
          }
          main { 
            max-width: 100% !important; 
            padding: 2rem !important;
          }
          .bg-zinc-900, .bg-zinc-950, .bg-zinc-900\/60, .bg-zinc-900\/30, .bg-zinc-900\/50 {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
          }
          .text-white, .text-zinc-100 { color: black !important; }
          .text-zinc-500, .text-zinc-600, .text-zinc-700 { color: #64748b !important; }
          .shadow-2xl, .shadow-xl { box-shadow: none !important; }
          h2, h3, h4 { color: black !important; }
        }
      `}</style>
    </div>
  );
}
