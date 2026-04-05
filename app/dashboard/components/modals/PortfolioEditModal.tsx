"use client";

import { X, Plus, Coins } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { NeonButton } from "./ui/NeonButton";
import { Portfolio, EXCHANGES_MAPPED } from "../lib/constants";
import { IconWithFallback } from "./IconWithFallback";

interface PortfolioEditModalProps {
  isOpen: boolean;
  portfolio: Portfolio | null;
  onClose: () => void;
  onAddAsset: () => void;
}

export function PortfolioEditModal({ isOpen, portfolio, onClose, onAddAsset }: PortfolioEditModalProps) {
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
              <p className="text-xs text-slate-500 mt-1">Click &quot;Add Asset&quot; to get started</p>
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
          <NeonButton variant="primary" onClick={onAddAsset} icon={Plus} className="flex-1">
            Add Asset
          </NeonButton>
        </div>
      </GlassCard>
    </div>
  );
}
