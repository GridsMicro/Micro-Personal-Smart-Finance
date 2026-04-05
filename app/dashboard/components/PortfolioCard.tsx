"use client";

import { Wallet, Edit3, Trash2 } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { NeonButton } from "./ui/NeonButton";
import { Portfolio, EXCHANGES_MAPPED } from "../lib/constants";

interface PortfolioCardProps {
  portfolio: Portfolio;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PortfolioCard({
  portfolio,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}: PortfolioCardProps) {
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
              <h3 className="text-lg font-black text-white tracking-tight truncate" title={displayName}>
                {displayName}
              </h3>
              <p className="text-xs text-slate-400 font-mono truncate">{brokerLabel}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${typeInfo.color} shrink-0 ml-2`}>
            {typeInfo.label}
          </span>
          {isSelected && (
            <div className="w-3 h-3 rounded-full bg-neon-cyan shadow-[0_0_10px_rgba(0,245,255,0.5)] animate-pulse shrink-0 ml-2" />
          )}
        </div>

        {/* Asset Count */}
        <div className="mb-3">
          <p className="text-xs text-slate-500 font-mono">
            {portfolio.assets.length} {portfolio.assets.length === 1 ? "asset" : "assets"} tracked
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
