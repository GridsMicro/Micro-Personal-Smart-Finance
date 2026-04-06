"use client";

/**
 * Portfolio Detail Page
 * 
 * Shows detailed view of a specific portfolio with all its assets.
 * Data is fetched from database using portfolio ID.
 */

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Wallet, 
  Coins,
  Activity
} from "lucide-react";
import { AuthGuard } from "../../../lib/auth-guard";
import { IconWithFallback } from "../../components/IconWithFallback";
import { getPortfolioById, deleteTransaction } from "../../../actions/transactionActions";
import Navbar from "../../../components/Navbar";

// ============ TYPES ============
interface Transaction {
  id: number;
  portfolioId?: number | null;
  broker: string;
  asset: string;
  amount: string;
  price?: string | null;
  type: string;
  note?: string | null;
  date: string;
  createdAt?: Date | null;
}

interface PortfolioData {
  portfolio: {
    id: number;
    userId: string;
    name: string;
    description: string | null;
    exchangeType: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };
  transactions: Transaction[];
}

interface PortfolioItem {
  asset: string;
  broker: string;
  amount: number;
  avgPrice?: number;
  totalValue: number;
}

interface MarketData {
  binance: Record<string, number>;
  bitkub: Record<string, number>;
  okx: Record<string, number>;
  usdthb: number;
}

// ============ EXCHANGE MAPPING ============
const EXCHANGES_MAPPED = [
  { id: "BINANCE_TH", label: "Binance TH", icon: "/coins/BINANCE-EX.png", color: "#F0B90B" },
  { id: "BITKUB", label: "Bitkub", icon: "/coins/BITKUB-EX.png", color: "#00D4AA" },
  { id: "OKX", label: "OKX", icon: "/coins/OKX_logo.svg.png", color: "#000000" },
  { id: "METAMASK", label: "MetaMask", icon: "/coins/METAMASK.png", color: "#E2761B" },
  { id: "LEDGER", label: "Ledger", icon: "/coins/LEDGER.png", color: "#FFFFFF" },
  { id: "CUSTOM", label: "Custom", icon: "/coins/CUSTOM.png", color: "#00F5FF" }
];

// Helper function (not used currently but kept for future use)

// ============ GLASS CARD COMPONENT ============
function GlassCard({ 
  children, 
  className = "", 
  glow = false 
}: { 
  children: React.ReactNode; 
  className?: string;
  glow?: boolean;
}) {
  return (
    <div 
      className={`
        relative overflow-hidden rounded-3xl
        bg-linear-to-br from-slate-900/80 to-slate-950/60
        backdrop-blur-xl border border-neon-cyan/15
        shadow-glass
        ${glow ? "neon-glow-cyan" : ""}
        ${className}
      `}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-neon-cyan/50 to-transparent" />
      {children}
    </div>
  );
}

