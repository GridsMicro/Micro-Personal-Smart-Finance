"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  getTransactions, 
  saveDailySnapshot,
  clearSystemAdjustments,
  saveTransaction
} from "../actions/transactionActions";
import { SUPPORTED_ASSETS, IconWithFallback } from "../dashboard/page";
import Navbar from "../../components/Navbar";

const EXCHANGES = [
  { id: "BINANCE_TH", label: "Binance TH", icon: "/coins/BINANCE-EX.png" },
  { id: "BITKUB", label: "Bitkub", icon: "/coins/BITKUB-EX.png" },
  { id: "OKX", label: "OKX Global", icon: "/coins/OKX_logo.svg.png" }
];

export default function DailyTerminal() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeExchange, setActiveExchange] = useState("BINANCE_TH");
  const [ledgerBalances, setLedgerBalances] = useState<Record<string, number>>({});
  const [auditInput, setAuditInput] = useState<Record<string, string>>({});
  const [marketData, setMarketData] = useState<any>({});
  const [exchangeRateUSDTHB, setExchangeRateUSDTHB] = useState(36);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Load Ledger Balances
      const txs = await getTransactions();
      const balances = (txs as any[]).reduce((acc, tx) => {
        const amount = parseFloat(tx.amount);
        const broker = tx.broker === "BINANCE" ? "BINANCE_TH" : (tx.broker === "BINANCE-EX" ? "BINANCE_TH" : tx.broker);
        const key = `${broker}_${tx.asset}`;
        if (!acc[key]) acc[key] = 0;
        if (tx.type === "DEPOSIT") acc[key] += amount; else acc[key] -= amount;
        return acc;
      }, {} as Record<string, number>);
      setLedgerBalances(balances);
      
      const initialInput: Record<string, string> = {};
      EXCHANGES.forEach(ex => {
        SUPPORTED_ASSETS.forEach(asset => {
          const key = `${ex.id}_${asset}`;
          initialInput[key] = (balances[key] || 0).toString();
        });
      });
      setAuditInput(initialInput);

      // 2. Load Market Prices
      try {
        const [tickerRes, rateRes] = await Promise.all([
          fetch("/api/ticker"),
          fetch("https://open.er-api.com/v6/latest/USD")
        ]);
        const tickerData = await tickerRes.json();
        const rateData = await rateRes.json();
        setMarketData(tickerData);
        if (rateData?.rates?.THB) setExchangeRateUSDTHB(rateData.rates.THB);
      } catch (e) {}
    };
    if (session) fetchData();
  }, [session]);

  const getReferencePrice = (asset: string, brokerHint?: string) => {
    const sources = [brokerHint?.toLowerCase().replace("_th", ""), "binance", "bitkub", "okx"] as any[];
    for (const src of sources) if (marketData[src] && marketData[src][asset]) return src === "okx" ? marketData[src][asset] * exchangeRateUSDTHB : marketData[src][asset];
    if (asset === "THB") return 1;
    if (asset === "USDT" || asset === "USDC") return exchangeRateUSDTHB;
    return 0;
  };

  const handleInputChange = (asset: string, val: string) => {
    setAuditInput(prev => ({ ...prev, [`${activeExchange}_${asset}`]: val }));
  };

  const getDelta = (asset: string) => {
    const key = `${activeExchange}_${asset}`;
    const audited = parseFloat(auditInput[key] || "0");
    const current = ledgerBalances[key] || 0;
    return audited - current;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const holdings: Record<string, number> = {};
      let totalValueTHB = 0;

      // 1. Calculate Consolidated Holdings & Total Portfolio Value
      SUPPORTED_ASSETS.forEach(asset => {
        let assetTotalQty = 0;
        EXCHANGES.forEach(ex => {
          const qty = parseFloat(auditInput[`${ex.id}_${asset}`] || "0");
          assetTotalQty += qty;
        });
        holdings[asset] = assetTotalQty;
        totalValueTHB += assetTotalQty * getReferencePrice(asset);
      });

      // 2. Save Daily Snapshot for Charting
      await saveDailySnapshot({
        date: today,
        totalValue: totalValueTHB.toFixed(2),
        holdings: holdings,
        fiatCode: "THB"
      });

      // 3. Smart Sync: Create Reconciliation Transactions for deltas
      // First, clear old system adjustments for today
      await clearSystemAdjustments();

      for (const ex of EXCHANGES) {
        for (const asset of SUPPORTED_ASSETS) {
          const delta = getDeltaForSync(ex.id, asset);
          if (Math.abs(delta) > 0.00000001) {
            await saveTransaction({
              broker: "SYSTEM_RECONCILE",
              asset: asset,
              amount: Math.abs(delta).toString(),
              type: delta > 0 ? "DEPOSIT" : "WITHDRAW",
              note: `Snapshot Reconciliation Sync @ ${ex.label}`,
              date: today
            });
          }
        }
      }

      router.push("/dashboard");
    } catch (e) {
      alert("Synchronization Failed. Please check network.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDeltaForSync = (exchangeId: string, asset: string) => {
    const audited = parseFloat(auditInput[`${exchangeId}_${asset}`] || "0");
    const current = ledgerBalances[`${exchangeId}_${asset}`] || 0;
    return audited - current;
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans selection:bg-cyan-500/30">
      
      <Navbar isDaily={true} />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {!showReview ? (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {EXCHANGES.map(ex => (
                  <button key={ex.id} onClick={() => setActiveExchange(ex.id)} className={`p-8 rounded-3xl border transition-all text-left flex flex-col gap-3 ${activeExchange === ex.id ? "bg-white border-white text-black shadow-2xl scale-[1.02]" : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/10"}`}>
                     <img src={ex.icon} className={`h-5 w-fit object-contain ${activeExchange === ex.id ? "" : "grayscale opacity-50"}`} alt="" />
                     <span className="text-[11px] font-black uppercase tracking-[0.2em]">{ex.label}</span>
                  </button>
               ))}
            </div>

            <div className="bg-zinc-900/30 border border-white/5 rounded-[48px] p-12 shadow-3xl">
               <div className="flex items-center gap-4 mb-12 pb-8 border-b border-white/5">
                  <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.6)]"></div>
                  <h2 className="text-lg font-black uppercase tracking-[0.4em] text-cyan-400 italic">Audit Vault: {activeExchange}</h2>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                  {SUPPORTED_ASSETS.map(asset => (
                    <div key={asset} className="flex flex-col gap-5 group">
                       <div className="flex justify-between items-center px-1">
                          <label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-4">
                             <IconWithFallback asset={asset} className="w-10 h-10 transition-all group-hover:scale-110" />
                             <div>
                                <p className="leading-none">{asset}</p>
                                <p className="text-[7px] text-zinc-600 font-bold mt-1.5">{asset === "THB" ? "LOCAL FIAT" : "NETWORK ASSET"}</p>
                             </div>
                          </label>
                          <div className="text-right">
                             <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest block mb-1">In-Ledger</span>
                             <span className="text-xs font-black text-cyan-500/50 font-mono italic">{(ledgerBalances[`${activeExchange}_${asset}`] || 0).toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>
                          </div>
                       </div>
                       <div className="relative">
                          <input 
                            type="number" 
                            step="any"
                            value={auditInput[`${activeExchange}_${asset}`] || ""} 
                            onChange={(e) => handleInputChange(asset, e.target.value)} 
                            className="w-full bg-black/40 border-2 border-white/5 rounded-3xl px-8 py-6 text-lg font-black font-mono focus:outline-none focus:border-cyan-500/30 transition-all placeholder:opacity-5 text-white" 
                            placeholder="0.00000000" 
                          />
                          <div className={`absolute -right-3 -top-3 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-2xl z-10 transition-all ${getDelta(asset) === 0 ? "bg-zinc-800 text-zinc-600 scale-0 opacity-0" : getDelta(asset) > 0 ? "bg-cyan-500 text-white animate-bounce" : "bg-red-500 text-white animate-pulse"}`}>
                             {getDelta(asset) > 0 ? "+" : ""}{getDelta(asset).toLocaleString(undefined, { maximumFractionDigits: 8 })} ADJ REQUIRED
                          </div>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="mt-16 pt-10 border-t border-white/5 flex flex-col gap-8">
                  <div className="p-8 bg-cyan-500/5 rounded-3xl border border-cyan-500/10 flex items-start gap-4">
                    <div className="text-2xl mt-1">💡</div>
                    <p className="text-[10px] text-cyan-400 font-black italic leading-relaxed uppercase tracking-[0.15em]">กรอกยอดตามบัญชีจริง ระบบจะบันทึก Snapshot และสร้างรายการปรับปรุง Ledger อัตโนมัติ เพื่อให้พอร์ต Dashboard ของคุณตรงกับความจริง 100% ครับ</p>
                  </div>
                  <button onClick={() => setShowReview(true)} className="w-full py-7 bg-white text-black rounded-3xl font-black text-sm uppercase tracking-[0.5em] shadow-2xl hover:bg-cyan-400 hover:text-black transition-all hover:scale-[1.01] active:scale-[0.99]">REVIEW AUDIT 👁️</button>
               </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-white/5 rounded-[56px] p-16 shadow-3xl flex flex-col gap-10 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px]"></div>
             <div className="space-y-4 relative z-10">
                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Final Synchronization</h2>
                <p className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.4em] italic opacity-60">Snapshot and Ledger reconciliation synchronization in progress</p>
             </div>
             <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-8 bg-cyan-500 text-black rounded-3xl font-black text-base uppercase tracking-[0.6em] shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:bg-white transition-all disabled:opacity-50 active:scale-95 z-10">
                {isSubmitting ? "SYNCING NODES..." : "COMMIT MASTER 💎"}
             </button>
             <button onClick={() => setShowReview(false)} disabled={isSubmitting} className="text-xs font-black uppercase tracking-[0.4em] text-zinc-700 hover:text-white transition-all text-center z-10">Return to Editor</button>
          </div>
        )}
      </main>
    </div>
  );
}
