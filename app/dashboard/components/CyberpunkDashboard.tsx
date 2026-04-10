"use client";

/**
 * Cyberpunk Dashboard - Glass morphism & Neon theme
 * 
 * Features:
 * - Portfolio management (add/edit/delete portfolios)
 * - Asset/Coin management (add/edit/delete assets)
 * - Individual asset analysis
 * - Real-time price tracking
 * - Dark cyberpunk theme only (no light mode)
 */

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { 
  Plus, Edit3, Trash2, Wallet, Coins, TrendingUp, Eye, X, ChevronRight, 
  Sparkles, Activity, BarChart3, Layers
} from "lucide-react";
import Navbar from "../../components/Navbar";
import { IconWithFallback } from "./IconWithFallback";
import { QuantitySparkline } from "./QuantitySparkline";
import { 
  getTransactions, 
  getDailySnapshots,
  saveTransaction,
  deleteTransaction
} from "../../actions/transactionActions";
import { getLatestTransactions } from "../../actions/testActions";
import { getActiveAssets } from "../../actions/marketActions";
import { AssetModal } from "./modals/AssetModal";
import { SUPPORTED_ASSETS, EXCHANGES_MAPPED, NEON_COLORS } from "../lib/constants";
import { getPriceKey } from "../lib/priceUtils";
import { GlassCard } from "../components/ui/GlassCard";
import { NeonButton } from "../components/ui/NeonButton";

// ============ TYPES ============
interface Transaction {
  id: number;
  userId?: string | null;
  broker: string;
  asset: string;
  amount: string;
  price?: string | null;
  type: string;
  note?: string | null;
  date: string;
  createdAt?: Date | null;
  portfolioId?: number | null;
}

interface DailySnapshot {
  date: string;
  totalValue: string;
  holdingsJson?: Record<string, number>;
}

interface PortfolioItem {
  broker: string;  // [STANDARD: 2026-04-05] This is the exchange_type (BINANCE_TH, BITKUB, CUSTOM, etc.)
  asset: string;
  amount: number;
  avgPrice?: number;
  exchangeRate?: number;
}

interface MarketData {
  binance: Record<string, number>;
  bitkub: Record<string, number>;
  okx: Record<string, number>;
  coingecko: Record<string, number>; // [ADDED: 2026-04-05] Global prices for Wallet/CUSTOM
  usdthb?: number;
}

interface Portfolio {
  id: string;
  dbId?: number; // Database ID for navigation
  name: string;
  customName?: string;
  icon: string;
  totalValue: number;
  assets: PortfolioItem[];
  broker: string;
}

// ============ PORTFOLIO NAME STORAGE (API) ============
// [EDITED]: Replaced localStorage with database storage via API

// Fetch all portfolios for current user
const fetchPortfolios = async (): Promise<Array<{id: number; name: string; exchangeType: string}>> => {
  try {
    console.log('[DEBUG] fetchPortfolios called');
    const res = await fetch('/api/portfolios');
    if (!res.ok) throw new Error('Failed to fetch portfolios');
    const data = await res.json();
    console.log('[DEBUG] fetchPortfolios - API response:', data);
    // Return array of portfolio objects with id, name, exchangeType
    return data.map((p: { id: number; name: string; exchangeType: string }) => ({
      id: p.id,
      name: p.name,
      exchangeType: p.exchangeType
    }));
  } catch (err) {
    console.error('[DEBUG] fetchPortfolios error:', err);
    return [];
  }
};

// Get portfolio name from API result
const getStoredPortfolioName = (
  portfolioMap: Array<{id: number; name: string; exchangeType: string}>,
  brokerId: string
): string | null => {
  const portfolio = portfolioMap.find(p => p.exchangeType === brokerId);
  const result = portfolio?.name || null;
  console.log(`[DEBUG] getStoredPortfolioName for ${brokerId}:`, result);
  return result;
};

// Save portfolio to database via API
const savePortfolioToDB = async (
  brokerId: string,
  name: string
): Promise<boolean> => {
  try {
    console.log(`[DEBUG] savePortfolioToDB called - brokerId: ${brokerId}, name: ${name}`);
    const res = await fetch('/api/portfolios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // [FIXED: 2026-04-05] Changed { brokerId, name } to { exchangeType, name }
      // Reason: API expects exchangeType field, not brokerId
      body: JSON.stringify({ exchangeType: brokerId, name }),
    });
    
    const data = await res.json();
    console.log('[DEBUG] savePortfolioToDB - API response:', data, 'Status:', res.status);
    
    if (!res.ok) {
      console.error('[DEBUG] API Error:', data.error);
      throw new Error(data.error || 'Failed to save portfolio');
    }
    
    return true;
  } catch (err) {
    console.error('[DEBUG] savePortfolioToDB error:', err);
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    alert(`Failed to create portfolio: ${errorMsg}`);
    return false;
  }
};