// ============ NEON BUTTON COMPONENT ============
function NeonButton({ 
  children, 
  onClick, 
  variant = "primary",
  icon: Icon,
  className = ""
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  const variants = {
    primary: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30 hover:bg-neon-cyan/20 hover:neon-glow-cyan",
    secondary: "bg-slate-800/50 text-slate-300 border-slate-600/30 hover:bg-slate-700/50",
    danger: "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl
        border backdrop-blur-sm
        transition-all duration-300
        font-mono text-xs uppercase tracking-wider
        ${variants[variant]}
        ${className}
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

// ============ ASSET ROW COMPONENT ============
function AssetRow({ 
  item, 
  prices
}: { 
  item: PortfolioItem;
  prices: MarketData;
}) {
  const getPriceKey = (broker: string): keyof MarketData => {
    const map: Record<string, keyof MarketData> = {
      "BINANCE_TH": "binance",
      "BITKUB": "bitkub", 
      "OKX": "okx",
      "METAMASK": "binance",
      "LEDGER": "binance",
      "CUSTOM": "binance"
    };
    return map[broker] || "binance";
  };

  const price = (prices[getPriceKey(item.broker)] as Record<string, number>)?.[item.asset] ?? 0;
  const currentValue = item.amount * price;
  const pnl = price > 0 && item.avgPrice 
    ? ((price - item.avgPrice) / item.avgPrice) * 100 
    : 0;

  return (
    <div 
      className="group grid grid-cols-12 gap-4 p-4 items-center 
                 hover:bg-neon-cyan/5 transition-all
                 border-b border-white/5 last:border-b-0"
    >
      {/* Asset Info */}
      <div className="col-span-3 flex items-center gap-3">
        <IconWithFallback asset={item.asset} className="w-10 h-10" />
        <div>
          <p className="font-black text-white tracking-tight">{item.asset}</p>
          <p className="text-xs text-slate-500 font-mono">{item.broker}</p>
        </div>
      </div>
      
      {/* Amount */}
      <div className="col-span-2 text-right">
        <p className="font-mono text-sm text-slate-300">
          {item.amount.toLocaleString(undefined, { maximumFractionDigits: item.asset === "THB" ? 2 : 6 })}
        </p>
      </div>
      
      {/* Avg Price */}
      <div className="col-span-2 text-right">
        <p className="font-mono text-sm text-slate-300">
          {item.avgPrice ? `฿${item.avgPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "-"}
        </p>
      </div>
      
      {/* Current Price */}
      <div className="col-span-2 text-right">
        <p className="font-mono text-sm text-slate-300">
          ฿{price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
      </div>
      
      {/* P&L */}
      <div className="col-span-2 text-right">
        <p className={`font-mono text-sm ${pnl >= 0 ? "text-neon-green" : "text-red-400"}`}>
          {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%
        </p>
      </div>
      
      {/* Value */}
      <div className="col-span-1 text-right">
        <p className="font-mono text-sm font-black text-neon-cyan">
          ฿{currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
      </div>
    </div>
  );
}

// ============ MAIN PAGE COMPONENT ============
export default function PortfolioDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const { id } = use(params);
  const portfolioId = parseInt(id);
  
  const [loading, setLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [prices, setPrices] = useState<MarketData>({ binance: {}, bitkub: {}, okx: {}, usdthb: 35 });
  const [error, setError] = useState<string | null>(null);

  // Fetch market prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/ticker');
        if (res.ok) {
          const data = await res.json();
          setPrices({
            binance: data.binance || {},
            bitkub: data.bitkub || {},
            okx: data.okx || {},
            usdthb: data.usdthb || 35
          });
        }
      } catch (err) {
        console.error('Failed to fetch prices:', err);
      }
    };
    
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch portfolio data
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const data = await getPortfolioById(portfolioId);
        if (!data) {
          setError("Portfolio not found");
        } else {
          setPortfolioData(data);
        }
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
        setError("Failed to load portfolio data");
      } finally {
        setLoading(false);
      }
    };

    if (!isNaN(portfolioId)) {
      fetchPortfolio();
    }
  }, [portfolioId]);

  // Calculate portfolio items from transactions
  const portfolioItems = (() => {
    if (!portfolioData?.transactions) return [];
    
    const holdings: Record<string, PortfolioItem> = {};

    // Group transactions by asset
    const assetGroups: Record<string, Transaction[]> = {};
    portfolioData.transactions.forEach(tx => {
      if (!assetGroups[tx.asset]) assetGroups[tx.asset] = [];
      assetGroups[tx.asset].push(tx);
    });

    // Calculate holdings for each asset
    Object.entries(assetGroups).forEach(([asset, txs]) => {
      let amount = 0;
      let cost = 0;

      txs.forEach(tx => {
        const txAmount = parseFloat(tx.amount);
        const txPrice = tx.price ? parseFloat(tx.price) : 0;

        if (tx.type === 'DEPOSIT') {
          amount += txAmount;
          if (txPrice > 0) {
            cost += txAmount * txPrice;
          }
        } else if (tx.type === 'WITHDRAW') {
          amount -= txAmount;
          if (txPrice > 0 && amount > 0) {
            cost -= txAmount * txPrice;
          }
        }
      });

      if (amount > 0.000001) {
        const avgPrice = cost / amount;
        holdings[asset] = {
          asset,
          broker: txs[0].broker,
          amount,
          avgPrice: avgPrice > 0 ? avgPrice : undefined,
          totalValue: cost
        };
      }
    });

    return Object.values(holdings);
  })();

  // Calculate total portfolio value
  const totalPortfolioValue = portfolioItems.reduce((sum, item) => {
    const getPriceKey = (broker: string): keyof MarketData => {
      const map: Record<string, keyof MarketData> = {
        "BINANCE_TH": "binance",
        "BITKUB": "bitkub", 
        "OKX": "okx",
        "METAMASK": "binance",
        "LEDGER": "binance",
        "CUSTOM": "binance"
      };
      return map[broker] || "binance";
    };
    const price = (prices[getPriceKey(item.broker)] as Record<string, number>)?.[item.asset] ?? 0;
    return sum + (item.amount * price);
  }, 0);

  // Get portfolio type label
  const getPortfolioType = (exchangeType: string | null) => {
    const exchangeIds = ["BINANCE_TH", "BITKUB", "OKX"];
    const walletIds = ["METAMASK", "LEDGER"];
    
    if (!exchangeType) return { label: "CUSTOM", color: "text-pink-400 bg-pink-500/10 border-pink-500/30" };
    if (exchangeIds.includes(exchangeType)) return { label: "BROKER", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" };
    if (walletIds.includes(exchangeType)) return { label: "WALLET", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" };
    return { label: "CUSTOM", color: "text-pink-400 bg-pink-500/10 border-pink-500/30" };
  };

  const handleDeleteAsset = async (asset: PortfolioItem) => {
    const txs = portfolioData?.transactions.filter(
      tx => tx.asset === asset.asset && tx.type === 'DEPOSIT'
    );
    
    if (!txs || txs.length === 0) return;
    
    if (confirm(`Delete all ${asset.asset} holdings?\nAmount: ${asset.amount}`)) {
      try {
        for (const tx of txs) {
          await deleteTransaction(tx.id);
        }
        // Refresh data
        const data = await getPortfolioById(portfolioId);
        if (data) setPortfolioData(data);
      } catch (err) {
        console.error('Failed to delete asset:', err);
        alert('Failed to delete asset');
      }
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#0a0a1f] flex items-center justify-center">
          <div className="text-neon-cyan font-mono text-sm animate-pulse">
            INITIALIZING SYSTEM...
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !portfolioData) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#0a0a1f] flex items-center justify-center">
          <GlassCard className="p-8 text-center">
            <p className="text-red-400 font-mono mb-4">{error || "Portfolio not found"}</p>
            <NeonButton onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </NeonButton>
          </GlassCard>
        </div>
      </AuthGuard>
    );
  }

  const { portfolio } = portfolioData;
  const typeInfo = getPortfolioType(portfolio.exchangeType);
  const exchangeLabel = EXCHANGES_MAPPED.find(e => e.id === portfolio.exchangeType)?.label || portfolio.exchangeType || "Custom";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0a0a1f] text-slate-200">
        <Navbar />
        
        <main className="max-w-6xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-neon-cyan transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-mono text-sm uppercase">Back to Dashboard</span>
          </button>

          {/* Portfolio Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 
                              flex items-center justify-center border border-neon-cyan/20">
                  <Wallet className="w-8 h-8 text-neon-cyan" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tight">{portfolio.name}</h1>
                  <p className="text-sm text-slate-400 font-mono">{exchangeLabel}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
              </div>
              
              <NeonButton 
                onClick={() => router.push('/dashboard')}
                variant="secondary"
              >
                Edit Portfolio
              </NeonButton>
            </div>
            
            {portfolio.description && (
              <p className="text-slate-400 text-sm mb-4">{portfolio.description}</p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <GlassCard className="p-6" glow>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Total Value</p>
              <p className="text-3xl font-black text-neon-cyan font-mono">
                ฿{totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </GlassCard>
            
            <GlassCard className="p-6">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Assets Tracked</p>
              <p className="text-3xl font-black text-white font-mono">
                {portfolioItems.length}
              </p>
            </GlassCard>
            
            <GlassCard className="p-6">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Transactions</p>
              <p className="text-3xl font-black text-white font-mono">
                {portfolioData.transactions.length}
              </p>
            </GlassCard>
          </div>

          {/* Assets Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-neon-cyan" />
                Portfolio Assets
              </h2>
              {portfolioItems.length > 0 && (
                <NeonButton 
                  onClick={() => router.push(`/dashboard?tab=assets&portfolio=${portfolioId}`)}
                  icon={Plus}
                >
                  Add Asset
                </NeonButton>
              )}
            </div>

            {portfolioItems.length > 0 ? (
              <GlassCard className="overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-slate-900/30">
                  <div className="col-span-3 text-xs font-black text-slate-500 uppercase tracking-widest">Asset</div>
                  <div className="col-span-2 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Amount</div>
                  <div className="col-span-2 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Avg Price</div>
                  <div className="col-span-2 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Current</div>
                  <div className="col-span-2 text-right text-xs font-black text-slate-500 uppercase tracking-widest">P&L</div>
                  <div className="col-span-1 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Value</div>
                </div>
                
                {/* Asset Rows */}
                <div className="divide-y divide-white/5">
                  {portfolioItems.map((item, idx) => (
                    <AssetRow
                      key={`${item.asset}_${idx}`}
                      item={item}
                      prices={prices}
                    />
                  ))}
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="p-12 text-center">
                <Coins className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 font-mono mb-2">No assets found</p>
                <p className="text-slate-600 text-sm mb-4">Add your first asset to get started</p>
                <NeonButton 
                  onClick={() => router.push('/dashboard?tab=assets')}
                  icon={Plus}
                >
                  Add Asset
                </NeonButton>
              </GlassCard>
            )}
          </div>

          {/* Transactions History */}
          {portfolioData.transactions.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-neon-cyan" />
                Recent Transactions
              </h2>
              
              <GlassCard className="overflow-hidden">
                <div className="divide-y divide-white/5">
                  {portfolioData.transactions.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${tx.type === 'DEPOSIT' ? 'bg-neon-green' : 'bg-red-400'}`} />
                        <div>
                          <p className="text-sm font-bold text-white">{tx.type} {tx.asset}</p>
                          <p className="text-xs text-slate-500 font-mono">{tx.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-white">
                          {parseFloat(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })} {tx.asset}
                        </p>
                        {tx.price && (
                          <p className="text-xs text-slate-500 font-mono">
                            @ ฿{parseFloat(tx.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