// Delete portfolio from database
// [FIXED: 2026-04-05] Changed to use portfolio ID instead of exchangeType
const deletePortfolioFromDB = async (portfolioId: number): Promise<boolean> => {
  try {
    console.log(`[DEBUG] deletePortfolioFromDB called - portfolioId: ${portfolioId}`);
    const res = await fetch(`/api/portfolios?id=${portfolioId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const error = await res.text();
      console.error('[DEBUG] deletePortfolioFromDB error response:', error);
      throw new Error(`Failed to delete portfolio: ${error}`);
    }
    console.log('[DEBUG] deletePortfolioFromDB - success');
    return true;
  } catch (err) {
    console.error('[DEBUG] deletePortfolioFromDB error:', err);
    return false;
  }
};

// [STANDARD: 2026-04-06] All shared constants imported from ../lib/constants
// EXCHANGES_MAPPED, NEON_COLORS, etc. - use centralized versions only

// ============ PORTFOLIO CARD COMPONENT ============
function PortfolioCard({ 
  portfolio,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}: {
  portfolio: Portfolio;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // Determine portfolio type
  const getPortfolioType = (brokerId: string) => {
    const exchangeIds = ["BINANCE_TH", "BITKUB", "OKX"];
    const walletIds = ["METAMASK", "LEDGER"];
    
    if (exchangeIds.includes(brokerId)) return { label: "BROKER", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" };
    if (walletIds.includes(brokerId)) return { label: "WALLET", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" };
    return { label: "CUSTOM", color: "text-pink-400 bg-pink-500/10 border-pink-500/30" };
  };

  const typeInfo = getPortfolioType(portfolio.broker);
  const displayName = portfolio.customName || portfolio.name;
  const brokerLabel = EXCHANGES_MAPPED.find(e => e.id === portfolio.broker)?.label || portfolio.broker;

  return (
    <GlassCard 
      interactive 
      glow={isSelected}
      className={`p-6 cursor-pointer ${isSelected ? "border-neon-cyan/50" : ""}`}
    >
      <div onClick={onSelect}>
        {/* Header with Type Badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 
                          flex items-center justify-center border border-neon-cyan/20 shrink-0">
              <Wallet className="w-6 h-6 text-neon-cyan" />
            </div>
            <div className="min-w-0 flex-1">
              {/* Portfolio Name - Prominent */}
              <h3 className="text-lg font-black text-white tracking-tight truncate" title={displayName}>
                {displayName}
              </h3>
              {/* Broker/Exchange Label */}
              <p className="text-xs text-slate-400 font-mono truncate">{brokerLabel}</p>
            </div>
          </div>
          {/* Type Badge */}
          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${typeInfo.color} shrink-0 ml-2`}>
            {typeInfo.label}
          </span>
          {isSelected && (
            <div className="w-3 h-3 rounded-full bg-neon-cyan neon-glow-cyan animate-pulse shrink-0 ml-2" />
          )}
        </div>
        
        {/* Asset Count */}
        <div className="mb-3">
          <p className="text-xs text-slate-500 font-mono">
            {portfolio.assets.length} {portfolio.assets.length === 1 ? 'asset' : 'assets'} tracked
          </p>
        </div>
        
        {/* Total Value */}
        <div className="space-y-1">
          <p className="text-xs text-slate-500 uppercase tracking-widest">Total Value</p>
          <p className="text-2xl font-black text-white font-mono">
            ฿{portfolio.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
      
      <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
        <NeonButton variant="secondary" onClick={onEdit} icon={Edit3} className="flex-1">
          Edit
        </NeonButton>
        <NeonButton variant="danger" onClick={onDelete} icon={Trash2} className="flex-1">
          Delete
        </NeonButton>
      </div>
    </GlassCard>
  );
}

// ============ ASSET ROW COMPONENT ============
function AssetRow({ 
  item, 
  prices,
  portfolioName,
  onClick,
  onEdit,
  onDelete
}: { 
  item: PortfolioItem;
  prices: MarketData;
  portfolioName?: string;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // [STANDARD: 2026-04-06] Price fetching using centralized getPriceKey from priceUtils.ts
  const priceKey = getPriceKey(item.broker);
  const priceSource = prices[priceKey] as Record<string, number>;
  const marketPrice = priceSource?.[item.asset] ?? 0;
  const currentValue = item.amount * marketPrice;
  const pnl = marketPrice > 0 && item.avgPrice 
    ? ((marketPrice - item.avgPrice) / item.avgPrice) * 100 
    : 0;
  
  // [FIXED: 2026-04-08] Use portfolioName if provided, otherwise lookup exchange label
  const displayBrokerLabel = portfolioName || 
    EXCHANGES_MAPPED.find(e => e.id === item.broker)?.label || 
    item.broker;
  
  return (
    <div 
      className="group grid grid-cols-12 gap-4 p-4 items-center 
                 hover:bg-neon-cyan/5 transition-all
                 border-b border-white/5 last:border-b-0"
    >
      {/* Asset Info - Clickable */}
      <div 
        className="col-span-3 flex items-center gap-3 cursor-pointer"
        onClick={onClick}
      >
        <IconWithFallback asset={item.asset} className="w-10 h-10" />
        <div>
          <p className="font-black text-white tracking-tight">{item.asset}</p>
          <p className="text-xs text-slate-500 font-mono">{displayBrokerLabel}</p>
        </div>
      </div>
      
      {/* Amount */}
      <div className="col-span-2 text-right">
        <p className="font-mono text-sm text-slate-300">
          {item.amount.toLocaleString(undefined, { maximumFractionDigits: item.asset === "THB" ? 2 : 6 })}
        </p>
      </div>
      
      {/* [FIXED: 2026-04-05] Price - Show avgPrice (buy price) instead of market price */}
      <div className="col-span-2 text-right">
        <p className="font-mono text-sm text-slate-300">
          {item.avgPrice ? `฿${item.avgPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "-"}
        </p>
        {marketPrice > 0 && (
          <p className="font-mono text-[10px] text-slate-500">
            M: ฿{marketPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        )}
      </div>
      
      {/* P&L */}
      <div className="col-span-2 text-right">
        <p className={`font-mono text-sm ${pnl >= 0 ? "text-neon-green" : "text-red-400"}`}>
          {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%
        </p>
      </div>
      
      {/* [FIXED: 2026-04-05] Value - Calculate using market price */}
      <div className="col-span-2 text-right">
        <p className="font-mono text-sm font-black text-neon-cyan">
          ฿{currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
      </div>
      
      {/* Actions */}
      <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 hover:bg-neon-cyan/20 rounded-lg transition-colors"
        >
          <Edit3 className="w-4 h-4 text-neon-cyan" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}

// ============ COMPONENT END ============

// ============ PORTFOLIO MODAL ============
function PortfolioModal({
  isOpen,
  onClose,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, brokerId: string) => void;
}) {
  const [portfolioName, setPortfolioName] = useState("");
  const [selectedBroker, setSelectedBroker] = useState("CUSTOM");
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-neon-cyan" />
            New Portfolio
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Portfolio Name */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Portfolio Name</label>
            <input
              type="text"
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              placeholder="My Portfolio"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3
                         text-white font-mono focus:border-neon-cyan focus:outline-none
                         focus:neon-glow-cyan transition-all placeholder:text-slate-600"
            />
          </div>
          
          {/* Exchange/Wallet Type */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Exchange/Wallet Type</label>
            <select
              value={selectedBroker}
              onChange={(e) => setSelectedBroker(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3
                         text-white font-mono focus:border-neon-cyan focus:outline-none
                         focus:neon-glow-cyan transition-all"
            >
              {EXCHANGES_MAPPED.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex gap-3 mt-8">
          <NeonButton variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </NeonButton>
          <NeonButton 
            variant="primary" 
            onClick={() => {
              if (portfolioName.trim()) {
                onSave(portfolioName.trim(), selectedBroker);
              }
            }}
            className="flex-1"
          >
            Create Portfolio
          </NeonButton>
        </div>
      </GlassCard>
    </div>
  );
}

// ============ CONFIRMATION MODAL COMPONENT ============
// [ADDED: 2026-04-05] Portfolio Creation Confirmation
// Reason: User feedback + data refresh confirmation before navigation
function PortfolioConfirmationModal({
  isOpen,
  portfolioName,
  exchangeType,
  onConfirm,
  onCancel
}: {
  isOpen: boolean;
  portfolioName: string;
  exchangeType: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  const exchangeLabel = EXCHANGES_MAPPED.find(e => e.id === exchangeType)?.label || exchangeType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-300">
        {/* Success Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/50 
                        flex items-center justify-center neon-glow-green">
            <Sparkles className="w-8 h-8 text-green-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-black text-white text-center mb-2">
          Portfolio Created Successfully! ✅
        </h2>
        
        {/* Portfolio Info */}
        <div className="space-y-3 mb-6 bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Portfolio Name</p>
            <p className="text-lg font-black text-neon-cyan font-mono">{portfolioName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Exchange/Wallet Type</p>
            <p className="text-sm text-white font-mono">{exchangeLabel}</p>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-slate-400 text-center mb-6">
          Your portfolio is now ready! Click below to view it on the Overview page.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <NeonButton variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </NeonButton>
          <NeonButton 
            variant="primary" 
            onClick={onConfirm}
            className="flex-1"
          >
            OK, Take Me There!
          </NeonButton>
        </div>
      </GlassCard>
    </div>
  );
}

// ============ PORTFOLIO EDIT MODAL COMPONENT ============
// [ADDED: 2026-04-05] Portfolio Edit/View Modal
// Reason: User requirement - Click card → show edit panel with assets
// Features: Display portfolio info + assets list + add asset button
function PortfolioEditModal({
  isOpen,
  portfolio,
  onClose,
  onAddAsset
}: {
  isOpen: boolean;
  portfolio: Portfolio | null;
  onClose: () => void;
  onAddAsset: () => void;
}) {
  if (!isOpen || !portfolio) return null;

  const exchangeLabel = EXCHANGES_MAPPED.find(e => e.id === portfolio.broker)?.label || portfolio.broker;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <GlassCard className="w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white">{portfolio.name}</h2>
            <p className="text-sm text-slate-400 font-mono">{exchangeLabel}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Total Value</p>
            <p className="text-2xl font-black text-neon-cyan font-mono">
              ฿{portfolio.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Assets Tracked</p>
            <p className="text-2xl font-black text-neon-purple font-mono">
              {portfolio.assets.length}
            </p>
          </div>
        </div>

        {/* Assets List */}
        <div className="mb-6">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3">Assets in Portfolio</h3>
          
          {portfolio.assets.length === 0 ? (
            <div className="bg-slate-900/50 rounded-xl p-6 text-center border border-slate-700/50">
              <Coins className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No assets yet</p>
              <p className="text-xs text-slate-500 mt-1">Click "Add Asset" to get started</p>
            </div>
          ) : (
            <div className="space-y-2 bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
              {portfolio.assets.map((asset, idx) => (
                <div key={`${asset.asset}_${idx}`} className="flex items-center justify-between p-3 border-b border-slate-700/30 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <IconWithFallback asset={asset.asset} className="w-8 h-8" />
                    <div>
                      <p className="text-sm font-bold text-white">{asset.asset}</p>
                      <p className="text-xs text-slate-400">
                        {asset.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <NeonButton variant="secondary" onClick={onClose} className="flex-1">
            Close
          </NeonButton>
          <NeonButton 
            variant="primary" 
            onClick={onAddAsset}
            icon={Plus}
            className="flex-1"
          >
            Add Asset
          </NeonButton>
        </div>
      </GlassCard>
    </div>
  );
}

// ============ ASSET DETAIL VIEW ============
function AssetDetailView({
  asset,
  data,
  prices,
  onBack
}: {
  asset: string;
  data: DailySnapshot[];
  prices: MarketData;
  onBack: () => void;
}) {
  const assetData = useMemo(() => {
    return data.map(d => ({
      date: d.date,
      quantity: d.holdingsJson?.[asset] || 0,
      value: (d.holdingsJson?.[asset] || 0) * 1000 // Approximate price
    }));
  }, [data, asset]);
  
  const totalQuantity = assetData[assetData.length - 1]?.quantity || 0;
  const currentPrice = prices.binance[asset] || prices.bitkub[asset] || prices.okx[asset] || 0;
  const totalValue = totalQuantity * currentPrice;
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <IconWithFallback asset={asset} className="w-16 h-16" />
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">{asset}</h2>
            <p className="text-neon-cyan font-mono text-lg">฿{currentPrice.toLocaleString()}</p>
          </div>
        </div>
        <NeonButton variant="secondary" onClick={onBack} icon={X}>
          Close
        </NeonButton>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <p className="text-xs text-slate-500 uppercase tracking-widest">Total Quantity</p>
          <p className="text-2xl font-black text-white font-mono mt-2">
            {totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-slate-500 uppercase tracking-widest">Total Value</p>
          <p className="text-2xl font-black text-neon-cyan font-mono mt-2 neon-text">
            ฿{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-slate-500 uppercase tracking-widest">% of Portfolio</p>
          <p className="text-2xl font-black text-neon-purple font-mono mt-2">
            --%
          </p>
        </GlassCard>
      </div>
      
      {/* Chart */}
      <GlassCard className="p-6 h-80">
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">
          Holdings History
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={assetData}>
            <defs>
              <linearGradient id="assetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(10, 10, 15, 0.95)', 
                border: '1px solid rgba(0, 245, 255, 0.3)', 
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}
              itemStyle={{ color: '#00F5FF', fontWeight: 900 }}
            />
            <Area 
              type="monotone" 
              dataKey="quantity"
              stroke="#00F5FF" 
              strokeWidth={3}
              fill="url(#assetGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
}

// ============ MAIN DASHBOARD COMPONENT ============
export default function CyberpunkDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);
  const [prices, setPrices] = useState<MarketData>({ binance: {}, bitkub: {}, okx: {}, coingecko: {}, usdthb: 35.0 });
  const [activeAssets, setActiveAssets] = useState<string[]>(SUPPORTED_ASSETS);
  const [loading, setLoading] = useState(true);
  
  // [EDITED]: Add portfolio names state from API
  const [portfolioNames, setPortfolioNames] = useState<Array<{id: number; name: string; exchangeType: string}>>([]);
  
  // UI State
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<PortfolioItem | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "assets" | "analysis">("overview");
  
  // [ADDED: 2026-04-05] Portfolio Edit Modal State
  // Reason: User requirement - click card to edit portfolio + add assets
  const [showPortfolioEditModal, setShowPortfolioEditModal] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  
  // [ADDED: 2026-04-05] Confirmation Modal State
  // Reason: Show portfolio creation success before navigation to overview
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{ name: string; exchangeType: string } | null>(null);
  
  // Data fetching
  useEffect(() => {
    async function loadData() {
      try {
        const [txData, snapData] = await Promise.all([
          getTransactions(),
          getDailySnapshots()
        ]);
        console.log("[DB LOAD] Transactions loaded:", txData.length);
        setTransactions(txData);
        setSnapshots(snapData.map(snap => ({
          ...snap,
          holdingsJson: (snap.holdingsJson as Record<string, number> | undefined) || undefined
        })) as DailySnapshot[]);
        
        // [EDITED]: Load portfolio names from API
        const portfolioData = await fetchPortfolios();
        setPortfolioNames(portfolioData);

        // [EDITED]: Load active assets from DB
        const dbAssets = await getActiveAssets();
        if (dbAssets && dbAssets.length > 0) {
          setActiveAssets(dbAssets);
        }
        
        // Build lookup map for quick access
        const portfolioMap: Record<string, string> = {};
        portfolioData.forEach(p => {
          portfolioMap[p.exchangeType] = p.name;
        });
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
    
    // Fetch prices
    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/ticker", { cache: "no-store" });
        const data = await res.json();
        setPrices(data);
      } catch (err) {
        console.error("Failed to fetch prices:", err);
      }
    };
    
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);
  
  // [ADDED: 2026-04-05] Handle query params - auto-open asset modal with pre-selected portfolio
  // Reason: Navigate from portfolio detail page to add asset
  useEffect(() => {
    const tab = searchParams.get('tab');
    const portfolioId = searchParams.get('portfolio');
    
    // [DEBUG: 2026-04-08] Trace auto-open behavior
    console.log(`[DEBUG] Auto-open check - tab: ${tab}, portfolioId: "${portfolioId}", loading: ${loading}, truthy: ${!!portfolioId}`);
    
    if (tab === 'assets' && !loading) {
      console.log(`[DEBUG] tab=assets and !loading, checking portfolioId...`);
      setActiveTab('assets');
      
      // If portfolio ID is provided, pre-select it
      if (portfolioId) {
        console.log(`[DEBUG] portfolioId is truthy: "${portfolioId}"`);
        const portfolio = portfolioNames.find(p => p.id === parseInt(portfolioId));
        if (portfolio) {
          console.log(`[DEBUG] Found portfolio: ${portfolio.exchangeType}, id: ${portfolio.id}`);
          // [FIXED: 2026-04-08] Use portfolio id (dbId) instead of exchangeType for consistent filtering
          setSelectedPortfolio(portfolio.id.toString());
          
          // [REMOVED: 2026-04-08] No auto-open modal - only open via button click
        } else {
          console.log(`[DEBUG] Portfolio not found for ID: ${portfolioId}`);
        }
      } else {
        console.log(`[DEBUG] No portfolioId, NOT opening modal automatically`);
      }
    } else {
      console.log(`[DEBUG] Skipping auto-open: tab=${tab}, loading=${loading}`);
    }
  }, [searchParams, portfolioNames, loading]);
  
  // Calculate portfolio from transactions
  const portfolios = useMemo(() => {
    console.log('[DEBUG] Calculating portfolios...');
    console.log(`[DEBUG] Total transactions: ${transactions.length}`);
    console.log(`[DEBUG] Portfolio names from API: `, Object.keys(portfolioNames).length, 'portfolios');
    
    // [FIXED: 2026-04-05] Changed to build portfolio list from API data, not just transactions
    // Reason: New portfolios without transactions were not showing
    // Changes: 
    //   1. Group transactions by exchangeType (matches API exchangeType)
    //   2. Create Portfolio object for EACH exchangeType in portfolioNames
    //   3. Merge transaction assets into each portfolio
    
    // [FIXED: 2026-04-08] Group transactions by portfolioId instead of exchange type
    // Reason: Each portfolio should have its own assets, not share by exchange type
    const portfolioMap = new Map<number, PortfolioItem[]>();
    
    transactions.forEach(tx => {
      // Use portfolioId to group assets per portfolio
      const portfolioId = tx.portfolioId;
      if (portfolioId === null || portfolioId === undefined) {
        // Skip transactions without portfolioId (legacy data)
        console.log(`[DEBUG] Skipping transaction without portfolioId: ${tx.asset}`);
        return;
      }
      
      if (!portfolioMap.has(portfolioId)) {
        portfolioMap.set(portfolioId, []);
      }
      
      const assets = portfolioMap.get(portfolioId)!;
      const existing = assets.find(a => a.asset === tx.asset);
      const amount = parseFloat(tx.amount);
      
      if (existing) {
        if (tx.type === "DEPOSIT") {
          existing.amount += amount;
        } else {
          existing.amount -= amount;
        }
        if (tx.price) {
          existing.avgPrice = parseFloat(tx.price);
        }
      } else {
        assets.push({
          broker: tx.broker,
          asset: tx.asset,
          amount: tx.type === "DEPOSIT" ? amount : -amount,
          avgPrice: tx.price ? parseFloat(tx.price) : undefined
        });
      }
    });

    console.log(`[DEBUG] Portfolio map entries: ${portfolioMap.size}`);
    portfolioMap.forEach((assets, portfolioId) => {
      console.log(`[DEBUG] Portfolio ${portfolioId}: ${assets.length} assets`);
    });
    
    // [FIXED: 2026-04-08] Changed to iterate through ALL portfolios from API
    // Reason: Multiple portfolios with same exchange type were not showing
    // Changes: Iterate through portfolioNames (from API) instead of exchange types
    
    console.log(`[DEBUG] Processing ${portfolioNames.length} portfolios from API`);
    
    // Convert to Portfolio array - ITERATE OVER ALL PORTFOLIOS FROM API
    const result = portfolioNames.map((apiPortfolio) => {
      const exchange = apiPortfolio.exchangeType;
      const exchangeInfo = EXCHANGES_MAPPED.find(e => e.id === exchange);
      const dbId = apiPortfolio.id;
      // [FIXED: 2026-04-08] Get assets by portfolioId (dbId) instead of exchange
      const assets = portfolioMap.get(dbId) || [];
      const validAssets = assets.filter(a => Math.abs(a.amount) > 0.000001);
      
      const customName = apiPortfolio.name;
      console.log(`[DEBUG] Processing portfolio ${dbId}: ${customName} (${exchange}), assets: ${validAssets.length}`);
      
      const totalValue = validAssets.reduce((sum, asset) => {
        const price = (prices[getPriceKey(exchange)] as Record<string, number>)?.[asset.asset] ?? 0;
        return sum + (asset.amount * price);
      }, 0);
      
      return {
        id: dbId.toString(),  // Always use dbId as unique id
        dbId,
        exchangeType: exchange,
        name: customName || exchangeInfo?.label || exchange,
        customName,
        broker: exchange,
        icon: exchangeInfo?.icon || "/coins/CUSTOM.png",
        totalValue,
        assets: validAssets
      };
    }).filter(p => {
      // Show all portfolios from API (they all have dbId and customName)
      const shouldShow = true; // Always show portfolios from API
      console.log(`[DEBUG] Portfolio ${p.id} (${p.name}): ${shouldShow ? '✓ SHOW' : '✗ HIDE'}`);
      return shouldShow;
    });
    
    console.log(`[DEBUG] Final portfolios count: ${result.length}`);
    return result;
  }, [transactions, prices, portfolioNames]);
  
  const totalPortfolioValue = portfolios.reduce((sum, p) => sum + p.totalValue, 0);
  
  // Get assets for selected portfolio
  const currentAssets = selectedPortfolio 
    ? portfolios.find(p => p.id === selectedPortfolio)?.assets || []
    : portfolios.flatMap(p => p.assets);
  
  // Handle save asset (add or edit)
  const handleSaveAsset = async (data: Partial<PortfolioItem>, isEditing: boolean = false) => {
    try {
      if (isEditing && editingAsset) {
        // Calculate the difference for editing
        const currentAmount = editingAsset.amount;
        const newAmount = data.amount || 0;
        const diff = newAmount - currentAmount;
        
        // [EDITED]: Always save in edit mode if price is provided (for price-only updates)
        const shouldSave = Math.abs(diff) > 0.000001 || (data.avgPrice !== undefined);
        
        if (shouldSave) {
          // Find portfolio dbId for Level 2 architecture
          const portfolio = portfolios.find(p => p.id === data.broker);
          const portfolioDbId = portfolio?.dbId;
          
          // Create adjustment transaction
          await saveTransaction({
            broker: data.broker!,
            portfolioId: portfolioDbId,
            asset: data.asset!,
            amount: Math.abs(diff) > 0.000001 ? Math.abs(diff).toString() : "0",
            price: data.avgPrice?.toString(),
            type: diff > 0 ? "DEPOSIT" : "WITHDRAW",
            note: data.exchangeRate ? `Exchange Rate: ${data.exchangeRate} THB/USD` : undefined,
            date: new Date().toISOString().split('T')[0]
          });
        }
      } else {
        // Find portfolio dbId for Level 2 architecture
        const portfolio = portfolios.find(p => p.id === data.broker);
        const portfolioDbId = portfolio?.dbId;
        
        // [EDITED]: Include price (avgPrice) in transaction
        await saveTransaction({
          broker: data.broker!,
          portfolioId: portfolioDbId,
          asset: data.asset!,
          amount: data.amount!.toString(),
          price: data.avgPrice?.toString(),
          type: "DEPOSIT",
          note: data.exchangeRate ? `Exchange Rate: ${data.exchangeRate} THB/USD` : undefined,
          date: new Date().toISOString().split('T')[0]
        });
      }
      
      // Refresh data from database
      const txData = await getTransactions();
      setTransactions(txData);
      
      // [EDITED]: Reset editing state and close modal to auto-update UI
      setEditingAsset(null);
      setShowAssetModal(false);
      
      // Auto-select the portfolio where asset was added so it appears immediately
      if (data.broker) {
        setSelectedPortfolio(data.broker);
      }
      
      // [ADDED: 2026-04-08] Refresh page after successful save
      window.location.reload();
    } catch (err) {
      console.error("Failed to save asset:", err);
      alert("Failed to save: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };
  
  // Handle delete asset - ACTUALLY DELETE from database
  const handleDeleteAsset = async (asset: PortfolioItem) => {
    try {
      console.log(`[DELETE ASSET] Starting deletion: ${asset.asset} from ${asset.broker}, amount: ${asset.amount}`);
      
      // Find the portfolio dbId
      const portfolio = portfolios.find(p => p.id === asset.broker);
      const portfolioDbId = portfolio?.dbId;
      
      // Get all transactions for this asset - ONLY for this specific portfolio
      // [FIXED: 2026-04-06] Match by portfolioId only to avoid deleting from other portfolios with same broker
      const assetTransactions = transactions.filter(
        tx => tx.asset === asset.asset && 
              portfolioDbId && tx.portfolioId === portfolioDbId
      );
      
      // Fallback: if no portfolioId match found, try broker (legacy mode)
      // But warn if multiple portfolios have same broker
      if (assetTransactions.length === 0 && !portfolioDbId) {
        console.warn(`[DELETE ASSET] No portfolioId for ${asset.asset}, falling back to broker match (may affect multiple portfolios)`);
      }
      
      console.log(`[DELETE ASSET] Found ${assetTransactions.length} transactions to delete`);
      
      // Delete each transaction
      for (const tx of assetTransactions) {
        await deleteTransaction(tx.id);
        console.log(`[DELETE ASSET] Deleted transaction ${tx.id}`);
      }
      
      console.log(`[DELETE ASSET] Successfully deleted all transactions for ${asset.asset}`);
      
      // Refresh data
      const txData = await getTransactions();
      setTransactions(txData);
      console.log(`[DELETE ASSET] Refreshed transactions: ${txData.length} total`);
    } catch (err) {
      console.error("[DELETE ASSET] Failed:", err);
      alert("Failed to delete asset: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1f] flex items-center justify-center">
        <div className="text-neon-cyan font-mono text-sm animate-pulse">
          INITIALIZING SYSTEM...
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0a0a1f] text-slate-200 grid-cyber">
      <Navbar />
      
      <main className="max-w-400 mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
            ASSET <span className="text-neon-cyan neon-text">COMMAND</span>
          </h1>
          <p className="text-slate-500 font-mono text-sm">
            Total Portfolio Value: 
            <span className="text-neon-cyan font-bold ml-2">
              ฿{totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-slate-600 ml-4 text-xs">
              1 USD = {prices.usdthb?.toFixed(2) || 35.00} THB
            </span>
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "assets", label: "Assets", icon: Coins },
            { id: "analysis", label: "Analysis", icon: Activity }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs uppercase
                transition-all duration-300
                ${activeTab === tab.id 
                  ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 neon-glow-cyan" 
                  : "bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-slate-600"
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Portfolio Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolios.map(portfolio => (
                <PortfolioCard
                  key={portfolio.id}
                  portfolio={portfolio}
                  isSelected={selectedPortfolio === portfolio.id}
                  onSelect={() => {
                    // [EDITED: 2026-04-05] Navigate to portfolio detail page
                    // Reason: User requirement - click card → open portfolio detail page
                    if (portfolio.dbId) {
                      router.push(`/dashboard/portfolio/${portfolio.dbId}`);
                    } else {
                      // Fallback to selection if no dbId (legacy portfolios)
                      setSelectedPortfolio(
                        selectedPortfolio === portfolio.id ? null : portfolio.id
                      );
                    }
                  }}
                  onEdit={() => {
                    // [EDITED: 2026-04-05] Open Portfolio Edit Modal instead of tab switch
                    // Reason: User requirement - click card → show edit modal with assets
                    console.log(`[DEBUG] Opening portfolio edit modal for: ${portfolio.name}`);
                    setEditingPortfolio(portfolio);
                    setShowPortfolioEditModal(true);
                  }}
                  onDelete={async () => {
                    // [DEBUG]: Delete portfolio and all its assets
                    console.log(`[DELETE] Attempting to delete portfolio: ${portfolio.name} (dbId: ${portfolio.dbId}, exchange: ${portfolio.id})`);
                    console.log(`[DELETE] Assets to delete: ${portfolio.assets.length}`);
                    
                    if (confirm(`Delete portfolio "${portfolio.name}" and all its assets?\n\nThis will remove ${portfolio.assets.length} assets.`)) {
                      console.log('[DELETE] User confirmed, proceeding...');
                      
                      // Step 1: Delete all assets first
                      for (const asset of portfolio.assets) {
                        console.log(`[DELETE] Deleting asset: ${asset.asset}`);
                        await handleDeleteAsset(asset);
                      }
                      
                      // Step 2: Delete the portfolio from database (use dbId, not id!)
                      const portfolioDbId = portfolio.dbId;
                      if (!portfolioDbId) {
                        console.error('[DELETE] Cannot delete - no dbId found for portfolio');
                        alert('Cannot delete: Portfolio ID not found');
                        return;
                      }
                      
                      console.log(`[DELETE] Deleting portfolio from DB, id: ${portfolioDbId}`);
                      const success = await deletePortfolioFromDB(portfolioDbId);
                      
                      if (success) {
                        console.log('[DELETE] Portfolio deleted successfully');
                        // Step 3: Refresh portfolio data
                        const portfolioData = await fetchPortfolios();
                        setPortfolioNames(portfolioData);
                        
                        // Clear selection if deleted portfolio was selected
                        if (selectedPortfolio === portfolio.id) {
                          setSelectedPortfolio(null);
                        }
                        
                        alert(`Portfolio "${portfolio.name}" deleted successfully.`);
                      } else {
                        console.error('[DELETE] Failed to delete portfolio');
                        alert('Failed to delete portfolio. Please try again.');
                      }
                    } else {
                      console.log('[DELETE] User cancelled');
                    }
                  }}
                />
              ))}
              
              {/* Add Portfolio Card */}
              <button 
                onClick={() => setShowPortfolioModal(true)}
                className="group p-6 rounded-3xl border border-dashed border-slate-700
                          flex flex-col items-center justify-center gap-3
                          hover:border-neon-cyan/50 hover:bg-neon-cyan/5
                          transition-all min-h-[200px]"
              >
                <Plus className="w-8 h-8 text-slate-500 group-hover:text-neon-cyan transition-colors" />
                <span className="text-sm text-slate-500 group-hover:text-neon-cyan font-mono uppercase">
                  New Portfolio
                </span>
              </button>
            </div>
            
            {/* Portfolio Distribution Chart */}
            {portfolios.length > 0 && (
              <GlassCard className="p-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-neon-cyan" />
                  Portfolio Distribution
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolios}
                        dataKey="totalValue"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                      >
                        {portfolios.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={NEON_COLORS[index % NEON_COLORS.length]}
                            stroke="rgba(0,0,0,0.5)"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(10, 10, 15, 0.95)',
                          border: '1px solid rgba(0, 245, 255, 0.3)',
                          borderRadius: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}
          </div>
        )}
        
        {activeTab === "assets" && (
          <div className="space-y-6">
            {/* Asset Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">
                  {selectedPortfolio 
                    ? EXCHANGES_MAPPED.find(e => e.id === selectedPortfolio)?.label || selectedPortfolio
                    : "All Assets"
                  }
                </h2>
                <p className="text-sm text-slate-500 font-mono">
                  {currentAssets.length} assets tracked
                </p>
              </div>
              <div className="flex items-center gap-3">
                <NeonButton 
                  variant="primary" 
                  onClick={() => {
                    setEditingAsset(null);
                    setShowAssetModal(true);
                  }}
                  icon={Plus}
                >
                  ADD ASSET
                </NeonButton>
              </div>
            </div>
            
            {/* Asset List */}
            <GlassCard className="overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-slate-900/30">
                <div className="col-span-3 text-xs font-black text-slate-500 uppercase tracking-widest">Asset</div>
                <div className="col-span-2 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Amount</div>
                <div className="col-span-2 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Price</div>
                <div className="col-span-2 text-right text-xs font-black text-slate-500 uppercase tracking-widest">P&L</div>
                <div className="col-span-2 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Value</div>
                <div className="col-span-1"></div>
              </div>
              
              {/* Asset Rows */}
              <div className="divide-y divide-white/5">
                {(selectedPortfolio
                  ? portfolios.filter(p => p.id === selectedPortfolio)
                  : portfolios
                ).flatMap(p =>
                  p.assets.map((item, idx) => (
                    <AssetRow
                      key={`${p.id}_${item.asset}_${idx}`}
                      item={item}
                      portfolioName={p.name}
                      prices={prices}
                      onClick={() => setSelectedAsset(item.asset)}
                      onEdit={() => {
                        setEditingAsset(item);
                        setShowAssetModal(true);
                      }}
                      onDelete={() => handleDeleteAsset(item)}
                    />
                  ))
                )}
              </div>
              
              {currentAssets.length === 0 && (
                <div className="p-12 text-center">
                  <Coins className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-mono">No assets found</p>
                  <p className="text-slate-600 text-sm mt-1">Add your first asset to get started</p>
                </div>
              )}
            </GlassCard>
          </div>
        )}
        
        {activeTab === "analysis" && selectedAsset && (
          <AssetDetailView
            asset={selectedAsset}
            data={snapshots}
            prices={prices}
            onBack={() => setSelectedAsset(null)}
          />
        )}
        
        {activeTab === "analysis" && !selectedAsset && (
          <GlassCard className="p-12 text-center">
            <Activity className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-black text-white mb-2">Select an Asset</h3>
            <p className="text-slate-500 font-mono max-w-md mx-auto">
              Go to the Assets tab and click on any asset to view detailed analysis,
              price history, and performance metrics.
            </p>
          </GlassCard>
        )}
      </main>
      
      {/* Asset Modal */}
      {/* [FIXED: 2026-04-05] Pass portfolio info - no Exchange selector in modal */}
      <AssetModal
        isOpen={showAssetModal}
        onClose={() => {
          setShowAssetModal(false);
          setEditingAsset(null);
        }}
        onSave={(data) => handleSaveAsset(data, !!editingAsset)}
        initialData={editingAsset || undefined}
        title={editingAsset ? "Edit Asset" : "Add New Asset"}
        portfolioExchangeType={selectedPortfolio || editingAsset?.broker}
        portfolios={portfolios}
        dynamicAssets={activeAssets}
        portfolioName={(() => {
          // [FIXED: 2026-04-05] Proper portfolio name lookup
          // Priority: 1) Custom portfolio name, 2) EXCHANGES_MAPPED label, 3) Broker ID
          const portfolio = portfolios.find(p => p.id === selectedPortfolio);
          if (portfolio?.customName && portfolio.customName !== selectedPortfolio) {
            return portfolio.customName;
          }
          // Lookup from EXCHANGES_MAPPED for friendly display name
          const exchangeLabel = EXCHANGES_MAPPED.find(e => e.id === selectedPortfolio)?.label;
          if (exchangeLabel) {
            return exchangeLabel;
          }
          // Fallback: editing asset's broker or selectedPortfolio
          return editingAsset?.broker || selectedPortfolio || "Unknown";
        })()}
      />
      
      {/* Portfolio Modal */}
      <PortfolioModal
        isOpen={showPortfolioModal}
        onClose={() => {
          console.log('[DEBUG] PortfolioModal onClose called');
          setShowPortfolioModal(false);
        }}
        onSave={async (portfolioName, brokerId) => {
          console.log('[DEBUG] ========== PORTFOLIO CREATION START ==========');
          console.log(`[DEBUG] PortfolioModal onSave called with:`);
          console.log(`[DEBUG]   - portfolioName: "${portfolioName}"`);
          console.log(`[DEBUG]   - brokerId: "${brokerId}"`);
          
          // [EDITED: 2026-04-05] Portfolio Creation Flow with Confirmation
          // Reason: User requirement - show confirmation before navigation
          // Changes: Save → Show Confirmation Modal → Wait for OK → Go to Overview
          
          console.log(`[DEBUG] Step 1: Calling savePortfolioToDB("${brokerId}", "${portfolioName}")`);
          const success = await savePortfolioToDB(brokerId, portfolioName);
          
          if (success) {
            console.log(`[DEBUG] Step 2: Portfolio saved successfully`);
            console.log(`[DEBUG] Step 3: Closing portfolio modal`);
            setShowPortfolioModal(false);
            
            console.log(`[DEBUG] Step 4: Showing confirmation dialog`);
            setConfirmationData({ name: portfolioName, exchangeType: brokerId });
            setShowConfirmation(true);
          } else {
            console.log(`[DEBUG] ERROR: Failed to save portfolio`);
            alert("Failed to create portfolio. Please try again.");
          }
        }}
      />
      
      {/* Portfolio Edit Modal */}
      {/* [ADDED: 2026-04-05] Edit/view portfolio with assets */}
      <PortfolioEditModal
        isOpen={showPortfolioEditModal}
        portfolio={editingPortfolio}
        onClose={() => {
          console.log('[DEBUG] Closing portfolio edit modal');
          setShowPortfolioEditModal(false);
          setEditingPortfolio(null);
        }}
        onAddAsset={() => {
          console.log('[DEBUG] Add Asset clicked from portfolio modal');
          // Close portfolio modal and go to add asset
          setShowPortfolioEditModal(false);
          setEditingAsset(null);
          setShowAssetModal(true);
        }}
      />
      
      {/* Portfolio Confirmation Modal */}
      {/* [ADDED: 2026-04-05] Show confirmation after portfolio creation */}
      {confirmationData && (
        <PortfolioConfirmationModal
          isOpen={showConfirmation}
          portfolioName={confirmationData.name}
          exchangeType={confirmationData.exchangeType}
          onConfirm={() => {
            console.log('[DEBUG] Step 5: Confirmation OK clicked');
            setShowConfirmation(false);
            setConfirmationData(null);
            
            console.log('[DEBUG] Step 6: Updating portfolio names state');
            // Must keep portfolioNames as an Array, not Object
            fetchPortfolios().then(data => setPortfolioNames(data));
            
            console.log('[DEBUG] Step 7: Going to overview tab');
            setActiveTab("overview");
            
            console.log('[DEBUG] Step 8: Clearing selections');
            setSelectedPortfolio(null);
            
            console.log('[DEBUG] ========== PORTFOLIO CREATION COMPLETE ==========');
            console.log('[DEBUG] Next: User can now add assets or create another portfolio');
          }}
          onCancel={() => {
            console.log('[DEBUG] Confirmation cancelled');
            setShowConfirmation(false);
            setConfirmationData(null);
          }}
        />
      )}
    </div>
  );
}
